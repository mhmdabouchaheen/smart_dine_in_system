import express, { Request, Response } from 'express';
import {
  loginUser,
  signupCustomer,
  logoutUser,
  getCurrentUser
} from '../controllers/authController';
import { authMiddleware, AuthRequest, authorizeRoles } from '../middlewares/authMiddleware';
import { User } from '../models/User';



const router = express.Router();

router.post('/login', loginUser);
router.post('/signup', signupCustomer);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).select(
      '-passwordHash'
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json({
      user
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to get user"
    });
  }
});


export default router;