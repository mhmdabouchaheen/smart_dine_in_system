import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Customer } from '../models/Customer';

export const registerCustomer = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    const existingCustomer = await Customer.findOne({ email });

    if (existingCustomer) {
      return res.status(400).json({
        error: "Email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      name,
      email,
      passwordHash,
      isGuest: false
    });

    const token = jwt.sign(
      {
        id: customer._id,
        role: "Customer"
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d"
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: "Customer registered successfully",
      user: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        role: "Customer"
      }
    });

  } catch (error) {
    console.error("Customer registration error:", error);

    return res.status(500).json({
      error: "Registration failed"
    });
  }
};