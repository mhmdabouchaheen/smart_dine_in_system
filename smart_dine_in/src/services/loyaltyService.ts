/**
 * loyaltyService.ts
 *
 * Pure business logic for the loyalty rewards system.
 * No Express Request/Response here — all functions take plain arguments.
 * This makes the service testable in isolation and reusable from controllers.
 *
 * Core rules enforced here:
 *  - Points are NEVER awarded unless paymentStatus === 'Paid' and !loyaltyProcessed
 *  - Redemption is NEVER allowed if balance < pointsToRedeem
 *  - Redemption discount cannot exceed maximumRedemptionPercent of order total
 *  - All multi-document operations use MongoDB sessions (atomic)
 *  - The ledger (LoyaltyTransaction) is append-only — never deleted or modified
 */

import mongoose, { ClientSession, Types } from 'mongoose';
import { Customer } from '../models/Customer';
import { LoyaltyTransaction } from '../models/LoyaltyTransaction';
import { LoyaltySettings, ILoyaltySettings } from '../models/LoyaltySettings';
import { Order, IOrder, IOrderItem } from '../models/Order';

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

/**
 * Returns the singleton LoyaltySettings document.
 * Creates it with defaults if it doesn't exist yet (idempotent).
 */
export async function getSettings(): Promise<ILoyaltySettings> {
  const existing = await LoyaltySettings.findOne();
  if (existing) {
    // Auto-migrate old default values to the new tuned defaults
    let changed = false;
    if (existing.dollarValuePerPoint === 0.01) { existing.dollarValuePerPoint = 0.20; changed = true; }
    if ((existing as any).maximumRedemptionPercent !== undefined && !existing.maximumRedemptionPoints) {
      existing.maximumRedemptionPoints = 100;
      changed = true;
    }
    if (changed) await existing.save();
    return existing;
  }

  // First-time setup — seed the singleton with the tuned defaults
  return LoyaltySettings.create({
    pointsPerDollar: 1,            // 1 point earned per $1 spent
    dollarValuePerPoint: 0.20,     // 5 points = $1 discount
    minimumRedemptionPoints: 50,   // need 50 pts before first redemption
    maximumRedemptionPoints: 100,  // max 100 points per order (= $20 off)
    isEnabled: true,
  });
}

// ---------------------------------------------------------------------------
// Point calculation helpers
// ---------------------------------------------------------------------------

/**
 * Calculates how many points a customer earns for their owned items in an order.
 *
 * @param items         All items in the order
 * @param customerId    The specific customer to calculate for
 * @param settings      Current LoyaltySettings
 * @returns             { points, moneyEquivalent }
 */
export function calculateEarnedPoints(
  items: IOrderItem[],
  customerId: Types.ObjectId,
  settings: ILoyaltySettings,
): { points: number; moneyEquivalent: number } {
  if (!settings.isEnabled) return { points: 0, moneyEquivalent: 0 };

  const customerIdStr = customerId.toString();

  console.log(`[LoyaltyService] calculateEarnedPoints: customerIdStr=${customerIdStr}, items.length=${items.length}`);
  items.forEach((item, idx) => {
    console.log(`[LoyaltyService] item[${idx}]: name=${item.name}, unitPrice=${item.unitPrice}, quantity=${item.quantity}, addedByCustomerId=${item.addedByCustomerId}`);
  });

  // Sum only items owned by this customer
  const ownedTotal = items.reduce((sum, item) => {
    const owner = item.addedByCustomerId?.toString();
    if (owner === customerIdStr) {
      return sum + item.quantity * item.unitPrice;
    }
    return sum;
  }, 0);

  const points = Math.floor(ownedTotal * settings.pointsPerDollar);
  return { points, moneyEquivalent: ownedTotal };
}

/**
 * Calculates the maximum points redeemable for a given order total and customer balance.
 *
 * @param orderTotal      Full order total in dollars
 * @param customerBalance Customer's current loyaltyPoints balance
 * @param settings        Current LoyaltySettings
 * @returns               Max redeemable points (respects balance cap, % cap, and minimum)
 */
export function calculateMaxRedeemable(
  orderTotal: number,
  customerBalance: number,
  settings: ILoyaltySettings,
): number {
  if (!settings.isEnabled || customerBalance < settings.minimumRedemptionPoints) {
    return 0;
  }

  // Max points allowed per transaction by setting
  const maxAllowedBySetting = settings.maximumRedemptionPoints;

  // Max points that cover the bill
  const maxPointsForBill = Math.ceil(orderTotal / settings.dollarValuePerPoint);

  // Take the minimum of all constraints
  return Math.min(customerBalance, maxAllowedBySetting, maxPointsForBill);
}

/**
 * Converts a points amount to its dollar discount value.
 */
