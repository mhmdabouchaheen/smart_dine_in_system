import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Table } from '../models/Table';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableId, items, customerId, userId, reservationId } = req.body;
    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      if (!dbItem) {
        res.status(404).json({ error: `Menu item ${item.menuItemId} not found.` });
        return;
      }
      calculatedTotal += dbItem.price * item.quantity;
      processedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        specialInstructions: item.specialInstructions || ''
      });
    }

    const newOrder = await Order.create({
      tableId, 
      items: processedItems, 
      totalAmount: calculatedTotal,
      customerId, 
      userId, 
      reservationId,
      status: 'Pending',
      paymentStatus: 'Pending'
    } as any); // Bypass overload check

    await Table.findByIdAndUpdate(tableId, { status: 'Occupied' });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getActiveOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] } })
      .populate('tableId', 'tableNumber status')
      .sort({ createdAt: 1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(id, { status, paymentStatus }, { new: true });
    
    if (status === 'Completed' || status === 'Cancelled') {
      await Table.findByIdAndUpdate(updatedOrder?.tableId, { status: 'Available' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};