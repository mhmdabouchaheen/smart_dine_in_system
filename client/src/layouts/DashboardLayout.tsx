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
  Coins,
} from 'lucide-react'
import { useAuth } from '../context/authContextValue'
import NotificationBell from '../components/ui/NotificationBell'

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutGrid
  roles: DashboardRole[]
}

type DashboardRole = 'Admin' | 'Manager' | 'Waiter' | 'Kitchen'

const NAV_ITEMS: NavItem[] = [
  { label: 'Orders Dashboard', href: '/staff/orders', icon: ClipboardList, roles: ['Waiter', 'Kitchen', 'Admin', 'Manager'] },
  { label: 'Floor Status', href: '/staff/floor', icon: Grid3x3, roles: ['Waiter', 'Kitchen', 'Admin', 'Manager'] },
  { label: 'Menu Management', href: '/staff/menu', icon: BookOpen, roles: ['Waiter', 'Kitchen', 'Admin', 'Manager'] },
  { label: 'Inventory', href: '/staff/inventory', icon: Boxes, roles: ['Waiter', 'Kitchen', 'Admin', 'Manager'] },
  { label: 'Tables & QR', href: '/staff/tables', icon: QrCode, roles: ['Waiter', 'Kitchen', 'Admin', 'Manager'] },
  { label: 'Notifications', href: '/staff/notifications', icon: Bell, roles: ['Waiter', 'Kitchen', 'Admin', 'Manager'] },
  { label: 'Dashboard', href: '/admin', icon: LayoutGrid, roles: ['Admin', 'Manager'] },
  { label: 'Staff', href: '/admin/staff', icon: Users, roles: ['Admin', 'Manager'] },
  { label: 'Loyalty Rewards', href: '/admin/loyalty', icon: Coins, roles: ['Admin', 'Manager'] },
]

const SITE_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { label: 'Reservations', href: '/reservation', icon: CalendarClock },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const role = user?.role as DashboardRole | null
  const items = role
  ? NAV_ITEMS.filter((item) => item.roles.includes(role))
  : []

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
          <p className="text-xs text-bone-faint uppercase tracking-widest2 mb-4">{user?.role}</p>
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
          {role === 'Admin' && (
            <Link
              to="/staff/notifications"
              className="flex items-center gap-2 border border-white/15 px-4 py-2 text-xs uppercase tracking-widest2 text-bone-dim hover:border-ember hover:text-ember transition-colors"
            >
              <Bell size={14} />
              Send Notification
            </Link>
          )}
          <NotificationBell />
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
