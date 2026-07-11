import { motion } from 'framer-motion'
import { featured as fallbackFeatured } from '../../services/mockData'

interface HeroProps {
  featured?: typeof fallbackFeatured
}

export default function Hero({ featured = fallbackFeatured }: HeroProps) {
  return (
    <section id="top" className="relative pt-32 md:pt-40 pb-20 px-6 md:px-10 max-w-[1400px] mx-auto">
      <div className="grid md:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-6xl md:text-7xl leading-[0.98]">
            {featured.headline}
            <br />
            <span className="text-ember italic">&amp; {featured.headlineAccent}</span>
          </h1>

          <p className="mt-6 max-w-sm text-bone-dim text-[15px] leading-relaxed">{featured.intro}</p>

          <div className="mt-10 flex items-center gap-4">
            <span className="w-10 h-px bg-ember" />
            <p className="eyebrow">Experimental Dining</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-8 max-w-sm">
            <div>
              <p className="text-bone text-sm">{featured.location.line1}</p>
              <p className="text-bone-dim text-sm">{featured.location.line2}</p>
            </div>
            <div>
              <p className="text-bone text-sm">{featured.hours.line1}</p>
              <p className="text-bone-dim text-sm">{featured.hours.line2}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative"
        >
          <div className="aspect-[4/5] w-full overflow-hidden bg-noir-800">
            <img
              src={featured.image}
              alt="Signature dish"
              className="w-full h-full object-cover grayscale-[15%] contrast-[1.05]"
              loading="eager"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -bottom-8 -left-8 md:-bottom-10 md:-left-10 w-28 h-28 md:w-32 md:h-32 rounded-full bg-ember flex flex-col items-center justify-center text-center animate-emberPulse"
          >
            <span className="text-[9px] uppercase tracking-widest2 text-noir-950/80">{featured.badge.label}</span>
            <span className="font-display text-2xl text-noir-950 font-semibold">{featured.badge.year}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
