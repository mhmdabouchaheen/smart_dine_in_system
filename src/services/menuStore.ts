import type { Category, MenuItem } from '../types'
import { readList, writeList } from './localStore'
import { categories as seedCategories, menuItems as seedMenuItems } from './mockData'

const CATEGORIES_KEY = 'noir_sel_categories_db'
const MENU_ITEMS_KEY = 'noir_sel_menu_items_db'

export function listCategories(): Category[] {
  return readList<Category>(CATEGORIES_KEY, seedCategories)
}

export function saveCategory(category: Category): Category {
  const all = listCategories()
  const idx = all.findIndex((c) => c._id === category._id)
  if (idx >= 0) all[idx] = category
  else all.push(category)
  writeList(CATEGORIES_KEY, all)
  return category
}

export function deleteCategory(id: string): void {
  writeList(
    CATEGORIES_KEY,
    listCategories().filter((c) => c._id !== id)
  )
}

export function listMenuItems(): MenuItem[] {
  return readList<MenuItem>(MENU_ITEMS_KEY, seedMenuItems)
}

export function getMenuItem(id: string): MenuItem | undefined {
  return listMenuItems().find((m) => m._id === id)
}

export function saveMenuItem(item: MenuItem): MenuItem {
  const all = listMenuItems()
  const idx = all.findIndex((m) => m._id === item._id)
  if (idx >= 0) all[idx] = item
  else all.unshift(item)
  writeList(MENU_ITEMS_KEY, all)
  return item
}

export function deleteMenuItem(id: string): void {
  writeList(
    MENU_ITEMS_KEY,
    listMenuItems().filter((m) => m._id !== id)
  )
}
