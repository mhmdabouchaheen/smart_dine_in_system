import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({
        error: "Not authenticated"
      });
      return;
    }

    const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET as string
) as {
  id: string;
  role: string;
};


if (decoded.role !== "Customer") {
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    res.status(403).json({
      error: "Your account has been suspended"
    });
    return;
  }
}


req.user = decoded;

next();

  } catch (error) {
    res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};


export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Not authenticated"
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role.toLowerCase())) {
      res.status(403).json({
        error: "Access denied"
      });
      return;
    }

    next();
  };
};