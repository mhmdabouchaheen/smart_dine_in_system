export default function MenuList({ items, activeItemId, onSelect }) {
  return (
    <div>
      {items.map((item, idx) => {
        const isActive = item._id === activeItemId
        return (
          <button
            key={item._id}
            onClick={() => onSelect(item._id)}
            className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-300 ${
              idx !== 0 ? 'border-t border-white/10' : ''
            } ${isActive ? 'bg-ember' : 'bg-noir-900 hover:bg-noir-850'}`}
          >
            <div>
              <p
                className={`text-[10px] uppercase tracking-widest2 mb-1 ${
                  isActive ? 'text-noir-950/70' : 'text-bone-faint'
                }`}
              >
                N&#176; {item.no}
              </p>
              <p
                className={`font-display text-lg ${
                  isActive ? 'text-noir-950' : 'text-bone'
                }`}
              >
                {item.name}
              </p>
            </div>
            <span
              className={`font-display text-lg shrink-0 ${
                isActive ? 'text-noir-950' : 'text-ember'
              }`}
            >
              ${item.price}
            </span>
          </button>
        )
      })}
    </div>
  )
}
