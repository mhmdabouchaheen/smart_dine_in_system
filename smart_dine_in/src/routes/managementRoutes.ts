import express from 'express'
import { getDashboardStats } from '../controllers/managementController'

const router = express.Router()

router.get('/dashboard', getDashboardStats)

export default router