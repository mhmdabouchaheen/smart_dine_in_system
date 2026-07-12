import express from 'express';
import { registerUser } from '../controllers/userController';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

router.post(
  '/register',
  authMiddleware,
  authorizeRoles('admin'),
  registerUser
);

export default router;