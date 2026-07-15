import { Request, Response } from 'express'
import { Payment } from '../models/Payment'
import { Order } from '../models/Order'

export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { day, month, year } = req.query

    const selectedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    )

    const startDate = new Date(selectedDate)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(selectedDate)
    endDate.setHours(23, 59, 59, 999)

    const revenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'Completed',
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: '$amount',
          },
        },
      },
    ])

    const revenueToday = revenueResult[0]?.revenue || 0
const monthStart = new Date(
  Number(year),
  Number(month) - 1,
  1
)

monthStart.setHours(0, 0, 0, 0)

const monthEnd = new Date(
  Number(year),
  Number(month),
  0
)

monthEnd.setHours(23, 59, 59, 999)


const monthlyRevenueResult = await Payment.aggregate([
  {
    $match: {
      status: 'Completed',
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    },
  },
  {
    $group: {
      _id: null,
      revenue: {
        $sum: '$amount',
      },
    },
  },
])

const revenueThisMonth = monthlyRevenueResult[0]?.revenue || 0

const ordersToday = await Order.countDocuments({
  createdAt: {
    $gte: startDate,
    $lte: endDate,
  },
})

const paidOrdersToday = await Order.countDocuments({
  paymentStatus: 'Paid',
  createdAt: {
    $gte: startDate,
    $lte: endDate,
  },
})

const avgOrderValue =
  paidOrdersToday > 0
    ? revenueToday / paidOrdersToday
    : 0

    const revenueByDay = await Payment.aggregate([
  {
    $match: {
      status: 'Completed',
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    },
  },
  {
    $group: {
      _id: {
        day: {
          $dayOfMonth: '$createdAt',
        },
      },
      revenue: {
        $sum: '$amount',
      },
    },
  },
  {
    $sort: {
      '_id.day': 1,
    },
  },
])

const formattedRevenueByDay = revenueByDay.map((item) => ({
  day: String(item._id.day),
  revenue: item.revenue,
}))

const bestSellers = await Order.aggregate([
  {
    $match: {
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    },
  },
  {
    $unwind: '$items',
  },
  {
    $group: {
      _id: '$items.menuItemId',
      name: {
        $first: '$items.name',
      },
      unitsSold: {
        $sum: '$items.quantity',
      },
      revenue: {
        $sum: {
          $multiply: [
            '$items.quantity',
            '$items.unitPrice',
          ],
        },
      },
    },
  },
  {
    $sort: {
      unitsSold: -1,
    },
  },
  {
    $limit: 5,
  },
])

const topCustomers = await Order.aggregate([
  {
    $match: {
      customerId: {
        $exists: true,
        $ne: null,
      },
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    },
  },
  {
    $group: {
      _id: '$customerId',
      visits: {
        $sum: 1,
      },
      totalSpent: {
        $sum: '$totalAmount',
      },
    },
  },
  {
    $sort: {
      totalSpent: -1,
    },
  },
  {
    $limit: 5,
  },
  {
    $lookup: {
      from: 'customers',
      localField: '_id',
      foreignField: '_id',
      as: 'customer',
    },
  },
  {
    $unwind: '$customer',
  },
  {
    $project: {
      _id: 0,
      customerId: '$_id',
      name: '$customer.name',
      email: '$customer.email',
      visits: 1,
      totalSpent: 1,
    },
  },
])

   res.json({
  revenueToday,
  revenueThisMonth,
  ordersToday,
  avgOrderValue,
  revenueByDay: formattedRevenueByDay,
  bestSellers,
  topCustomers,
})

  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    })
  }
}