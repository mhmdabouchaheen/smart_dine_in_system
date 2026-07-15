import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Table } from '../models/Table';
import { Reservation } from '../models/Reservation';
import { Ingredient } from '../models/Ingredient';

const ACTIVE_ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served'] as const;

function objectIdOrUndefined(id: unknown): Types.ObjectId | undefined {
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) return undefined;
  return new Types.ObjectId(id);
}

// 1. Create Order (Secured with Transactions & Inventory)
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      tableId, items, customerId, userId, reservationId,
      paymentMethod, paymentStatus, needsAssistance,
    } = req.body;

    // --- SAFETY CHECK ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    // Resolve table before looking up/creating the table-level order.
    let tableObjId = tableId;
    if (Types.ObjectId.isValid(tableId)) {
      const foundTable = await Table.findById(tableId).session(session);
      if (foundTable) tableObjId = foundTable._id;
    } else {
      const asNumber = Number(tableId);
      if (!Number.isNaN(asNumber)) {
        const byNumber = await Table.findOne({ tableNumber: asNumber }).session(session);
        if (byNumber) tableObjId = byNumber._id;
      }
    }

    if (!Types.ObjectId.isValid(tableObjId)) {
      throw new Error('Valid table is required.');
    }

    const tableObjectId = new Types.ObjectId(tableObjId);
    const customerObjectId = objectIdOrUndefined(customerId);
    const userObjectId = objectIdOrUndefined(userId);

    let calculatedTotal = 0;
    const processedItems: Array<{
      menuItemId: Types.ObjectId;
      name: string;
      quantity: number;
      unitPrice: number;
      specialInstructions: string;
    }> = [];

    for (const item of items) {
      const safeQuantity = Number(item.quantity);
      if (!safeQuantity || isNaN(safeQuantity) || safeQuantity < 1) {
        throw new Error(`Invalid quantity for menu item ID: ${item.menuItemId || item.name}.`);
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

      // Inventory check — skip if item has no recipe (e.g. user-created items without recipes)
      for (const recipeItem of dbItem.recipe) {
        const ingredient = await Ingredient.findById(recipeItem.ingredientId).session(session);
        if (!ingredient) {
          // Ingredient was deleted or never existed — skip stock check for this line
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
        menuItemId: dbItem._id,
        name: dbItem.name,
        quantity: safeQuantity,
        unitPrice: dbItem.price,
        specialInstructions: item.specialInstructions || ''
      });
    }

    let existingOrder;
    if (customerObjectId) {
      existingOrder = await Order.findOne({
        tableId: tableObjectId,
        status: { $in: ACTIVE_ORDER_STATUSES },
        paymentStatus: { $ne: 'Paid' },
        customerId: { $exists: true, $ne: null },
      }).session(session).sort({ createdAt: -1 });
    } else {
      existingOrder = await Order.findOne({
        tableId: tableObjectId,
        status: { $in: ACTIVE_ORDER_STATUSES },
        paymentStatus: { $ne: 'Paid' },
        $or: [
          { customerId: null },
          { customerId: { $exists: false } }
        ]
      }).session(session).sort({ createdAt: -1 });
    }

    if (existingOrder) {
      processedItems.forEach((newItem) => {
        const existingItem = existingOrder.items.find(
          (line) =>
            line.menuItemId.toString() === newItem.menuItemId.toString() &&
            (line.specialInstructions || '') === newItem.specialInstructions,
        );

        if (existingItem) {
          existingItem.quantity += newItem.quantity;
        } else {
          existingOrder.items.push(newItem);
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

      await existingOrder.save({ session });
      await Table.findByIdAndUpdate(tableObjectId, { status: 'Occupied' }, { session });

      await session.commitTransaction();
      session.endSession();
      res.status(200).json(existingOrder);
      return;
    }

    const newOrder = new Order({
      tableId: tableObjectId,
      items: processedItems,
      totalAmount: calculatedTotal,
      customerId: customerObjectId,
      customerIds: customerObjectId ? [customerObjectId] : [],
      userId: userObjectId,
      userIds: userObjectId ? [userObjectId] : [],
      reservationId,
      status: 'Pending',
      paymentStatus: paymentStatus || 'Pending',
      needsAssistance: needsAssistance ?? false,
      paymentMethod: paymentMethod || 'card',
    });

    await newOrder.save({ session });
    await Table.findByIdAndUpdate(tableObjectId, { status: 'Occupied' }, { session });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(newOrder);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ createOrder error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
};

// 2. Get Active Orders
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

// 3. Update Order Status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(id, { status, paymentStatus }, { new: true });
    
    if (updatedOrder && (status === 'Completed' || status === 'Cancelled')) {
      await Table.findByIdAndUpdate(updatedOrder.tableId, { status: 'Available' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('❌ updateOrderStatus error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// 4. Update Order (Edit)
export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['items', 'totalAmount', 'status', 'paymentStatus', 'needsAssistance', 'note', 'noteAt'];
    const sanitizedUpdates: Record<string, unknown> = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    });

    const updatedOrder = await Order.findByIdAndUpdate(id, sanitizedUpdates, { new: true });
    if (!updatedOrder) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('❌ updateOrder error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// 5. Request Assistance
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
            status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] } 
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

// 6. Add Order Note
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

// 7. Get Table Orders (NEW)
export const getTableOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const tableId = req.params.tableId as string;

    // Resolve table (handles both MongoDB ObjectId and plain Table Number)
    let tableObjId: any = tableId;
    if (!Types.ObjectId.isValid(tableId)) {
      const asNumber = Number(tableId);
      if (!Number.isNaN(asNumber)) {
        const byNumber = await Table.findOne({ tableNumber: asNumber });
        if (byNumber) tableObjId = byNumber._id;
      }
    }

    // Find active orders for this specific table
    const activeOrders = await Order.find({
      tableId: tableObjId,
      status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] } 
    }).sort({ createdAt: -1 });

    res.status(200).json(activeOrders);
  } catch (error) {
    console.error('❌ getTableOrders error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
