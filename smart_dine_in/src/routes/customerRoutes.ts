import express from 'express';
import { registerCustomer, getProfile, updateProfile } from '../controllers/customerController';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/signup', registerCustomer);

router.get('/me', authMiddleware, authorizeRoles('Customer'), getProfile);
router.put('/me', authMiddleware, authorizeRoles('Customer'), updateProfile);

export default router;