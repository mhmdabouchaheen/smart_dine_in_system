import { motion } from 'framer-motion'

const defaultHero = {
  headline: 'Fire, Earth',
  headlineAccent: 'Water',
  intro:
    'A modern dining experience built around seasonal ingredients, thoughtful preparation, and memorable flavors.',
  location: {
    line1: 'Smart Dine In',
    line2: 'Restaurant Experience',
  },
  hours: {
    line1: 'Open Daily',
    line2: '12:00 PM — 11:00 PM',
  },
  image:
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
  badge: {
    label: 'Established',
    year: '2026',
  },
}

export default function Hero({ featured }) {
  const hero = featured ?? defaultHero

  return (
    <section
      id="top"
      className="relative pt-32 md:pt-40 pb-20 px-6 md:px-10 max-w-[1400px] mx-auto"
    >
      <div className="grid md:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <h1 className="font-display text-6xl md:text-7xl leading-[0.98]">
            {hero.headline}
            <br />

            <span className="text-ember italic">
              &amp; {hero.headlineAccent}
            </span>
          </h1>

          <p className="mt-6 max-w-sm text-bone-dim text-[15px] leading-relaxed">
            {hero.intro}
          </p>

          <div className="mt-10 flex items-center gap-4">
            <span className="w-10 h-px bg-ember" />
            <p className="eyebrow">Experimental Dining</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-8 max-w-sm">
            <div>
              <p className="text-bone text-sm">
                {hero.location?.line1}
              </p>

              <p className="text-bone-dim text-sm">
                {hero.location?.line2}
              </p>
            </div>

            <div>
              <p className="text-bone text-sm">
                {hero.hours?.line1}
              </p>

              <p className="text-bone-dim text-sm">
                {hero.hours?.line2}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.15,
          }}
          className="relative"
        >
          <div className="aspect-[4/5] w-full overflow-hidden bg-noir-800">
            {hero.image && (
              <img
                src={hero.image}
                alt="Signature restaurant dish"
                className="w-full h-full object-cover grayscale-[15%] contrast-[1.05]"
                loading="eager"
              />
            )}
          </div>

          {hero.badge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute -bottom-8 -left-8 md:-bottom-10 md:-left-10 w-28 h-28 md:w-32 md:h-32 rounded-full bg-ember flex flex-col items-center justify-center text-center animate-emberPulse"
            >
              <span className="text-[9px] uppercase tracking-widest2 text-noir-950/80">
                {hero.badge.label}
              </span>

              <span className="font-display text-2xl text-noir-950 font-semibold">
                {hero.badge.year}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}