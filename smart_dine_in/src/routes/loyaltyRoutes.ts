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
router.get('/me', authMiddleware, authorizeRoles('Customer'), getMyLoyaltySummary);
router.get('/me/transactions', authMiddleware, authorizeRoles('Customer'), getMyTransactions);
router.post('/calculate-redemption', authMiddleware, authorizeRoles('Customer'), calculateRedemption);
router.post('/redeem', authMiddleware, authorizeRoles('Customer'), redeemLoyaltyPoints);

// ============================================================================
// Admin & Manager-Facing Routes
// ============================================================================
router.get('/settings', authMiddleware, authorizeRoles('Admin', 'Manager'), getLoyaltySettings);
router.put('/settings', authMiddleware, authorizeRoles('Admin', 'Manager'), updateLoyaltySettings);
router.get('/customers', authMiddleware, authorizeRoles('Admin', 'Manager'), getCustomersLoyaltyList);
router.get('/customers/:id', authMiddleware, authorizeRoles('Admin', 'Manager'), getCustomerLoyaltyProfile);
router.post('/adjust', authMiddleware, authorizeRoles('Admin', 'Manager'), adjustCustomerPoints);
router.get('/history/table/:tableId', authMiddleware, authorizeRoles('Admin', 'Manager'), getTableLoyaltyHistory);
router.get('/history/customer/:customerId', authMiddleware, authorizeRoles('Admin', 'Manager'), getCustomerDetailedHistory);

export default router;
