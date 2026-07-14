import express from 'express';
import { seedDatabase, restockAll } from '../controllers/seedController';

const router = express.Router();

// GET route to trigger the seed script: http://localhost:5000/api/seed
router.get('/', seedDatabase);

// POST route to top-up all ingredient stocks: http://localhost:5000/api/seed/restock
router.post('/restock', restockAll);

export default router;