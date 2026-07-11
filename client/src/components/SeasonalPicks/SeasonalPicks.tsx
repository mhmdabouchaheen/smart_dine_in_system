import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import SectionHeading from '../ui/SectionHeading'
import type { MenuItem } from '../../types'

interface SeasonalPicksProps {
  items: MenuItem[]
  onSelect: (item: MenuItem) => void
}

export default function SeasonalPicks({ items, onSelect }: SeasonalPicksProps) {
  const { addItem } = useCart()

  if (items.length === 0) return null

  return (
    <section className="bg-noir-900/40 border-y border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-24">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <SectionHeading
            eyebrow="Right Now"
            title="Seasonal"
            accent="picks."
            description="Rotated as the market and the cellar allow. Here only for a handful of weeks."
          />
          <Link to="/menu?filter=seasonal" className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone">
            See What&rsquo;s In Season &rarr;
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((item) => (
            <article
              key={item._id}
              className="flex gap-5 border border-white/10 p-5 hover:border-ember/40 transition-colors group"
            >
              <button onClick={() => onSelect(item)} className="w-28 h-28 shrink-0 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-700"
                />
              </button>
              <div className="flex-1 flex flex-col">
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest2 text-ember mb-1">
                  <Leaf size={11} /> Seasonal
                </span>
                <button onClick={() => onSelect(item)} className="text-left">
                  <p className="font-display italic text-lg">{item.name}</p>
                  <p className="text-bone-faint text-xs mt-1 line-clamp-2">{item.tagline}</p>
                </button>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-ember font-display text-lg">${item.price}</span>
                  <button
                    onClick={() => addItem(item)}
                    className="text-[11px] uppercase tracking-widest2 text-bone-dim hover:text-bone"
                  >
                    Add to Order
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
