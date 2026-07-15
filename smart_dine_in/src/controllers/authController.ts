import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { Customer } from '../models/Customer';

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });

const customer = !user
  ? await Customer.findOne({ email })
  : null;

    if (!user && !customer) {
  return res.status(400).json({
    error: "Invalid email or password"
  });
}

    // 2. Compare entered password with hashed password
    const account = user || customer;


// Check if employee account is suspended
if (user && !user.isActive) {
  return res.status(403).json({
    error: "Your account has been suspended"
  });
}


const isPasswordValid = await bcrypt.compare(
  password,
  account!.passwordHash as string
);

    if (!isPasswordValid) {
      return res.status(400).json({
        error: "Invalid email or password"
      });
    }



const token = jwt.sign(
  {
    id: account!._id,
    role: user ? user.role : "Customer"
  },
  process.env.JWT_SECRET as string,
  {
    expiresIn: '7d'
  }
);

    // 3. Return user info (without password)
    res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.status(200).json({
  message: "Login successful",
  user: {
  _id: account!._id,
  name: account!.name,
  email: account!.email,
  role: user ? user.role : "Customer"
}
});
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Login failed"
    });
  }
};

export const signupCustomer = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });

    if (existingCustomer) {
      return res.status(400).json({
        error: "An account with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await Customer.create({
      isGuest: false,
      name,
      email,
      phone: phone || undefined,
      passwordHash,
      loyaltyPoints: 0,
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: customer._id,
        role: "Customer",
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    // Store token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        role: "Customer",
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create account",
    });
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });

  res.status(200).json({
    message: "Logged out successfully"
  });
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const authReq = req as any;

    const { id, role } = authReq.user;

    let account;

    if (role === "Customer") {
      account = await Customer.findById(id);
    } else {
      account = await User.findById(id);
    }

    if (!account) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    return res.status(200).json({
      user: {
        _id: account._id,
        name: account.name,
        email: account.email,
        role: role
      }
    });

  } catch (error) {
    return res.status(401).json({
      error: "Not authenticated"
    });
  }
};