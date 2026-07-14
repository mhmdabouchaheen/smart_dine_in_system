import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { Ingredient } from '../models/Ingredient'
import { MenuItem } from '../models/MenuItem'

const ALLOWED_UNITS = ['kg', 'g', 'L', 'ml', 'pieces'] as const

export const getIngredients = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const ingredients = await Ingredient.find().sort({ name: 1 })

    res.status(200).json(ingredients)
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export const checkInventory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : []
    const menuItemIds = items
      .map((item: any) => item.menuItemId)
      .filter(Boolean)

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
    })

    const ingredientIds = menuItems
      .flatMap((menuItem) => (menuItem.recipe || []).map((recipe) => String(recipe.ingredientId)))
      .filter(Boolean)

    const ingredients = await Ingredient.find({
      _id: { $in: ingredientIds },
    })

    const ingredientById = new Map(
      ingredients.map((ingredient) => [String(ingredient._id), ingredient]),
    )

    const requiredByIngredient = new Map<string, number>()
    const issues: Array<{
      menuItemId: string
      menuItemName: string
      ingredientName: string
      needed: number
      available: number
      unit: string
    }> = []

    for (const line of items) {
      const menuItem = menuItems.find(
        (menuItem) => String(menuItem._id) === String(line.menuItemId),
      )
      if (!menuItem?.recipe) continue

      for (const reqLine of menuItem.recipe) {
        const ingredientId = String(reqLine.ingredientId)
        const qty = Number(line.qty ?? 0)
        if (qty <= 0) continue
        requiredByIngredient.set(
          ingredientId,
          (requiredByIngredient.get(ingredientId) || 0) + Number(reqLine.quantityRequired || 0) * qty,
        )
      }
    }

    for (const line of items) {
      const menuItem = menuItems.find(
        (menuItem) => String(menuItem._id) === String(line.menuItemId),
      )
      if (!menuItem?.recipe) continue

      for (const reqLine of menuItem.recipe) {
        const ingredient = ingredientById.get(String(reqLine.ingredientId))
        if (!ingredient) continue

        const totalNeeded = requiredByIngredient.get(String(reqLine.ingredientId)) || 0
        if (totalNeeded > ingredient.quantityInStock) {
          issues.push({
            menuItemId: String(menuItem._id),
            menuItemName: menuItem.name,
            ingredientName: ingredient.name,
            needed: totalNeeded,
            available: ingredient.quantityInStock,
            unit: ingredient.unit,
          })
        }
      }
    }

    const deduped = Array.from(
      new Map(issues.map((issue) => [`${issue.menuItemId}:${issue.ingredientName}`, issue])).values(),
    )

    res.status(200).json({ ok: deduped.length === 0, issues: deduped })
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export const getIngredientById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        error: 'Invalid ingredient ID',
      })
      return
    }

    const ingredient = await Ingredient.findById(id)

    if (!ingredient) {
      res.status(404).json({
        error: 'Ingredient not found',
      })
      return
    }

    res.status(200).json(ingredient)
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export const createIngredient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      quantityInStock,
      unit,
      reorderThreshold,
    } = req.body

    if (!name?.trim()) {
      res.status(400).json({
        error: 'Ingredient name is required',
      })
      return
    }

    if (!ALLOWED_UNITS.includes(unit)) {
      res.status(400).json({
        error:
          'Unit must be one of: kg, g, L, ml, pieces',
      })
      return
    }

    if (
      quantityInStock !== undefined &&
      Number(quantityInStock) < 0
    ) {
      res.status(400).json({
        error: 'Quantity in stock cannot be negative',
      })
      return
    }

    if (
      reorderThreshold !== undefined &&
      Number(reorderThreshold) < 0
    ) {
      res.status(400).json({
        error: 'Reorder threshold cannot be negative',
      })
      return
    }

    const existingIngredient = await Ingredient.findOne({
      name: name.trim(),
    })

    if (existingIngredient) {
      res.status(409).json({
        error: 'An ingredient with this name already exists',
      })
      return
    }

    const ingredient = await Ingredient.create({
      name: name.trim(),
      quantityInStock: Number(quantityInStock ?? 0),
      unit,
      reorderThreshold: Number(reorderThreshold ?? 10),
    })

    res.status(201).json(ingredient)
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export const updateIngredient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        error: 'Invalid ingredient ID',
      })
      return
    }

    const updates: Record<string, unknown> = {}

    if (req.body.name !== undefined) {
      updates.name = String(req.body.name).trim()
    }

    if (req.body.quantityInStock !== undefined) {
      const quantity = Number(req.body.quantityInStock)

      if (quantity < 0) {
        res.status(400).json({
          error: 'Quantity in stock cannot be negative',
        })
        return
      }

      updates.quantityInStock = quantity
    }

    if (req.body.unit !== undefined) {
      if (!ALLOWED_UNITS.includes(req.body.unit)) {
        res.status(400).json({
          error:
            'Unit must be one of: kg, g, L, ml, pieces',
        })
        return
      }

      updates.unit = req.body.unit
    }

    if (req.body.reorderThreshold !== undefined) {
      const threshold = Number(req.body.reorderThreshold)

      if (threshold < 0) {
        res.status(400).json({
          error: 'Reorder threshold cannot be negative',
        })
        return
      }

      updates.reorderThreshold = threshold
    }

    const ingredient = await Ingredient.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      },
    )

    if (!ingredient) {
      res.status(404).json({
        error: 'Ingredient not found',
      })
      return
    }

    res.status(200).json(ingredient)
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export const deleteIngredient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        error: 'Invalid ingredient ID',
      })
      return
    }

    const ingredient = await Ingredient.findByIdAndDelete(id)

    if (!ingredient) {
      res.status(404).json({
        error: 'Ingredient not found',
      })
      return
    }

    res.status(200).json({
      _id: ingredient._id,
      message: 'Ingredient deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export const getLowStockIngredients = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const ingredients = await Ingredient.find({
      $expr: {
        $lt: ['$quantityInStock', '$reorderThreshold'],
      },
    }).sort({ quantityInStock: 1 })

    res.status(200).json(ingredients)
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}