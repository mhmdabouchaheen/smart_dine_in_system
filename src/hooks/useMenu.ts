import { useEffect, useState } from 'react'
import { fetchCategories, fetchMenu } from '../services/api'
import type { Category, MenuItem } from '../types'

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const [cats, menu] = await Promise.all([fetchCategories(), fetchMenu()])
        if (!active) return
        setCategories(cats)
        setItems(menu)
      } catch (err) {
        if (active) setError(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return { categories, items, isLoading, error }
}
