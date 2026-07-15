import { Router } from 'express';
import {
  getMyLoyaltySummary,
  getMyTransactions,
  calculateRedemption,
  redeemLoyaltyPoints,
  getLoyaltySettings,
  updateLoyaltySettings,
  getCustomersLoyaltyList,
  getCustomerLoyaltyProfile,
  adjustCustomerPoints,
  getTableLoyaltyHistory,
  getCustomerDetailedHistory,
} from '../controllers/loyaltyController';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// ============================================================================
// Customer-Facing Routes (Logged-in customer only)
// ============================================================================
router.get('/me', authMiddleware, authorizeRoles('customer'), getMyLoyaltySummary);
router.get('/me/transactions', authMiddleware, authorizeRoles('customer'), getMyTransactions);
router.post('/calculate-redemption', authMiddleware, authorizeRoles('customer'), calculateRedemption);
router.post('/redeem', authMiddleware, authorizeRoles('customer'), redeemLoyaltyPoints);

// ============================================================================
// Admin & Manager-Facing Routes
// ============================================================================
router.get('/settings', authMiddleware, authorizeRoles('admin', 'manager'), getLoyaltySettings);
router.put('/settings', authMiddleware, authorizeRoles('admin', 'manager'), updateLoyaltySettings);
router.get('/customers', authMiddleware, authorizeRoles('admin', 'manager'), getCustomersLoyaltyList);
router.get('/customers/:id', authMiddleware, authorizeRoles('admin', 'manager'), getCustomerLoyaltyProfile);
router.post('/adjust', authMiddleware, authorizeRoles('admin', 'manager'), adjustCustomerPoints);
router.get('/history/table/:tableId', authMiddleware, authorizeRoles('admin', 'manager'), getTableLoyaltyHistory);
router.get('/history/customer/:customerId', authMiddleware, authorizeRoles('admin', 'manager'), getCustomerDetailedHistory);

export default router;
