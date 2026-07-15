import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Table } from '../models/Table';
import { LoyaltyTransaction } from '../models/LoyaltyTransaction';
import { LoyaltySettings } from '../models/LoyaltySettings';
import * as loyaltyService from '../services/loyaltyService';
import mongoose, { Types } from 'mongoose';

// ============================================================================
// CUSTOMER-FACING CONTROLLERS
// ============================================================================

/**
 * GET /api/loyalty/me
 * Retrieves current customer's loyalty balance, lifetime earnings/redemptions,
 * and current conversion settings.
 */
export const getMyLoyaltySummary = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const settings = await loyaltyService.getSettings();

    return res.status(200).json({
      loyaltyPoints: customer.loyaltyPoints,
      totalPointsEarned: customer.totalPointsEarned,
      totalPointsRedeemed: customer.totalPointsRedeemed,
      lastRewardActivity: customer.lastRewardActivity,
      settings: {
        pointsPerDollar: settings.pointsPerDollar,
        dollarValuePerPoint: settings.dollarValuePerPoint,
        minimumRedemptionPoints: settings.minimumRedemptionPoints,
        maximumRedemptionPoints: settings.maximumRedemptionPoints,
        isEnabled: settings.isEnabled,
      },
    });
  } catch (error) {
    console.error('❌ getMyLoyaltySummary error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * GET /api/loyalty/me/transactions
 * Retrieves current customer's transaction ledger history, sorted newest first.
 * Supports pagination.
 */
export const getMyTransactions = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = { customerId: new mongoose.Types.ObjectId(customerId) };
    
    const transactions = await LoyaltyTransaction.find(query)
      .populate('orderId', 'totalAmount tableId status')
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoyaltyTransaction.countDocuments(query);

    return res.status(200).json({
      transactions,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('❌ getMyTransactions error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * POST /api/loyalty/calculate-redemption
 * Calculates the maximum redeemable points and discount value for a specific order.
 * Expects orderId in body.
 */
export const calculateRedemption = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const customerId = req.user?.id;
    const { orderId } = req.body;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Valid orderId is required.' });
    }

    const [customer, order, settings] = await Promise.all([
      Customer.findById(customerId),
      Order.findById(orderId),
      loyaltyService.getSettings(),
    ]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const maxRedeemable = loyaltyService.calculateMaxRedeemable(
      order.totalAmount,
      customer.loyaltyPoints,
      settings,
    );

    const discountValue = loyaltyService.pointsToDollars(maxRedeemable, settings);

    return res.status(200).json({
      customerBalance: customer.loyaltyPoints,
      maxRedeemable,
      discountValue,
      dollarValuePerPoint: settings.dollarValuePerPoint,
      minimumRedemptionPoints: settings.minimumRedemptionPoints,
      maximumRedemptionPoints: settings.maximumRedemptionPoints,
    });
  } catch (error) {
    console.error('❌ calculateRedemption error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * POST /api/loyalty/redeem
 * Applies a specific points redemption to an active order.
 * Decrements points and logs the transaction.
 * Expects orderId and pointsToRedeem in body.
 */
export const redeemLoyaltyPoints = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const customerId = req.user?.id;
    const { orderId, pointsToRedeem } = req.body;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Valid orderId is required.' });
    }

    const pointsVal = parseInt(pointsToRedeem);
    if (isNaN(pointsVal) || pointsVal <= 0) {
      return res.status(400).json({ error: 'pointsToRedeem must be a positive integer.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const result = await loyaltyService.redeemPoints(
      new mongoose.Types.ObjectId(customerId),
      new mongoose.Types.ObjectId(orderId),
      pointsVal,
      order.totalAmount,
    );

    // Record the discount and calculate final amount due, leaving the original totalAmount intact
    order.loyaltyDiscount = result.discountApplied;
    order.amountDue = Math.max(0, order.totalAmount - result.discountApplied);
    
    // Check if the order payment method should indicate points were used, or if it stays Card/Cash
    // Since payment method may be partial, let's keep it as is, or set method: 'LoyaltyPoints' if fully discounted.
    await order.save();

    return res.status(200).json({
      message: 'Redemption successful.',
      ...result,
      updatedOrderTotal: order.amountDue,
    });
  } catch (error) {
    console.error('❌ redeemLoyaltyPoints error:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
};


// ============================================================================
// ADMIN/MANAGER-FACING CONTROLLERS
// ============================================================================

/**
 * GET /api/loyalty/settings
 * Retrieves current configurable loyalty settings.
 */
export const getLoyaltySettings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const settings = await loyaltyService.getSettings();
    return res.status(200).json(settings);
  } catch (error) {
    console.error('❌ getLoyaltySettings error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * PUT /api/loyalty/settings
 * Updates configurable loyalty settings.
 */
export const updateLoyaltySettings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const {
      pointsPerDollar,
      dollarValuePerPoint,
      minimumRedemptionPoints,
      maximumRedemptionPoints,
      isEnabled,
    } = req.body;

    const settings = await LoyaltySettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'Loyalty settings not initialized.' });
    }

    if (pointsPerDollar !== undefined) settings.pointsPerDollar = Number(pointsPerDollar);
    if (dollarValuePerPoint !== undefined) settings.dollarValuePerPoint = Number(dollarValuePerPoint);
    if (minimumRedemptionPoints !== undefined) settings.minimumRedemptionPoints = Number(minimumRedemptionPoints);
    if (maximumRedemptionPoints !== undefined) settings.maximumRedemptionPoints = Number(maximumRedemptionPoints);
    if (isEnabled !== undefined) settings.isEnabled = Boolean(isEnabled);
    
    if (userId) {
      settings.updatedBy = new mongoose.Types.ObjectId(userId);
    }

    await settings.save();
    return res.status(200).json(settings);
  } catch (error) {
    console.error('❌ updateLoyaltySettings error:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * GET /api/loyalty/customers
 * Lists all non-guest customers with their cached point balances and totals.
 */
export const getCustomersLoyaltyList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const query = { isGuest: false };

    const customers = await Customer.find(query)
      .select('-passwordHash')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    return res.status(200).json({
      customers,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('❌ getCustomersLoyaltyList error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * GET /api/loyalty/customers/:id
 * Fetches a single customer's details plus their full loyalty transaction log.
 */
export const getCustomerLoyaltyProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const customer = await Customer.findById(id).select('-passwordHash');
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Get all transactions for this customer
    const transactions = await LoyaltyTransaction.find({ customerId: customer._id })
      .populate('orderId')
      .populate('tableId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      customer,
      transactions,
    });
  } catch (error) {
    console.error('❌ getCustomerLoyaltyProfile error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * POST /api/loyalty/adjust
 * Performs a manual points adjustment (ADJUST) on a customer.
 */
export const adjustCustomerPoints = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerUserId = req.user?.id;
    const { customerId, points, reason } = req.body;

    if (!managerUserId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Valid customerId is required.' });
    }

    const pointsVal = parseInt(points);
    if (isNaN(pointsVal) || pointsVal === 0) {
      return res.status(400).json({ error: 'points must be a non-zero integer.' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason for adjustment is required.' });
    }

    await loyaltyService.adjustPoints(
      new mongoose.Types.ObjectId(customerId),
      pointsVal,
      reason,
      new mongoose.Types.ObjectId(managerUserId),
    );

    const updatedCustomer = await Customer.findById(customerId).select('-passwordHash');

    return res.status(200).json({
      message: 'Points adjusted successfully.',
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error('❌ adjustCustomerPoints error:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * GET /api/loyalty/history/table/:tableId
 * Fetches all loyalty transactions linked to a specific table.
 */
export const getTableLoyaltyHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tableId } = req.params as { tableId: string };
    
    let tableObjectId: Types.ObjectId | undefined;
    if (tableId && Types.ObjectId.isValid(tableId)) {
      tableObjectId = new Types.ObjectId(tableId);
    } else {
      // Find table by number
      const num = Number(tableId);
      if (!isNaN(num)) {
        const table = await Table.findOne({ tableNumber: num });
        if (table) tableObjectId = table._id as Types.ObjectId;
      }
    }

    if (!tableObjectId) {
      return res.status(404).json({ error: 'Table not found.' });
    }

    const transactions = await LoyaltyTransaction.find({ tableId: tableObjectId })
      .populate('customerId', 'name email')
      .populate('orderId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      tableId: tableObjectId,
      transactions,
    });
  } catch (error) {
    console.error('❌ getTableLoyaltyHistory error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * GET /api/loyalty/history/customer/:customerId
 * Fetches all orders, tables, items, and loyalty history for a customer
 */
export const getCustomerDetailedHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { customerId } = req.params as { customerId: string };
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const customerObjId = new Types.ObjectId(customerId);

    // Fetch customer details
    const customer = await Customer.findById(customerObjId).select('-passwordHash');
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Fetch transactions
    const transactions = await LoyaltyTransaction.find({ customerId: customerObjId })
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });

    // Fetch all orders where this customer added items OR is customerId
    const orders = await Order.find({
      $or: [
        { customerId: customerObjId },
        { customerIds: customerObjId },
        { 'items.addedByCustomerId': customerObjId },
      ],
    })
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      customer,
      transactions,
      orders,
    });
  } catch (error) {
    console.error('❌ getCustomerDetailedHistory error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
};
