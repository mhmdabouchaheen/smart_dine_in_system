import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User'; 

export const registerUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "A user with this email already exists" });
    }

    // 2. Encrypt (Hash) the password
    const salt = await bcrypt.genSalt(10); // Generates a random string to mix with the password
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the new user document
    const newUser = new User({
      name,
      email,
      passwordHash: hashedPassword,
      role: role || 'Waiter' // Defaults to Waiter if no role is provided
    });

    // 4. Save to database
    await newUser.save();

    // 5. Send success response (Notice we do NOT send the password back!)
    return res.status(201).json({
      message: "User created successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("❌ Error registering user:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
};