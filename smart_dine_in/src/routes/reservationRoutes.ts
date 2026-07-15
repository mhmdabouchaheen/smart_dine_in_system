import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { CreateReservationSchema } from '../schemas';
import {
  createReservation,
  getReservations,
  getAvailability,
} from '../controllers/reservationController';

const router = Router();

router.post('/', validate(CreateReservationSchema), createReservation);
router.get('/availability', getAvailability);
router.get('/', getReservations);

export default router;
