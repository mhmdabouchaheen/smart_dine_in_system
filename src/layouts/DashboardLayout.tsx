import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutGrid,
  ClipboardList,
  Bell,
  Users,
  QrCode,
  LogOut,
  Grid3x3,
  UtensilsCrossed,
  CalendarClock,
  Home,
  BookOpen,
  Boxes,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/ui/NotificationBell'

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutGrid
  roles: Array<'staff' | 'admin'>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Orders Dashboard', href: '/staff/orders', icon: ClipboardList, roles: ['staff', 'admin'] },
  { label: 'Floor Status', href: '/staff/floor', icon: Grid3x3, roles: ['staff', 'admin'] },
  { label: 'Menu Management', href: '/staff/menu', icon: BookOpen, roles: ['staff', 'admin'] },
  { label: 'Inventory', href: '/staff/inventory', icon: Boxes, roles: ['staff', 'admin'] },
  { label: 'Tables & QR', href: '/staff/tables', icon: QrCode, roles: ['staff', 'admin'] },
  { label: 'Notifications', href: '/staff/notifications', icon: Bell, roles: ['staff', 'admin'] },
  { label: 'Dashboard', href: '/admin', icon: LayoutGrid, roles: ['admin'] },
  { label: 'Staff', href: '/admin/staff', icon: Users, roles: ['admin'] },
]

const SITE_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { label: 'Reservations', href: '/reservation', icon: CalendarClock },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const role = user?.role === 'admin' ? 'admin' : 'staff'
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <div className="min-h-screen flex bg-noir-950">
      <aside className="w-64 shrink-0 border-r border-white/10 flex flex-col">
        <Link to="/" className="font-display text-lg px-6 py-6 border-b border-white/10">
          NOIR <span className="text-ember">&amp;</span> SEL
        </Link>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive ? 'bg-ember text-noir-950' : 'text-bone-dim hover:bg-noir-850 hover:text-bone'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}

          <p className="px-4 pt-6 pb-2 text-[10px] uppercase tracking-widest2 text-bone-faint">
            Storefront
          </p>
          {SITE_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm text-bone-dim hover:bg-noir-850 hover:text-bone transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-6 border-t border-white/10">
          <p className="text-sm text-bone">{user?.name}</p>
          <p className="text-xs text-bone-faint uppercase tracking-widest2 mb-4">{user?.position || role}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs uppercase tracking-widest2 text-bone-dim hover:text-ember"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/10 flex items-center justify-end px-8 gap-4">
          <NotificationBell />
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
