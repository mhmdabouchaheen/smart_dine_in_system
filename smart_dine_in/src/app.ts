import express from 'express'
import cors from 'cors'

import menuRoutes from './routes/menuRoutes'
import tableRoutes from './routes/tableRoutes'
import orderRoutes from './routes/orderRoutes'
import userRoutes from './routes/userRoutes'
import seedRoutes from './routes/seedRoutes'
import reservationRoutes from './routes/reservationRoutes';
import ingredientRoutes from './routes/ingredientRoutes'
import authRoutes from './routes/authRoutes'
import cookieParser from 'cookie-parser';
import customerRoutes from './routes/customerRoutes';
import loyaltyRoutes from './routes/loyaltyRoutes';

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser())
app.use('/api/reservations', reservationRoutes);
app.use('/api/menu', menuRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/inventory', ingredientRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes);
app.use('/api/loyalty', loyaltyRoutes);

export default app