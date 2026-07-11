import express from 'express';
import { registerUser } from '../controllers/userController';

const router = express.Router();

// POST route to register a new user: http://localhost:5000/api/users/register
router.post('/register', registerUser);

export default router;