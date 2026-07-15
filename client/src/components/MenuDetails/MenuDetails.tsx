import { Clock, Flame } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useCart } from '../../context/cartContextValue'
import { useIngredients } from '../../hooks/useIngredients'
import type { Category, MenuItem } from '../../types'

interface MenuDetailsProps {
  item: MenuItem | null
  category?: Category
  onClose: () => void
}

export default function MenuDetails({ item, category, onClose }: MenuDetailsProps) {
  const { addItem } = useCart()
  const { ingredients } = useIngredients()

  if (!item) return null

  const recipeLines = (item.recipe || []).map((line) => {
    const ingredient = ingredients.find((i) => i._id === line.ingredientId)
    return {
      name: ingredient?.name || 'Ingredient',
      unit: ingredient?.unit || '',
      quantity: line.quantityRequired,
    }
  })

  return (
    <Modal isOpen={!!item} onClose={onClose} title={item.name} subtitle={category ? `${category.name} — Course 0${item.course}` : undefined} maxWidth="max-w-2xl">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-[4/3] overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <p className="text-bone-dim text-sm leading-relaxed">{item.description}</p>

          {item.prepTimeMinutes && (
            <div className="flex items-center gap-2 mt-4 text-ember text-xs uppercase tracking-widest2">
              <Clock size={13} /> ~{item.prepTimeMinutes} min prep time
            </div>
          )}

          {recipeLines.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="eyebrow mb-3 flex items-center gap-1.5">
                <Flame size={12} /> Ingredients (per serving)
              </p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                {recipeLines.map((line, idx) => (
                  <li key={idx} className="text-sm text-bone-dim flex items-center justify-between">
                    <span>{line.name}</span>
                    <span className="text-bone-faint">
                      {line.quantity} {line.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-6">
            <Button
              className="w-full"
              onClick={() => {
                addItem(item)
                onClose()
              }}
            >
              Add to Order — ${item.price}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
