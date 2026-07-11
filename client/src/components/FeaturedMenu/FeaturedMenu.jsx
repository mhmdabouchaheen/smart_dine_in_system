import { useCart } from '../../context/CartContext'
import SectionHeading from '../ui/SectionHeading'

export default function FeaturedMenu({ items = [] }) {
  const { addItem } = useCart()

  if (items.length === 0) {
    return null
  }

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-24">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
        <SectionHeading
          eyebrow="Chef's Selection"
          title="Signature"
          accent="dishes."
        />

        <p className="text-bone-dim text-sm max-w-xs">
          Discover a selection of dishes prepared from our current menu.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-white/10">
        {items.map((item) => (
          <article
            key={item._id}
            className="bg-noir-950 group"
          >
            <div className="aspect-[4/3] overflow-hidden bg-noir-800">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              )}
            </div>

            <div className="p-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-display italic text-xl">
                  {item.name}
                </p>

                <p className="text-bone-faint text-xs uppercase tracking-widest2 mt-1">
                  {item.preparationTime
                    ? `${item.preparationTime} minutes`
                    : 'Freshly prepared'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => addItem(item)}
                disabled={item.isAvailable === false}
                className="shrink-0 text-ember font-display text-lg hover:text-ember-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Add ${item.name} to order`}
              >
                +${Number(item.price ?? 0).toFixed(2)}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}