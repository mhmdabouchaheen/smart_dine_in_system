import { Request, Response } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { Customer } from "../models/Customer";
import { Ingredient } from "../models/Ingredient";
import { Notification } from "../models/Notification";
import { Payment } from "../models/Payment";
import { Reservation } from '../models/Reservation';
import { MenuCategory } from '../models/MenuCategory';
import { MenuItem } from '../models/MenuItem';
import { Table } from '../models/Table';
export const seedDatabase = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const manager =
      (await User.findOne({ role: "Manager" })) ||
      (await User.create({
        name: "System Manager",
        email: "manager@example.com",
        passwordHash: "seeded-hash",
        role: "Manager",
      }));

    const order = await Order.findOne();

    const testCustomer =
      (await Customer.findOne({ email: "vip@example.com" })) ||
      (await Customer.create({
        isGuest: false,
        name: "VIP Guest",
        email: "vip@example.com",
        loyaltyPoints: 150,
      }));

    const testIngredient =
      (await Ingredient.findOne({ name: "Premium Coffee Beans" })) ||
      (await Ingredient.create({
        name: "Premium Coffee Beans",
        quantityInStock: 5,
        unit: "kg",
        reorderThreshold: 2,
      }));

    const testNotification = await Notification.create({
      message: "System initialized successfully. Welcome to the team!",
      type: "General",
      senderId: manager._id,
      senderModel: "User",
      senderRole: "Manager",
      recipientRole: "Admin",
    });

    // Ensure at least one menu category, menu item and table exist so orders can be created
    const defaultCategory =
      (await MenuCategory.findOne({ name: 'Main' })) ||
      (await MenuCategory.create({ name: 'Main' }));

    const defaultIngredient =
      (await Ingredient.findOne({ name: 'Premium Coffee Beans' })) ||
      (await Ingredient.create({ name: 'Premium Coffee Beans', quantityInStock: 100, unit: 'kg', reorderThreshold: 5 }));

    const defaultMenuItem =
      (await MenuItem.findOne({ name: 'House Coffee' })) ||
      (await MenuItem.create({
        categoryId: defaultCategory._id,
        name: 'House Coffee',
        description: 'Freshly brewed house blend',
        price: 4.5,
        imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80',
        isAvailable: true,
        preparationTime: 5,
        recipe: [{ ingredientId: defaultIngredient._id, quantityRequired: 0.05 }],
      }));

    const defaultTable =
      (await Table.findOne({ tableNumber: 1 })) ||
      (await Table.create({ tableNumber: 1, capacity: 4, status: 'Available' }));

    let testPayment = null;
    if (order) {
      testPayment = await Payment.create({
        orderId: order._id,
        amount: (order as any).totalAmount || 50.0,
        method: "Card",
        status: "Completed",
      });
    }

    return res.status(201).json({
      message: "Database seeded successfully.",
      created: {
        manager: manager._id,
        customer: testCustomer._id,
        ingredient: testIngredient._id,
        notification: testNotification._id,
        payment: testPayment ? testPayment._id : null,
      },
    });
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return res.status(500).json({ error: "Failed to seed database" });
  }
};
// POST /api/seed/restock
// Tops up ALL ingredient stocks to 999 so ordering never fails due to depleted stock.
export const restockAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await Ingredient.updateMany({}, { $set: { quantityInStock: 999 } });
    res.status(200).json({
      message: `Restocked ${result.modifiedCount} ingredient(s) to 999 units each.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('❌ restockAll error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
