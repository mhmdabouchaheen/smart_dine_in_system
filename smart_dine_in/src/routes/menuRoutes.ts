import { Router } from 'express';
import { 
  createCategory, 
  getCategories, 
  createMenuItem, 
  getMenuItemsByCategory,
  updateMenuItem
} from '../controllers/menuController';

const router = Router();

router.route('/categories')
  .post(createCategory)
  .get(getCategories);

router.route('/items')
  .post(createMenuItem);

router.route('/items/:id')
  .put(updateMenuItem);

router.route('/items/category/:categoryId')
  .get(getMenuItemsByCategory);

export default router;