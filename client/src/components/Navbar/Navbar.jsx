import { useEffect, useState } from 'react'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import Button from '../ui/Button'

const NAV_LINKS = [
  { label: 'The Kitchen', href: '#kitchen' },
  { label: 'Tasting Menu', href: '#menu' },
  { label: 'Private Cellar', href: '#cellar' },
]

export default function Navbar() {
  const { totalCount, openDrawer } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-noir-950/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 h-20">
        <a href="#top" className="font-display text-xl tracking-wide">
          NOIR <span className="text-ember">&amp;</span> SEL
        </a>

        <ul className="hidden md:flex items-center gap-10 text-xs uppercase tracking-widest2 text-bone-dim">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:text-bone transition-colors">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={openDrawer}
            className="relative flex items-center gap-2 border border-white/20 px-4 py-2.5 text-xs uppercase tracking-widest2 text-bone hover:border-ember transition-colors"
          >
            <ShoppingBag size={14} />
            Order {totalCount > 0 && `(${totalCount})`}
          </button>
          <Button as="a" href="#reserve">
            Reserve
          </Button>
        </div>

        <button
          className="md:hidden text-bone"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-noir-950 border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm uppercase tracking-widest2 text-bone-dim hover:text-bone"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                openDrawer()
                setMobileOpen(false)
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-white/20 px-4 py-3 text-xs uppercase tracking-widest2"
            >
              <ShoppingBag size={14} />
              Order {totalCount > 0 && `(${totalCount})`}
            </button>
            <Button as="a" href="#reserve" className="flex-1" onClick={() => setMobileOpen(false)}>
              Reserve
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
