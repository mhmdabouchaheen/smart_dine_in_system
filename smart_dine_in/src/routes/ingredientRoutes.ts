import { Router } from 'express'
import {
  checkInventory,
  createIngredient,
  deleteIngredient,
  getIngredientById,
  getIngredients,
  getLowStockIngredients,
  updateIngredient,
} from '../controllers/ingredientController'

const router = Router()

router.post('/check', checkInventory)
router.get('/low-stock', getLowStockIngredients)

router
  .route('/')
  .get(getIngredients)
  .post(createIngredient)

router
  .route('/:id')
  .get(getIngredientById)
  .put(updateIngredient)
  .delete(deleteIngredient)

export default router