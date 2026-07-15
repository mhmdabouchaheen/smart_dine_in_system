import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import SiteLayout from './layouts/SiteLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ui/ProtectedRoute'

import Home from './pages/Home/Home'
import Menu from './pages/Menu/Menu'
import Reservation from './pages/Reservation/Reservation'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import LoyaltyPage from './pages/customer/LoyaltyPage'
import OrdersQueue from './pages/staff/OrdersQueue'
import FloorStatus from './pages/staff/FloorStatus'
import StaffNotifications from './pages/staff/Notifications'
import MenuManagement from './pages/staff/MenuManagement'
import Inventory from './pages/staff/Inventory'
import QRCodeManager from './pages/staff/QRCodeManager'
import AdminDashboard from './pages/admin/AdminDashboard'
import StaffManagement from './pages/admin/StaffManagement'
import LoyaltyManagement from './pages/admin/LoyaltyManagement'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/reservation" element={<Reservation />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allow={['customer']}>
                  <SiteLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/loyalty" element={<LoyaltyPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allow={['staff', 'admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/staff/orders" element={<OrdersQueue />} />
              <Route path="/staff/floor" element={<FloorStatus />} />
              <Route path="/staff/menu" element={<MenuManagement />} />
              <Route path="/staff/inventory" element={<Inventory />} />
              <Route path="/staff/tables" element={<QRCodeManager />} />
              <Route path="/staff/notifications" element={<StaffNotifications />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/staff" element={<StaffManagement />} />
              <Route path="/admin/loyalty" element={<LoyaltyManagement />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
