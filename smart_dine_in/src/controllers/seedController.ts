import { Request, Response } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { Customer } from "../models/Customer";
import { Ingredient } from "../models/Ingredient";
import { Notification } from "../models/Notification";
import { Payment } from "../models/Payment";
import { Reservation } from '../models/Reservation';
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
      type: "GeneralNote",
      senderId: manager._id,
      targetRole: "All",
    });

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