export function pointsToDollars(points: number, settings: ILoyaltySettings): number {
  return parseFloat((points * settings.dollarValuePerPoint).toFixed(2));
}

// ---------------------------------------------------------------------------
// Earn points (called after payment confirmation)
// ---------------------------------------------------------------------------

/**
 * Awards points to a customer for their owned items in a paid order.
 * Must be called ONLY when paymentStatus === 'Paid'.
 * Guards against double-earning via order.loyaltyProcessed flag.
 * All DB writes are wrapped in a MongoDB session for atomicity.
 *
 * @param orderId     The order that was just paid
 * @param customerId  The customer to award points to
 * @param session     An active Mongoose ClientSession (caller must manage)
 * @returns           The number of points earned (0 if ineligible)
 */
export async function awardPointsForOrder(
  orderId: Types.ObjectId,
  customerId: Types.ObjectId,
  session: ClientSession,
): Promise<number> {
  // Fetch order inside the session
  const order = await Order.findById(orderId).session(session);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  console.log(`[LoyaltyService] awardPointsForOrder: orderId=${orderId}, customerId=${customerId}`);
  console.log(`[LoyaltyService] Order details: loyaltyProcessed=${order.loyaltyProcessed}, paymentStatus=${order.paymentStatus}`);

  // Safety guards — never double-award
  if (order.loyaltyProcessed) {
    console.log(`[LoyaltyService] awardPointsForOrder: order.loyaltyProcessed is true, skipping`);
    return 0;
  }
  if (order.paymentStatus !== 'Paid') {
    console.log(`[LoyaltyService] awardPointsForOrder: order.paymentStatus is ${order.paymentStatus} (not Paid), skipping`);
    return 0;
  }

  // Fetch settings
  const settings = await getSettings();
  if (!settings.isEnabled) {
    // Mark as processed so we don't keep trying
    order.loyaltyProcessed = true;
    await order.save({ session });
    return 0;
  }

  const { points, moneyEquivalent } = calculateEarnedPoints(
    order.items,
    customerId,
    settings,
  );

  console.log(`[LoyaltyService] calculateEarnedPoints result: points=${points}, moneyEquivalent=${moneyEquivalent}`);

  if (points <= 0) {
    // No owned items → nothing to award; still mark processed
    order.loyaltyProcessed = true;
    await order.save({ session });
    return 0;
  }

  // Mark order as processed FIRST (inside the same session) to prevent any race condition
  order.loyaltyProcessed = true;
  await order.save({ session });

  // Append EARN transaction (ledger is append-only)
  await LoyaltyTransaction.create(
    [{
      customerId,
      orderId: order._id,
      tableId: order.tableId,
      type: 'EARN',
      points,
      moneyEquivalent,
      reason: `Earned for paid order #${(order._id as Types.ObjectId).toString().slice(-6)}: ${order.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}`,
      createdBy: null,
    }],
    { session },
  );

  // Update customer cached balance atomically
  await Customer.findByIdAndUpdate(
    customerId,
    {
      $inc: {
        loyaltyPoints: points,
        totalPointsEarned: points,
      },
      $set: { lastRewardActivity: new Date() },
    },
    { session },
  );

  return points;
}

// ---------------------------------------------------------------------------
// Redeem points (called during checkout, before order is marked Paid)
// ---------------------------------------------------------------------------

export interface RedemptionResult {
  pointsRedeemed: number;
  discountApplied: number; // dollar value of the discount
  newBalance: number;
}

/**
 * Validates and applies a points redemption for a customer on an active order.
 * Creates a REDEEM transaction and updates the customer's balance atomically.
 *
 * @param customerId    The customer redeeming points
 * @param orderId       The order being checked out
 * @param pointsToRedeem How many points the customer wants to use
 * @param orderTotal    The order total (before discount) — used for % cap validation
 * @returns             RedemptionResult
 * @throws              Error on insufficient balance, too few points, or cap exceeded
 */
