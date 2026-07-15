import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User'; 
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, role, isActive, phone, salary} = req.body;;

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
  role: role || 'waiter',
  isActive: isActive ?? true,
  phone,
  salary: salary ?? 0
});

    // 4. Save to database
    await newUser.save();

    const token = jwt.sign(
  {
    id: newUser._id,
    role: newUser.role
  },
  process.env.JWT_SECRET as string,
  {
    expiresIn: '7d'
  }
);

    // 5. Send success response (Notice we do NOT send the password back!)
    res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.status(201).json({
  message: "User created successfully!",
  user: {
  _id: newUser._id,
  name: newUser.name,
  email: newUser.email,
  phone: newUser.phone,
  role: newUser.role,
  isActive: newUser.isActive,
  salary: newUser.salary
}
});

  } catch (error) {
    console.error("❌ Error registering user:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
};

export const getEmployees = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const employees = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      role,
      isActive,
      password,
      salary
    } = req.body;


    const updateData:any = {
      name,
      email,
      phone,
      role,
      isActive,
      salary
    };


    // only update password if admin entered a new one
    if(password){
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }


    const updated = await User.findByIdAndUpdate(
      id,
      updateData,
      {new:true}
    ).select('-passwordHash');


    if(!updated){
      return res.status(404).json({
        error:"Employee not found"
      });
    }


    res.status(200).json(updated);

  } catch(error){
    res.status(500).json({
      error:(error as Error).message
    });
  }
};

export const deleteEmployee = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        error: "Employee not found"
      });
    }

    res.status(200).json({
      _id: id
    });

  } catch(error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
};

export const createEmployeeAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
  const {
    name,
    email,
    password,
    role,
    isActive,
    phone,
    salary
  } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      error: "A user with this email already exists"
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create employee account
  const newEmployee = new User({
    name,
    email,
    passwordHash: hashedPassword,
    role: role || 'waiter',
    isActive: isActive ?? true,
    phone,
    salary: salary ?? 0
  });

  await newEmployee.save();

  return res.status(201).json({
    message: "Employee created successfully",
    employee: {
      _id: newEmployee._id,
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      role: newEmployee.role,
      isActive: newEmployee.isActive,
      salary: newEmployee.salary
    }
  });

} catch (error) {
  console.error("Error creating employee:", error);

  return res.status(500).json({
    error: "Failed to create employee"
  });
}
};