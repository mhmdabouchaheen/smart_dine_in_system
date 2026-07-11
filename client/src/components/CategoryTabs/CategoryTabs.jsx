export default function CategoryTabs({ categories, activeId, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 border border-white/10">
      {categories.map((cat, idx) => {
        const isActive = cat._id === activeId
        return (
          <button
            key={cat._id}
            onClick={() => onSelect(cat._id)}
            className={`text-left px-8 py-7 transition-colors duration-300 ${
              idx !== 0 ? 'sm:border-l border-white/10' : ''
            } ${isActive ? 'bg-noir-850' : 'bg-transparent hover:bg-noir-850/60'}`}
          >
            <p
              className={`font-display italic text-2xl mb-2 transition-colors ${
                isActive ? 'text-ember' : 'text-bone-dim'
              }`}
            >
              {cat.index}
            </p>
            <p className="uppercase text-sm tracking-widest2 font-medium text-bone">
              {cat.name}
            </p>
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mt-1">
              {cat.latin}
            </p>
          </button>
        )
      })}
    </div>
  )
}