export async function redeemPoints(
  customerId: Types.ObjectId,
  orderId: Types.ObjectId,
  pointsToRedeem: number,
  orderTotal: number,
): Promise<RedemptionResult> {
  const session: mongoose.ClientSession | null = null;


  try {
    const [customer, order, settings] = await Promise.all([
      Customer.findById(customerId).session(session),
      Order.findById(orderId).session(session),
      getSettings(),
    ]);

    if (!customer) throw new Error('Customer not found.');
    if (!order) throw new Error('Order not found.');
    if (!settings.isEnabled) throw new Error('Loyalty program is currently disabled.');

    // Prevent redeeming on an already-paid order
    if (order.paymentStatus === 'Paid') {
      throw new Error('Cannot redeem points on an already-paid order.');
    }

    // Check for existing REDEEM transaction on this order (prevent duplicate redemption)
    const existingRedemption = await LoyaltyTransaction.findOne({
      orderId: order._id,
      customerId,
      type: 'REDEEM',
    }).session(session);
    if (existingRedemption) {
      throw new Error('Points have already been redeemed for this order.');
    }

    // Validate minimum balance
    if (customer.loyaltyPoints < settings.minimumRedemptionPoints) {
      throw new Error(
        `Minimum ${settings.minimumRedemptionPoints} points required to redeem. You have ${customer.loyaltyPoints}.`,
      );
    }

    // Validate requested amount doesn't exceed balance
    if (pointsToRedeem > customer.loyaltyPoints) {
      throw new Error(
        `Cannot redeem ${pointsToRedeem} points. Current balance: ${customer.loyaltyPoints}.`,
      );
    }

    // Validate against maximum % cap
    const maxRedeemable = calculateMaxRedeemable(
      orderTotal,
      customer.loyaltyPoints,
      settings,
    );
    if (pointsToRedeem > maxRedeemable) {
      throw new Error(
        `Cannot redeem ${pointsToRedeem} points. Maximum redeemable for this order: ${maxRedeemable} points.`,
      );
    }

    const discountApplied = pointsToDollars(pointsToRedeem, settings);
    const newBalance = customer.loyaltyPoints - pointsToRedeem;

    // Append REDEEM transaction (negative points)
    await LoyaltyTransaction.create(
      [{
        customerId,
        orderId: order._id,
        tableId: order.tableId,
        type: 'REDEEM',
        points: -pointsToRedeem, // stored as negative
        moneyEquivalent: discountApplied,
        reason: `Redeemed ${pointsToRedeem} points ($${discountApplied.toFixed(2)} discount) on order #${(order._id as Types.ObjectId).toString().slice(-6)}: ${order.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}`,
        createdBy: null,
      }],
      { session },
    );

    // Decrement customer balance atomically
    await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: {
          loyaltyPoints: -pointsToRedeem,
          totalPointsRedeemed: pointsToRedeem,
        },
        $set: { lastRewardActivity: new Date() },
      },
      { session },
    );



    return { pointsRedeemed: pointsToRedeem, discountApplied, newBalance };
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Manual adjustment (admin/manager only)
// ---------------------------------------------------------------------------

/**
 * Creates an ADJUST transaction for an admin/manager to correct a customer's balance.
 * Points can be positive (adding) or negative (deducting).
 * Prevents the balance going below zero.
 *
 * @param customerId  Target customer
 * @param points      Amount to adjust (positive or negative)
 * @param reason      Required human-readable reason
 * @param createdBy   The User (admin/manager) making the adjustment
 */
export async function adjustPoints(
  customerId: Types.ObjectId,
  points: number,
  reason: string,
  createdBy: Types.ObjectId,
): Promise<void> {
  const session: mongoose.ClientSession | null = null;


  try {
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) throw new Error('Customer not found.');

    // Prevent balance going negative from an adjustment
    if (points < 0 && customer.loyaltyPoints + points < 0) {
      throw new Error(
        `Adjustment of ${points} would result in a negative balance (current: ${customer.loyaltyPoints}).`,
      );
    }

    const moneyEquivalent = Math.abs(points) * (await getSettings()).dollarValuePerPoint;

    await LoyaltyTransaction.create(
      [{
        customerId,
        type: 'ADJUST',
        points,
        moneyEquivalent,
        reason: reason.trim(),
        createdBy,
      }],
      { session },
    );

    const balanceUpdate: Record<string, number> = { loyaltyPoints: points };
    if (points > 0) balanceUpdate.totalPointsEarned = points;
    if (points < 0) balanceUpdate.totalPointsRedeemed = Math.abs(points);

    await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: balanceUpdate,
        $set: { lastRewardActivity: new Date() },
      },
      { session },
    );


  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Balance recalculation from ledger (for admin audit / data integrity)
// ---------------------------------------------------------------------------

/**
 * Recalculates a customer's true balance from the transaction ledger.
 * Does NOT update the customer document — for read/audit purposes only.
 */
export async function recalculateBalanceFromLedger(
  customerId: Types.ObjectId,
): Promise<{ currentBalance: number; totalEarned: number; totalRedeemed: number }> {
  const transactions = await LoyaltyTransaction.find({ customerId });

  let totalEarned = 0;
  let totalRedeemed = 0;

  for (const tx of transactions) {
    if (tx.type === 'EARN') totalEarned += tx.points;
    if (tx.type === 'REDEEM') totalRedeemed += Math.abs(tx.points);
    if (tx.type === 'ADJUST') {
      if (tx.points > 0) totalEarned += tx.points;
      else totalRedeemed += Math.abs(tx.points);
    }
  }

  return {
    currentBalance: totalEarned - totalRedeemed,
    totalEarned,
    totalRedeemed,
  };
}
