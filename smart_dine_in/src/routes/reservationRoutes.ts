import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getAvailability,
} from '../controllers/reservationController';

const router = Router();

router.post('/', createReservation);
router.get('/availability', getAvailability);
router.get('/', getReservations);

export default router;
