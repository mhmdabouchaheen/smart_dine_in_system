import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../context/CartContext'

export default function MenuDetails({ item, category }) {
  const { addItem, totalCount, openDrawer } = useCart()

  if (!item) {
    return (
      <div className="p-8 md:p-10 flex items-center justify-center min-h-full bg-noir-950">
        <p className="text-bone-dim">Select a menu item.</p>
      </div>
    )
  }

  const composition = Array.isArray(item.composition)
    ? item.composition
    : []

  const formattedPrice = Number(item.price ?? 0).toFixed(2)

  return (
    <div className="p-8 md:p-10 flex flex-col min-h-full bg-noir-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={item._id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex-1"
        >
          <p className="eyebrow mb-4">
            {category?.name || 'Menu Item'}
            {item.course ? ` — Course 0${item.course}` : ''}
          </p>

          <h3 className="font-display italic text-3xl md:text-4xl mb-3">
            {item.name}
          </h3>

          {item.tagline && (
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-6">
              {item.tagline}
            </p>
          )}

          {item.description && (
            <p className="text-bone-dim text-sm leading-relaxed max-w-md">
              {item.description}
            </p>
          )}

          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full max-h-72 object-cover mt-8"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8 pt-8 border-t border-white/10">
            <div>
              <p className="eyebrow mb-3">Details</p>

              <div className="space-y-2 text-sm text-bone-dim">
                {item.preparationTime && (
                  <p>
                    <span className="text-ember">/</span>{' '}
                    Preparation time: {item.preparationTime} minutes
                  </p>
                )}

                {typeof item.isAvailable === 'boolean' && (
                  <p>
                    <span className="text-ember">/</span>{' '}
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">Composition</p>

              {composition.length > 0 ? (
                <ul className="space-y-2">
                  {composition.map((component, index) => (
                    <li
                      key={`${component}-${index}`}
                      className="text-sm text-bone-dim flex items-start gap-2"
                    >
                      <span className="text-ember">/</span>
                      {component}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-bone-dim">
                  No composition details available.
                </p>
              )}
            </div>
          </div>

          {item.pairing && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="eyebrow mb-3">Pairing</p>
              <p className="font-display italic text-bone">
                {item.pairing}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={() => addItem(item)}
          disabled={item.isAvailable === false}
          className="bg-ember text-noir-950 px-6 py-3.5 text-xs font-medium uppercase tracking-widest2 hover:bg-ember-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add to Order — ${formattedPrice}
        </button>

        <button
          type="button"
          onClick={openDrawer}
          className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone transition-colors"
        >
          View Order ({totalCount}) &rarr;
        </button>
      </div>
    </div>
  )
}