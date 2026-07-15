import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { CreateOrderSchema } from '../schemas';
import {
  createOrder,
  getActiveOrders,
  updateOrder,
  updateOrderStatus,
  requestAssistance,
  addOrderNote,
  getTableOrders // Added new import
} from '../controllers/orderController';

const router = Router();

// General Routes
router.route('/').post(validate(CreateOrderSchema), createOrder);
router.route('/active').get(getActiveOrders);
router.route('/assistance').post(requestAssistance);

// Specific Entity Routes
router.route('/table/:tableId').get(getTableOrders); // Added new route
router.route('/:id').put(updateOrder);
router.route('/:id/note').put(addOrderNote);
router.route('/:id/status').patch(updateOrderStatus);

export default router;