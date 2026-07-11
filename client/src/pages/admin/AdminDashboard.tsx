import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Crown, Flame } from 'lucide-react'
import { fetchDashboardStats } from '../../services/api'
import type { DashboardStats } from '../../types'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardStats().then(setStats)
  }, [])

  if (!stats) return <p className="text-bone-dim text-sm">Loading dashboard…</p>

  return (
    <div>
      <p className="eyebrow mb-4">Admin</p>
      <h1 className="font-display text-4xl leading-[1.05] mb-10">
        Business <em className="text-ember italic">at a glance.</em>
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 border border-white/10 mb-12">
        <div className="px-6 py-5 border-r border-b lg:border-b-0 border-white/10">
          <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Revenue Today</p>
          <p className="font-display text-3xl">${stats.revenueToday.toLocaleString()}</p>
        </div>
        <div className="px-6 py-5 border-b lg:border-b-0 lg:border-r border-white/10">
          <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Revenue This Month</p>
          <p className="font-display text-3xl">${stats.revenueThisMonth.toLocaleString()}</p>
        </div>
        <div className="px-6 py-5 border-r border-white/10">
          <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Orders Today</p>
          <p className="font-display text-3xl">{stats.ordersToday}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Avg Order Value</p>
          <p className="font-display text-3xl">${stats.avgOrderValue}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 mb-12">
        <div className="border border-white/10 p-6">
          <p className="eyebrow mb-6">Revenue This Week</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="day" stroke="#7A7872" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#7A7872" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#161615', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                labelStyle={{ color: '#F5F3EE' }}
                cursor={{ fill: 'rgba(229,90,43,0.08)' }}
              />
              <Bar dataKey="revenue" fill="#E55A2B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-white/10 p-6">
          <p className="eyebrow mb-6 flex items-center gap-2">
            <Flame size={13} /> Best-Selling Dishes
          </p>
          <ul className="space-y-4">
            {stats.bestSellers.map((dish, idx) => (
              <li key={dish.menuItemId} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-display italic text-ember text-lg w-5">{idx + 1}</span>
                  <div>
                    <p className="text-sm text-bone">{dish.name}</p>
                    <p className="text-xs text-bone-faint">{dish.unitsSold} sold</p>
                  </div>
                </div>
                <span className="text-sm text-bone-dim">${dish.revenue.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border border-white/10 p-6">
        <p className="eyebrow mb-6 flex items-center gap-2">
          <Crown size={13} /> Top Customers
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest2 text-bone-faint border-b border-white/10">
              <th className="pb-3 font-normal">Customer</th>
              <th className="pb-3 font-normal">Email</th>
              <th className="pb-3 font-normal">Visits</th>
              <th className="pb-3 font-normal text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {stats.topCustomers.map((c, idx) => (
              <tr key={c.customerId} className="border-b border-white/5 last:border-0">
                <td className="py-3.5 flex items-center gap-2">
                  {idx === 0 && <Crown size={13} className="text-ember" />}
                  {c.name}
                </td>
                <td className="py-3.5 text-bone-dim">{c.email}</td>
                <td className="py-3.5 text-bone-dim">{c.visits}</td>
                <td className="py-3.5 text-right text-ember font-display">${c.totalSpent.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
