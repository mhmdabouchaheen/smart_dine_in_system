import { Request, Response } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { Customer } from "../models/Customer";
import { Ingredient } from "../models/Ingredient";
import { Notification } from "../models/Notification";
import { Payment } from "../models/Payment";

export const seedDatabase = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    // 1. Find the Manager and Order you already created
    const manager = await User.findOne({ role: "Manager" });
    const order = await Order.findOne();

    if (!manager || !order) {
      return res.status(400).json({
        error:
          "Missing relations. Make sure you have created at least one User and one Order first!",
      });
    }

    // 2. Create a test Customer
    const testCustomer = new Customer({
      isGuest: false,
      name: "VIP Guest",
      email: "vip@example.com",
      loyaltyPoints: 150,
    });
    await testCustomer.save();

    // 3. Create a test Ingredient for the kitchen
    const testIngredient = new Ingredient({
      name: "Premium Coffee Beans",
      quantityInStock: 5,
      unit: "kg",
      reorderThreshold: 2,
    });
    await testIngredient.save();

    // 4. Create a test Notification from the Manager
    const testNotification = new Notification({
      message: "System initialized successfully. Welcome to the team!",
      type: "GeneralNote",
      senderId: manager._id,
      targetRole: "All",
    });
    await testNotification.save();

    // 5. Create a test Payment linked to your existing order
    const testPayment = new Payment({
      orderId: order._id,
      amount: (order as any).totalPrice || 50.0,
      method: "Card",
      status: "Completed",
    });
    await testPayment.save();

    // 6. Send success response!
    return res.status(201).json({
      message: "Database seeded successfully! All collections are now visible.",
    });
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return res.status(500).json({ error: "Failed to seed database" });
  }
};
