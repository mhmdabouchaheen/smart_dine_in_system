import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import SectionHeading from '../ui/SectionHeading'
import type { MenuItem } from '../../types'

interface BestSellersProps {
  items: MenuItem[]
  onSelect: (item: MenuItem) => void
}

export default function BestSellers({ items, onSelect }: BestSellersProps) {
  const { addItem } = useCart()

  if (items.length === 0) return null

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-24">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
        <SectionHeading eyebrow="Guest Favorites" title="Best" accent="sellers." />
        <Link to="/menu" className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone">
          View Full Menu &rarr;
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-white/10">
        {items.map((item) => (
          <article key={item._id} className="bg-noir-950 group">
            <button onClick={() => onSelect(item)} className="relative aspect-[4/3] overflow-hidden w-full text-left block">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-noir-950/80 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-widest2 text-ember">
                <Flame size={11} /> Best Seller
              </span>
            </button>
            <div className="p-6 flex items-start justify-between gap-4">
              <button onClick={() => onSelect(item)} className="text-left">
                <p className="font-display italic text-xl">{item.name}</p>
                <p className="text-bone-faint text-xs uppercase tracking-widest2 mt-1">{item.tagline}</p>
              </button>
              <button
                onClick={() => addItem(item)}
                className="shrink-0 text-ember font-display text-lg hover:text-ember-light transition-colors"
                aria-label={`Add ${item.name} to order`}
              >
                +${item.price}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
