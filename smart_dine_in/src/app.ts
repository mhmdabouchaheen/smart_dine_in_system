import express from 'express'
import cors from 'cors'

import menuRoutes from './routes/menuRoutes'
import tableRoutes from './routes/tableRoutes'
import orderRoutes from './routes/orderRoutes'
import userRoutes from './routes/userRoutes'
import seedRoutes from './routes/seedRoutes'
import reservationRoutes from './routes/reservationRoutes';
import ingredientRoutes from './routes/ingredientRoutes'
const app = express()

app.use(
  cors({
    origin: 'http://localhost:5175',
    credentials: true,
  }),
)

app.use(express.json())
app.use('/api/reservations', reservationRoutes);
app.use('/api/menu', menuRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/inventory', ingredientRoutes)
export default app