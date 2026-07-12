import { Router } from 'express'
import {
  createIngredient,
  deleteIngredient,
  getIngredientById,
  getIngredients,
  getLowStockIngredients,
  updateIngredient,
} from '../controllers/ingredientController'

const router = Router()

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