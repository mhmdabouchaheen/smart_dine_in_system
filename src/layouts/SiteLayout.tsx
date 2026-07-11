import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import OrderDrawer from '../components/OrderDrawer/OrderDrawer'

export default function SiteLayout() {
  return (
    <>
      <Navbar />
      <OrderDrawer />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
