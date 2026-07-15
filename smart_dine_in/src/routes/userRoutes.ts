import express from 'express';
import {
  registerUser,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  createEmployeeAccount
} from '../controllers/userController';

import {
  authMiddleware,
  authorizeRoles
} from '../middlewares/authMiddleware';


const router = express.Router();


router.post(
 '/register',
 authMiddleware,
 authorizeRoles('Admin', 'Manager'),
 registerUser
);

router.post(
  '/employees',
  authMiddleware,
  authorizeRoles('Admin', 'Manager'),
  createEmployeeAccount
);

router.get(
 '/',
 authMiddleware,
 authorizeRoles('Admin', 'Manager'),
 getEmployees
);


router.put(
 '/:id',
 authMiddleware,
 authorizeRoles('Admin', 'Manager'),
 updateEmployee
);


router.delete(
 '/:id',
 authMiddleware,
 authorizeRoles('Admin', 'Manager'),
 deleteEmployee
);

export default router;