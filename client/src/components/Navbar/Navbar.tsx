import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ShoppingBag, Menu as MenuIcon, X, User } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

const NAV_LINKS = [
  { label: 'Menu', href: '/menu' },
  { label: 'Reservation', href: '/reservation' },
]

export default function Navbar() {
  const { totalCount, openDrawer, activeOrder } = useCart()
  const { user, logout } = useAuth()
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
        <Link to="/" className="font-display text-xl tracking-wide">
          NOIR <span className="text-ember">&amp;</span> SEL
        </Link>

        <ul className="hidden md:flex items-center gap-10 text-xs uppercase tracking-widest2 text-bone-dim">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink
                to={link.href}
                className={({ isActive }) => (isActive ? 'text-ember' : 'hover:text-bone transition-colors')}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          {user?.role === 'customer' && (
            <li>
              <NavLink
                to="/notifications"
                className={({ isActive }) => (isActive ? 'text-ember' : 'hover:text-bone transition-colors')}
              >
                Notifications
              </NavLink>
            </li>
          )}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={openDrawer}
            className="relative flex items-center gap-2 border border-white/20 px-4 py-2.5 text-xs uppercase tracking-widest2 text-bone hover:border-ember transition-colors"
          >
            <ShoppingBag size={14} />
            {totalCount > 0 ? `Order (${totalCount})` : activeOrder ? 'Track Order' : 'Order'}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'waiter' || user.role === 'kitchen' || user.role === 'manager' ? '/staff/orders' : '/'}
                className="flex items-center gap-2 text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone"
              >
                <User size={14} /> {user.name.split(' ')[0]}
              </Link>
              <Button variant="ghost" onClick={logout} className="!px-3">
                Logout
              </Button>
            </div>
          ) : (
            <Button as={Link} to="/login">
              Login
            </Button>
          )}
        </div>

        <button className="md:hidden text-bone" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-noir-950 border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm uppercase tracking-widest2 text-bone-dim hover:text-bone"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => {
                logout()
                setMobileOpen(false)
              }}
              className="text-sm uppercase tracking-widest2 text-bone-dim text-left"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="text-sm uppercase tracking-widest2 text-bone-dim"
            >
              Login / Sign up
            </Link>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                openDrawer()
                setMobileOpen(false)
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-white/20 px-4 py-3 text-xs uppercase tracking-widest2"
            >
              <ShoppingBag size={14} />
              {totalCount > 0 ? `Order (${totalCount})` : activeOrder ? 'Track Order' : 'Order'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
