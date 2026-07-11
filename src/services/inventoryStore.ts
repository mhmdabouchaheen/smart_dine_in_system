import type { Ingredient } from '../types'
import { readList, writeList } from './localStore'
import { ingredients as seedIngredients } from './mockData'
import { addNotification } from './notificationsStore'

const KEY = 'noir_sel_inventory_db'

function readAll(): Ingredient[] {
  return readList<Ingredient>(KEY, seedIngredients)
}

function writeAll(items: Ingredient[]): void {
  writeList<Ingredient>(KEY, items)
}

export function listIngredients(): Ingredient[] {
  return readAll()
}

export function getIngredient(id: string): Ingredient | undefined {
  return readAll().find((i) => i._id === id)
}

function maybeNotifyLowStock(before: Ingredient | undefined, after: Ingredient): void {
  const wasAbove = !before || before.quantityInStock >= before.lowStockThreshold
  const nowBelow = after.quantityInStock < after.lowStockThreshold
  // Only fire the moment stock *crosses* the threshold, so restocking or
  // repeated small edits don't spam duplicate alerts.
  if (wasAbove && nowBelow) {
    addNotification({
      _id: `notif-${Date.now()}`,
      userId: 'emp-02',
      type: 'inventory',
      message: `${after.name} is running low — ${after.quantityInStock} ${after.unit} left (threshold: ${after.lowStockThreshold}).`,
      referenceId: after._id,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
  }
}

export function createIngredient(ingredient: Ingredient): Ingredient {
  const all = readAll()
  all.unshift(ingredient)
  writeAll(all)
  if (ingredient.quantityInStock < ingredient.lowStockThreshold) {
    maybeNotifyLowStock(undefined, ingredient)
  }
  return ingredient
}

export function updateIngredient(id: string, updates: Partial<Ingredient>): Ingredient | undefined {
  const all = readAll()
  const idx = all.findIndex((i) => i._id === id)
  if (idx === -1) return undefined
  const before = all[idx]
  const after = { ...before, ...updates }
  all[idx] = after
  writeAll(all)
  maybeNotifyLowStock(before, after)
  return after
}

export function deleteIngredient(id: string): void {
  writeAll(readAll().filter((i) => i._id !== id))
}

/**
 * Decrements stock for a set of menu-item order lines according to each
 * item's recipe. Call this only after a stock check has confirmed
 * availability. Also fires low-stock notifications for anything that
 * crosses below its threshold as a result.
 */
export function decrementForOrder(
  lines: { menuItemId: string; qty: number }[],
  recipesByMenuItemId: Record<string, { ingredientId: string; quantityRequired: number }[]>
): void {
  const all = readAll()
  const byId = new Map(all.map((i) => [i._id, i]))

  for (const line of lines) {
    const recipe = recipesByMenuItemId[line.menuItemId] || []
    for (const req of recipe) {
      const ing = byId.get(req.ingredientId)
      if (!ing) continue
      const before = { ...ing }
      ing.quantityInStock = Math.max(0, ing.quantityInStock - req.quantityRequired * line.qty)
      maybeNotifyLowStock(before, ing)
    }
  }

  writeAll(Array.from(byId.values()))
}
