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
 authorizeRoles('admin', 'manager'),
 registerUser
);

router.post(
  '/employees',
  authMiddleware,
  authorizeRoles('admin', 'manager'),
  createEmployeeAccount
);

router.get(
 '/',
 authMiddleware,
 authorizeRoles('admin', 'manager'),
 getEmployees
);


router.put(
 '/:id',
 authMiddleware,
 authorizeRoles('admin', 'manager'),
 updateEmployee
);


router.delete(
 '/:id',
 authMiddleware,
 authorizeRoles('admin', 'manager'),
 deleteEmployee
);

export default router;