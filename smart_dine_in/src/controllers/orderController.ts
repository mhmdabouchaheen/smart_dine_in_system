import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Table } from '../models/Table';
import { Ingredient } from '../models/Ingredient';
import { Customer } from '../models/Customer';
import { awardPointsForOrder } from '../services/loyaltyService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * An order is "active" (eligible to be merged into) only if BOTH:
 *   1. status is in ACTIVE_ORDER_STATUSES
 *   2. paymentStatus is NOT 'Paid'  (bug fix — paid orders are immutable to new items)
 *
 * Business rule confirmed: Q4=(c) paid orders re-opened by staff only,
 * Q5: finalized = paymentStatus='Paid' OR status='Completed'/'Cancelled'
 */
const ACTIVE_ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function objectIdOrUndefined(id: unknown): Types.ObjectId | undefined {
  if (!id) return undefined;
  // Already an ObjectId — return as-is
  if (id instanceof Types.ObjectId) return id;
  // String that is a valid ObjectId
  if (typeof id === 'string' && Types.ObjectId.isValid(id)) return new Types.ObjectId(id);
  return undefined;
}

/**
 * Resolves a tableId that may be a MongoDB ObjectId string OR a plain table number.
 * Returns a Types.ObjectId or undefined if not resolvable.
 */
async function resolveTableId(
  tableId: unknown,
  session?: mongoose.ClientSession,
): Promise<Types.ObjectId | undefined> {
  if (typeof tableId !== 'string' && typeof tableId !== 'number') return undefined;
  const str = String(tableId);

  if (Types.ObjectId.isValid(str)) {
    const found = await Table.findById(str).session(session ?? null);
    if (found) return found._id as Types.ObjectId;
  }

  const asNumber = Number(str);
  if (!Number.isNaN(asNumber)) {
    const byNumber = await Table.findOne({ tableNumber: asNumber }).session(session ?? null);
    if (byNumber) return byNumber._id as Types.ObjectId;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// 1. Create Order (Bug-fixed + Loyalty-aware)
// ---------------------------------------------------------------------------

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const session: any = null;

  try {
    const {
      tableId, items, customerId, userId, reservationId,
      paymentMethod, paymentStatus, needsAssistance,
    } = req.body;

    // --- SAFETY CHECK ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    const tableObjectId = await resolveTableId(tableId, session);
    if (!tableObjectId) throw new Error('Valid table is required.');

    const customerObjectId = objectIdOrUndefined(customerId);
    const userObjectId = objectIdOrUndefined(userId);

    console.log(`[orderController] createOrder body: tableId=${tableId}, customerId=${customerId}, paymentStatus=${paymentStatus}`);
    console.log(`[orderController] resolved customerObjectId: ${customerObjectId}`);

    // Process items and deduct inventory
    let calculatedTotal = 0;
    const processedItems: Array<{
      menuItemId: Types.ObjectId;
      name: string;
      quantity: number;
      unitPrice: number;
      specialInstructions: string;
      addedByCustomerId: Types.ObjectId | null;
      addedAt: Date;
    }> = [];

    const addedAt = new Date();

    for (const item of items) {
      const safeQuantity = Number(item.quantity);
      if (!safeQuantity || isNaN(safeQuantity) || safeQuantity < 1) {
        throw new Error(`Invalid quantity for menu item: ${item.menuItemId || item.name}.`);
      }

      let dbItem = null;
      if (item.menuItemId && Types.ObjectId.isValid(item.menuItemId)) {
        dbItem = await MenuItem.findById(item.menuItemId).session(session);
      }
      if (!dbItem && item.name) {
        dbItem = await MenuItem.findOne({ name: item.name }).session(session);
      }
      if (!dbItem) {
        throw new Error(`Menu item ${item.menuItemId || item.name} not found.`);
      }

      // Inventory check
      for (const recipeItem of dbItem.recipe) {
        const ingredient = await Ingredient.findById(recipeItem.ingredientId).session(session);
        if (!ingredient) {
          console.warn(`⚠️ Ingredient ${recipeItem.ingredientId} not found for ${dbItem.name}, skipping.`);
          continue;
        }
        const totalRequired = recipeItem.quantityRequired * safeQuantity;
        if (ingredient.quantityInStock < totalRequired) {
          throw new Error(`Insufficient stock for ${ingredient.name}.`);
        }
        ingredient.quantityInStock -= totalRequired;
        await ingredient.save({ session });
      }

      calculatedTotal += dbItem.price * safeQuantity;
      processedItems.push({
        menuItemId: dbItem._id as Types.ObjectId,
        name: dbItem.name,
        quantity: safeQuantity,
        unitPrice: dbItem.price,
        specialInstructions: item.specialInstructions || '',
        // Ownership: assign the logged-in customer, or null for guests
        addedByCustomerId: customerObjectId ?? null,
        addedAt,
      });
    }

    // -------------------------------------------------------------------
    // BUG FIX: Look for existing active order with correct ownership filter
    //
    // Business rules (confirmed in GUEST_ORDER_BUG_HANDOFF.md):
    //   Q1:  One shared order per table for everyone
    //   Q2:  Guest orders are independent of customer orders
    //   Q3:  Multiple guests share one guest order per table
    //   Q4:  Paid orders are immutable (staff-only re-open) → exclude paymentStatus: 'Paid'
    //   Q5:  Finalized = paymentStatus:'Paid' OR status:'Completed'/'Cancelled'
    //   Q10: Two logged-in customers share one order, tracked via customerIds[]
    //
    // Key fix: add paymentStatus: { $ne: 'Paid' } to BOTH lookup paths.
    // -------------------------------------------------------------------

    let existingOrder;

    if (customerObjectId) {
      // Logged-in customer → find the active CUSTOMER order for this table
      // (guest orders for the same table are NOT merged into)
      existingOrder = await Order.findOne({
        tableId: tableObjectId,
        status: { $in: ACTIVE_ORDER_STATUSES },
        paymentStatus: { $ne: 'Paid' },           // BUG FIX: never merge into paid orders
        customerId: { $exists: true, $ne: null }, // customer orders only
      }).session(session).sort({ createdAt: -1 });
    } else {
      // Guest → find the active GUEST order for this table
      // (customer orders for the same table are NOT merged into)
      existingOrder = await Order.findOne({
        tableId: tableObjectId,
        status: { $in: ACTIVE_ORDER_STATUSES },
        paymentStatus: { $ne: 'Paid' },           // BUG FIX: never merge into paid orders
        $or: [
          { customerId: null },
          { customerId: { $exists: false } },
        ],
      }).session(session).sort({ createdAt: -1 });
    }

    if (existingOrder) {
      // Merge new items into the existing order
      processedItems.forEach((newItem) => {
        const existingItem = existingOrder.items.find(
          (line) =>
            line.menuItemId.toString() === newItem.menuItemId.toString() &&
            (line.specialInstructions || '') === newItem.specialInstructions &&
            // Only merge if owned by the same customer (or both null/guest)
            (line.addedByCustomerId?.toString() ?? null) ===
              (newItem.addedByCustomerId?.toString() ?? null),
        );

        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          // Update timestamp to latest add
          existingItem.addedAt = newItem.addedAt;
        } else {
          existingOrder.items.push(newItem as any);
        }
      });

      existingOrder.totalAmount += calculatedTotal;
      existingOrder.paymentStatus = paymentStatus || existingOrder.paymentStatus;
      existingOrder.needsAssistance = existingOrder.needsAssistance || (needsAssistance ?? false);
      existingOrder.paymentMethod = paymentMethod || existingOrder.paymentMethod || 'card';

      if (customerObjectId) {
        if (!existingOrder.customerId) existingOrder.customerId = customerObjectId;
        existingOrder.customerIds = existingOrder.customerIds || [];
        if (!existingOrder.customerIds.some((id) => id.toString() === customerObjectId.toString())) {
          existingOrder.customerIds.push(customerObjectId);
        }
      }

      if (userObjectId) {
        if (!existingOrder.userId) existingOrder.userId = userObjectId;
        existingOrder.userIds = existingOrder.userIds || [];
        if (!existingOrder.userIds.some((id) => id.toString() === userObjectId.toString())) {
          existingOrder.userIds.push(userObjectId);
        }
      }

      existingOrder.orderSummary = existingOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

      await existingOrder.save({ session });
      await Table.findByIdAndUpdate(tableObjectId, { status: 'Occupied' }, { session });

      // --- Loyalty: award points if this update finalizes payment ---
      if (
        customerObjectId &&
        existingOrder.paymentStatus === 'Paid' &&
        !existingOrder.loyaltyProcessed
      ) {
        await awardPointsForOrder(
          existingOrder._id as Types.ObjectId,
          customerObjectId,
          session,
        );
      }

      
      
      res.status(200).json(existingOrder);
      return;
    }

    // Fetch customer details
    let customerName = 'Guest';
    let customerEmail = 'guest@table';
    if (customerObjectId) {
      const customer = await Customer.findById(customerObjectId).session(session);
      if (customer) {
        customerName = customer.name || 'Customer';
        customerEmail = customer.email || '';
      }
    }

    const orderSummary = processedItems.map(i => `${i.quantity}x ${i.name}`).join(', ');

    // Create a brand-new order
    const newOrder = new Order({
      tableId: tableObjectId,
      items: processedItems,
      orderSummary,
      totalAmount: calculatedTotal,
      customerId: customerObjectId,
      customerIds: customerObjectId ? [customerObjectId] : [],
      userId: userObjectId,
      userIds: userObjectId ? [userObjectId] : [],
      customerName,
      customerEmail,
      reservationId,
      status: 'Pending',
      paymentStatus: paymentStatus || 'Pending',
      needsAssistance: needsAssistance ?? false,
      paymentMethod: paymentMethod || 'card',
      loyaltyProcessed: false,
    });

    await newOrder.save({ session });
    await Table.findByIdAndUpdate(tableObjectId, { status: 'Occupied' }, { session });

    // --- Loyalty: award points if new order is immediately paid ---
    if (customerObjectId && newOrder.paymentStatus === 'Paid' && !newOrder.loyaltyProcessed) {
      await awardPointsForOrder(
        newOrder._id as Types.ObjectId,
        customerObjectId,
        session,
      );
    }

    
    
    res.status(201).json(newOrder);

  } catch (error) {
    
    
    console.error('❌ createOrder error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
};

// ---------------------------------------------------------------------------
// 2. Get Active Orders
// ---------------------------------------------------------------------------

export const getActiveOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] } })
      .populate('tableId', 'tableNumber status')
      .sort({ createdAt: 1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('❌ getActiveOrders error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// ---------------------------------------------------------------------------
// 3. Update Order Status
// ---------------------------------------------------------------------------

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const session: any = null;

  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      
      
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // --- Loyalty: award points when order is marked Paid (staff flow) ---
    const isBeingPaid =
      paymentStatus === 'Paid' &&
      order.paymentStatus !== 'Paid' &&
      !order.loyaltyProcessed;

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    // Free the table when order is fully resolved
    if (status === 'Completed' || status === 'Cancelled') {
      await Table.findByIdAndUpdate(order.tableId, { status: 'Available' }, { session });
    }

    await order.save({ session });

    if (isBeingPaid && order.customerId) {
      await awardPointsForOrder(
        order._id as Types.ObjectId,
        order.customerId,
        session,
      );
    }

    
    
    res.status(200).json(order);
  } catch (error) {
    
    
    console.error('❌ updateOrderStatus error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// ---------------------------------------------------------------------------
// 4. Update Order (Edit items / full update)
// ---------------------------------------------------------------------------

export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  const session: any = null;

  try {
    const { id } = req.params as { id: string };
    const updates = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      
      
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const customerObjectId = objectIdOrUndefined(updates.customerId || order.customerId);

    // Apply allowed updates
    if (updates.items !== undefined && Array.isArray(updates.items)) {
      order.items = updates.items.map((item: any) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: Number(item.quantity || item.qty),
        unitPrice: Number(item.unitPrice || item.price),
        specialInstructions: item.specialInstructions || '',
        addedByCustomerId: item.addedByCustomerId ? objectIdOrUndefined(item.addedByCustomerId) : (customerObjectId ?? null),
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
      })) as any;
      order.orderSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    }

    if (updates.totalAmount !== undefined) order.totalAmount = Number(updates.totalAmount);
    if (updates.status !== undefined) order.status = updates.status;
    
    const previousPaymentStatus = order.paymentStatus;
    if (updates.paymentStatus !== undefined) order.paymentStatus = updates.paymentStatus;
    if (updates.needsAssistance !== undefined) order.needsAssistance = Boolean(updates.needsAssistance);
    if (updates.note !== undefined) order.note = updates.note;
    if (updates.noteAt !== undefined) order.noteAt = new Date(updates.noteAt);

    // Free the table when order is fully resolved
    if (updates.status === 'Completed' || updates.status === 'Cancelled') {
      await Table.findByIdAndUpdate(order.tableId, { status: 'Available' }, { session });
    }

    // --- Loyalty: award points if this update finalizes payment ---
    const isBeingPaid =
      order.paymentStatus === 'Paid' &&
      previousPaymentStatus !== 'Paid' &&
      !order.loyaltyProcessed;

    await order.save({ session });

    // Use order.customerId directly (already a Types.ObjectId from DB) — reliable over objectIdOrUndefined
    const awardsCustomerId = (order.customerId as Types.ObjectId | undefined) ?? customerObjectId;
    if (isBeingPaid && awardsCustomerId) {
      await awardPointsForOrder(
        order._id as Types.ObjectId,
        awardsCustomerId,
        session,
      );
    }

    
    
    res.status(200).json(order);
  } catch (error) {
    
    
    console.error('❌ updateOrder error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// ---------------------------------------------------------------------------
// 5. Request Assistance
// ---------------------------------------------------------------------------

export const requestAssistance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, tableNumber, reason } = req.body;
    let order = null;

    if (orderId && Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }

    if (!order && tableNumber !== undefined) {
      const tableNumberValue = Number(tableNumber);
      if (!Number.isNaN(tableNumberValue)) {
        const table = await Table.findOne({ tableNumber: tableNumberValue });
        if (table) {
          order = await Order.findOne({
            tableId: table._id,
            status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] },
          }).sort({ createdAt: -1 });
        }
      }
    }

    if (!order) {
      res.status(404).json({ error: 'Active order not found for assistance request.' });
      return;
    }

    order.needsAssistance = true;
    if (reason) order.note = reason;
    order.noteAt = new Date();
    await order.save();

    res.status(200).json({ ok: true, order });
  } catch (error) {
    console.error('❌ requestAssistance error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// ---------------------------------------------------------------------------
// 6. Add Order Note
// ---------------------------------------------------------------------------

export const addOrderNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { note: note || '', noteAt: new Date() },
      { new: true },
    );

    if (!updatedOrder) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('❌ addOrderNote error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// ---------------------------------------------------------------------------
// 7. Get Table Orders
// ---------------------------------------------------------------------------

export const getTableOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const tableId = req.params.tableId as string;
    const tableObjectId = await resolveTableId(tableId);

    if (!tableObjectId) {
      res.status(404).json({ error: 'Table not found.' });
      return;
    }

    const activeOrders = await Order.find({
      tableId: tableObjectId,
      status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] },
    }).sort({ createdAt: -1 });

    res.status(200).json(activeOrders);
  } catch (error) {
    console.error('❌ getTableOrders error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
