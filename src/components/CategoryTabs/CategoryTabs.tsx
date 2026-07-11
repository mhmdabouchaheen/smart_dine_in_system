import type { Category } from '../../types'

interface CategoryTabsProps {
  categories: Category[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

export default function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-5 py-2.5 text-xs uppercase tracking-widest2 border transition-colors ${
          activeId === null ? 'bg-ember border-ember text-noir-950' : 'border-white/15 text-bone-dim hover:border-white/40'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onSelect(cat._id)}
          className={`px-5 py-2.5 text-xs uppercase tracking-widest2 border transition-colors ${
            activeId === cat._id
              ? 'bg-ember border-ember text-noir-950'
              : 'border-white/15 text-bone-dim hover:border-white/40'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
