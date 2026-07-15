import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import type { NotificationRole } from '../models/Notification'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: NotificationRole
  }
}

function normalizeRole(
  value: unknown,
): NotificationRole | null {
  const role = String(value ?? '')
    .trim()
    .toLowerCase()

  switch (role) {
    case 'admin':
      return 'Admin'

    case 'waiter':
      return 'Waiter'

    case 'customer':
      return 'Customer'

    default:
      return null
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token

    if (!token) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const secret = process.env.JWT_SECRET

    if (!secret) {
      res.status(500).json({
        error: 'JWT secret is not configured',
      })
      return
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


const role = normalizeRole(decoded.role)

if (!role) {
  res.status(403).json({
    error: 'Invalid role',
  })
  return
}

req.user = {
  id: decoded.id,
  role,
}

next()
  } catch {
    res.status(401).json({
      error: 'Invalid or expired token',
    })
  }
}

export const authorizeRoles = (
  ...allowedRoles: NotificationRole[]
) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied',
      })
      return
    }

    next()
  }
}