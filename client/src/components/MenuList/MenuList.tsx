import { Flame, Leaf } from 'lucide-react'
import { useCart } from '../../context/cartContextValue'
import type { MenuItem } from '../../types'

interface MenuListProps {
  items: MenuItem[]
  onSelect: (item: MenuItem) => void
}

export default function MenuList({ items, onSelect }: MenuListProps) {
  const { addItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="py-24 text-center border border-white/10">
        <p className="font-display italic text-2xl text-bone-dim">No dishes match those filters.</p>
        <p className="text-bone-faint text-sm mt-2">Try widening your search or price range.</p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
      {items.map((item) => (
        <article key={item._id} className="bg-noir-950 group flex flex-col">
          <button onClick={() => onSelect(item)} className="relative aspect-[4/3] overflow-hidden text-left">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              {item.isBestSeller && (
                <span className="flex items-center gap-1 bg-noir-950/85 backdrop-blur px-2 py-1 text-[9px] uppercase tracking-widest2 text-ember">
                  <Flame size={10} /> Best Seller
                </span>
              )}
              {item.isSeasonal && (
                <span className="flex items-center gap-1 bg-noir-950/85 backdrop-blur px-2 py-1 text-[9px] uppercase tracking-widest2 text-ember">
                  <Leaf size={10} /> Seasonal
                </span>
              )}
            </div>
          </button>
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => onSelect(item)} className="text-left">
              <p className="font-display italic text-xl">{item.name}</p>
              <p className="text-bone-faint text-xs uppercase tracking-widest2 mt-1">{item.tagline}</p>
            </button>
            <div className="mt-auto flex items-center justify-between pt-5">
              <span className="text-ember font-display text-xl">${item.price}</span>
              <button
                onClick={() => addItem(item)}
                className="text-[11px] uppercase tracking-widest2 text-bone-dim hover:text-bone border border-white/15 hover:border-ember px-3 py-2 transition-colors"
              >
                Add to Order
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
