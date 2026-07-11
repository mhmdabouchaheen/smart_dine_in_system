import express from 'express';
import { seedDatabase } from '../controllers/seedController';

const router = express.Router();

// GET route to trigger the seed script: http://localhost:5000/api/seed
router.get('/', seedDatabase);

export default router;