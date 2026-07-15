import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import menuRoutes from './routes/menuRoutes'
import tableRoutes from './routes/tableRoutes'
import orderRoutes from './routes/orderRoutes'
import userRoutes from './routes/userRoutes'
import seedRoutes from './routes/seedRoutes'
import reservationRoutes from './routes/reservationRoutes'
import ingredientRoutes from './routes/ingredientRoutes'
import authRoutes from './routes/authRoutes'
import customerRoutes from './routes/customerRoutes';
import managementRoutes from './routes/managementRoutes'
import notificationRoutes from './routes/notificationRoutes'
import paymentRoutes from './routes/paymentRoutes'
const app = express()

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())
app.use(
  '/api/notifications',
  notificationRoutes,
)
app.use('/api/reservations', reservationRoutes);
app.use('/api/menu', menuRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/inventory', ingredientRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes);
app.use('/api/management', managementRoutes)
app.use('/api/payments', paymentRoutes);

export default app
