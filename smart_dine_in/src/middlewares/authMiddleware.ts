import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
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