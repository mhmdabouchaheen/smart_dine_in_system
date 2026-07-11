import { useEffect, useState } from 'react'
import { fetchIngredients } from '../services/api'
import type { Ingredient } from '../types'

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchIngredients().then((data) => {
      if (active) {
        setIngredients(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return { ingredients, isLoading }
}
