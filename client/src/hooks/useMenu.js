import { useEffect, useState } from 'react'
import {
  fetchCategories,
  fetchMenuByCategory,
} from '../services/api'

export function useMenu(activeCategoryId) {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [isLoadingCategories, setLoadingCategories] = useState(true)
  const [isLoadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState(null)

  // Load categories once
  useEffect(() => {
    let active = true

    async function loadCategories() {
      try {
        setLoadingCategories(true)
        setError(null)

        const data = await fetchCategories()

        if (active) {
          setCategories(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (active) {
          setError(err)
        }
      } finally {
        if (active) {
          setLoadingCategories(false)
        }
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [])

  // Load real menu items whenever the selected category changes
  useEffect(() => {
    let active = true

    async function loadItems() {
      if (!activeCategoryId) {
        setItems([])
        return
      }

      try {
        setLoadingItems(true)
        setError(null)

        const data = await fetchMenuByCategory(activeCategoryId)

        if (active) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (active) {
          setError(err)
          setItems([])
        }
      } finally {
        if (active) {
          setLoadingItems(false)
        }
      }
    }

    loadItems()

    return () => {
      active = false
    }
  }, [activeCategoryId])

  return {
    categories,
    items,
    isLoading: isLoadingCategories || isLoadingItems,
    isLoadingCategories,
    isLoadingItems,
    error,
  }
}