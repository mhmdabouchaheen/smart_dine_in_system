import { Router } from 'express';
import { createOrder, getActiveOrders, updateOrderStatus } from '../controllers/orderController';

const router = Router();
router.route('/').post(createOrder);
router.route('/active').get(getActiveOrders);
router.route('/:id/status').patch(updateOrderStatus);
export default router;