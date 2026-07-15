import { Router } from 'express';
import { 
  createCategory, 
  getCategories, 
  createMenuItem, 
  getMenuItemsByCategory,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuController';

const router = Router();

router.route('/categories')
  .post(createCategory)
  .get(getCategories);

router.route('/items')
  .post(createMenuItem);

router.route('/items/:id')
  .put(updateMenuItem)
  .delete(deleteMenuItem);

router.route('/items/category/:categoryId')
  .get(getMenuItemsByCategory);

export default router;