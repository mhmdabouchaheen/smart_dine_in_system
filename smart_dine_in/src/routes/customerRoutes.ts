import express from 'express';
import { registerCustomer } from '../controllers/customerController';

const router = express.Router();

router.post('/signup', registerCustomer);

export default router;