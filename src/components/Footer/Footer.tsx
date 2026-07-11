import { Link } from 'react-router-dom'
import { featured } from '../../services/mockData'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Dine',
    links: [
      { label: 'Tasting Menu', href: '/menu' },
      { label: 'Reservations', href: '/reservation' },
      { label: 'Private Cellar', href: '/menu?category=cat-mare' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Create Account', href: '/signup' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 pt-20 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <p
          aria-hidden="true"
          className="font-display font-bold text-[18vw] md:text-[9rem] leading-none text-white/[0.04] select-none -mb-6 md:-mb-8 whitespace-nowrap"
        >
          NOIR &amp; SEL
        </p>

        <div className="relative z-10 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 pb-16">
          <div>
            <Link to="/" className="font-display text-xl">
              NOIR <span className="text-ember">&amp;</span> SEL
            </Link>
            <p className="text-bone-dim text-sm mt-4 max-w-xs leading-relaxed">
              An experimental dining room built around smoke, salt, and elemental cooking.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-bone-dim hover:text-bone transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="eyebrow mb-4">Visit</p>
            <p className="text-bone text-sm">{featured.location.line1}</p>
            <p className="text-bone-dim text-sm mb-4">{featured.location.line2}</p>
            <p className="text-bone text-sm">{featured.hours.line1}</p>
            <p className="text-bone-dim text-sm">{featured.hours.line2}</p>
          </div>
        </div>

        <div className="relative z-10 py-6 border-t border-white/10 flex items-center justify-between text-xs text-bone-faint flex-wrap gap-4">
          <span>&copy; {new Date().getFullYear()} Noir &amp; Sel Group</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-bone transition-colors">Instagram</a>
            <a href="#" className="hover:text-bone transition-colors">Journal</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
