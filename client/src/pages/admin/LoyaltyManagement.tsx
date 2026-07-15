import { useEffect, useState } from 'react'
import {
  Coins,
  Settings,
  Users,
  Search,
  Sliders,
  Sparkles,
  History,
  TrendingUp,
  Gift,
  HelpCircle,
  X,
  Table as TableIcon
} from 'lucide-react'
import {
  fetchLoyaltySettings,
  updateLoyaltySettings,
  fetchCustomersLoyalty,
  fetchCustomerDetailedHistory,
  adjustCustomerPoints,
  fetchTableLoyaltyHistory
} from '../../services/api'
import type { LoyaltySettings, LoyaltyTransaction, OrderRecord } from '../../types'
import Button from '../../components/ui/Button'
import { TextInput } from '../../components/ui/FormField'

type Tab = 'customers' | 'settings' | 'reports'

export default function LoyaltyManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('customers')
  const [settings, setSettings] = useState<LoyaltySettings | null>(null)
  
  // Customers Tab State
  const [customersData, setCustomersData] = useState<{
    customers: any[]
    page: number
    totalPages: number
    total: number
  } | null>(null)
  const [custPage, setCustPage] = useState(1)
  const [custSearch, setCustSearch] = useState('')
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null)
  const [selectedCustHistory, setSelectedCustHistory] = useState<{
    customer: any
    transactions: LoyaltyTransaction[]
    orders: OrderRecord[]
  } | null>(null)
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<LoyaltySettings>>({})
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  
  // Adjustment Form State
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)
  
  // Reports State (History by Table)
  const [tableQuery, setTableQuery] = useState('')
  const [tableHistory, setTableHistory] = useState<{
    tableId: string
    transactions: LoyaltyTransaction[]
  } | null>(null)
  const [tableHistoryLoading, setTableHistoryLoading] = useState(false)

  // Initial Load
  useEffect(() => {
    fetchLoyaltySettings().then((data) => {
      setSettings(data)
      setSettingsForm(data)
    }).catch(err => console.error(err))

    loadCustomers()
  }, [custPage])

  const loadCustomers = () => {
    fetchCustomersLoyalty(custPage, 12).then(setCustomersData).catch(err => console.error(err))
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    try {
      const updated = await updateLoyaltySettings(settingsForm)
      setSettings(updated)
      alert('Settings updated successfully.')
    } catch (err) {
      console.error(err)
      alert('Failed to save settings.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleOpenCustomer = async (id: string) => {
    try {
      const profile = await fetchCustomerDetailedHistory(id)
      setSelectedCustId(id)
      setSelectedCustHistory(profile)
      setAdjustPoints('')
      setAdjustReason('')
      setAdjustError(null)
    } catch (err) {
      console.error(err)
      alert('Failed to load customer profile details.')
    }
  }

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustId) return
    const pts = parseInt(adjustPoints)
    if (isNaN(pts) || pts === 0) {
      setAdjustError('Please enter a valid non-zero point value.')
      return
    }
    if (!adjustReason.trim()) {
      setAdjustError('Please specify a reason for this adjustment.')
      return
    }

    setIsAdjusting(true)
    setAdjustError(null)
    try {
      await adjustCustomerPoints(selectedCustId, pts, adjustReason)
      // Reload profile
      const profile = await fetchCustomerDetailedHistory(selectedCustId)
      setSelectedCustHistory(profile)
      loadCustomers()
      setAdjustPoints('')
      setAdjustReason('')
    } catch (err: any) {
      setAdjustError(err.response?.data?.error || 'Failed to adjust points.')
    } finally {
      setIsAdjusting(false)
    }
  }

  const handleTableQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tableQuery.trim()) return
    setTableHistoryLoading(true)
    setTableHistory(null)
    try {
      const history = await fetchTableLoyaltyHistory(tableQuery)
      setTableHistory(history)
    } catch (err) {
      console.error(err)
      alert('Could not find transactions for that table ID or number.')
    } finally {
      setTableHistoryLoading(false)
    }
  }

  // Filter customers locally by search keyword
  const filteredCustomers = customersData?.customers.filter(c => 
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(custSearch.toLowerCase())
  ) || []

  return (
    <div className="max-w-6xl mx-auto">
      <p className="eyebrow mb-4">Management</p>
      <h1 className="font-display text-4xl mb-8 flex items-center gap-3">
        Loyalty <em className="text-ember italic">Program.</em>
      </h1>

      {/* Tabs list */}
      <div className="flex border-b border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-3.5 text-sm uppercase tracking-widest transition-all ${
            activeTab === 'customers'
              ? 'border-b-2 border-ember text-ember font-medium'
              : 'text-bone-dim hover:text-bone'
          }`}
        >
          Customers list
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3.5 text-sm uppercase tracking-widest transition-all ${
            activeTab === 'settings'
              ? 'border-b-2 border-ember text-ember font-medium'
              : 'text-bone-dim hover:text-bone'
          }`}
        >
          Global Settings
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-3.5 text-sm uppercase tracking-widest transition-all ${
            activeTab === 'reports'
              ? 'border-b-2 border-ember text-ember font-medium'
              : 'text-bone-dim hover:text-bone'
          }`}
        >
          Reports &amp; Tables
        </button>
      </div>

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div>
          {/* Search bar */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-3.5 text-bone-faint" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
              className="field pl-10"
            />
          </div>

          {/* Grid Layout */}
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((cust) => (
                <div
                  key={cust._id}
                  onClick={() => handleOpenCustomer(cust._id)}
                  className="bg-white/5 border border-white/10 hover:border-ember p-5 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-bone mb-0.5 truncate">{cust.name}</h3>
                    <p className="text-xs text-bone-faint truncate mb-4">{cust.email}</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-2">
                    <div>
                      <p className="text-[9px] tracking-widest2 uppercase text-bone-faint">Points</p>
                      <p className="font-display text-lg text-ember">{(cust.loyaltyPoints || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] tracking-widest2 uppercase text-bone-faint">Lifetime Earned</p>
                      <p className="text-xs text-bone-dim">{(cust.totalPointsEarned || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-sm text-bone-faint py-8 text-center">No matching customers found.</p>
            )}
          </div>

          {/* Pagination */}
          {customersData && customersData.totalPages > 1 && (
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
              <span className="text-xs text-bone-faint">Page {customersData.page} of {customersData.totalPages}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCustPage(p => Math.max(1, p - 1))}
                  disabled={custPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCustPage(p => Math.min(customersData.totalPages, p + 1))}
                  disabled={custPage === customersData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="max-w-xl bg-noir-900 border border-white/10 p-8 space-y-6">
          <h2 className="font-display text-2xl italic mb-4 flex items-center gap-2 text-ember">
            <Settings size={20} /> Program Ratios
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Points Per $1 Spent"
              type="number"
              min="0"
              step="1"
              value={settingsForm.pointsPerDollar || ''}
              onChange={(e) => setSettingsForm(p => ({ ...p, pointsPerDollar: Number(e.target.value) }))}
              placeholder="e.g. 1"
            />
            <TextInput
              label="Dollar Value Per Point ($)"
              type="number"
              min="0"
              step="0.001"
              value={settingsForm.dollarValuePerPoint || ''}
              onChange={(e) => setSettingsForm(p => ({ ...p, dollarValuePerPoint: Number(e.target.value) }))}
              placeholder="e.g. 0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Minimum Points to Redeem"
              type="number"
              min="0"
              step="10"
              value={settingsForm.minimumRedemptionPoints || ''}
              onChange={(e) => setSettingsForm(p => ({ ...p, minimumRedemptionPoints: Number(e.target.value) }))}
              placeholder="e.g. 100"
            />
            <TextInput
              label="Maximum Points Allowed Per Order"
              type="number"
              min="0"
              step="10"
              value={settingsForm.maximumRedemptionPoints || ''}
              onChange={(e) => setSettingsForm(p => ({ ...p, maximumRedemptionPoints: Number(e.target.value) }))}
              placeholder="e.g. 100"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isEnabled"
              checked={settingsForm.isEnabled ?? true}
              onChange={(e) => setSettingsForm(p => ({ ...p, isEnabled: e.target.checked }))}
              className="accent-ember w-4 h-4 bg-transparent border-white/15"
            />
            <label htmlFor="isEnabled" className="text-sm text-bone">
              Enable loyalty point program rewards
            </label>
          </div>

          <Button type="submit" disabled={isSavingSettings} className="w-full">
            {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
          </Button>
        </form>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-8">
          {/* Query table form */}
          <form onSubmit={handleTableQuery} className="max-w-md bg-noir-900 border border-white/10 p-6">
            <h3 className="font-display text-xl mb-4 flex items-center gap-2">
              <TableIcon size={16} className="text-ember" /> History By Table
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Table ID or Number..."
                value={tableQuery}
                onChange={(e) => setTableQuery(e.target.value)}
                className="field flex-1"
              />
              <Button type="submit" disabled={tableHistoryLoading}>
                Search
              </Button>
            </div>
          </form>

          {/* Table history display */}
          {tableHistory && (
            <div className="bg-noir-900 border border-white/10 p-6">
              <h4 className="font-display italic text-lg mb-4">
                Activity History for Table
              </h4>
              {tableHistory.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-bone-faint text-[10px] uppercase tracking-widest2">
                        <th className="pb-3 font-normal">Customer</th>
                        <th className="pb-3 font-normal">Date</th>
                        <th className="pb-3 font-normal">Type</th>
                        <th className="pb-3 font-normal">Reason</th>
                        <th className="pb-3 font-normal">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tableHistory.transactions.map((tx: any) => (
                        <tr key={tx._id}>
                          <td className="py-3 text-bone font-medium">{tx.customerId?.name || 'Guest'}</td>
                          <td className="py-3 text-bone-dim">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider border ${
                              tx.type === 'EARN' ? 'border-green-500/20 text-green-400 bg-green-500/5' : 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 text-bone-dim">{tx.reason}</td>
                          <td className={`py-3 font-semibold ${tx.points > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-bone-faint py-4 text-center">No table transactions found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* CUSTOMER PROFILE DETAIL MODAL */}
      {selectedCustId && selectedCustHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-noir-950 border border-white/10 w-full max-w-4xl max-h-[85vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => { setSelectedCustId(null); setSelectedCustHistory(null); }}
              className="absolute top-6 right-6 text-bone-faint hover:text-bone"
            >
              <X size={22} />
            </button>

            {/* Profile Header */}
            <div className="mb-8 border-b border-white/10 pb-6">
              <span className="eyebrow mb-1">Customer Profile</span>
              <h2 className="font-display text-3xl mb-1">{selectedCustHistory.customer.name}</h2>
              <p className="text-sm text-bone-faint">{selectedCustHistory.customer.email}</p>
            </div>

            {/* Loyalty Balance Stats */}
            <div className="grid grid-cols-3 border border-white/10 p-5 mb-8 bg-white/5">
              <div className="text-center border-r border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-bone-faint mb-1">Current Points</p>
                <p className="font-display text-3xl text-ember">{selectedCustHistory.customer.loyaltyPoints}</p>
              </div>
              <div className="text-center border-r border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-bone-faint mb-1">Lifetime Earned</p>
                <p className="font-display text-3xl text-bone-dim">{selectedCustHistory.customer.totalPointsEarned}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-bone-faint mb-1">Lifetime Redeemed</p>
                <p className="font-display text-3xl text-bone-dim">{selectedCustHistory.customer.totalPointsRedeemed}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Point Adjust Form */}
              <form onSubmit={handleAdjustPoints} className="border border-white/10 p-6 space-y-4">
                <h3 className="font-display italic text-lg mb-2">Adjust Customer Points</h3>
                <TextInput
                  label="Adjustment Points"
                  type="number"
                  placeholder="e.g. 50 or -50"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                />
                <div>
                  <label className="block text-xs uppercase tracking-widest text-bone-faint mb-1.5">Adjustment Reason</label>
                  <textarea
                    rows={2}
                    placeholder="Provide a valid adjustment reason..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="field resize-none h-16"
                  />
                </div>
                {adjustError && <p className="text-xs text-red-400">{adjustError}</p>}
                <Button type="submit" disabled={isAdjusting} className="w-full">
                  {isAdjusting ? 'Processing Adjustment...' : 'Apply Point Adjustment'}
                </Button>
              </form>

              {/* Connected Orders */}
              <div className="border border-white/10 p-6 overflow-y-auto max-h-[290px]">
                <h3 className="font-display italic text-lg mb-4">Orders Involving Customer</h3>
                {selectedCustHistory.orders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustHistory.orders.map((ord) => (
                      <div key={ord._id} className="p-3 border border-white/5 bg-white/5 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-bone">Order #{ord._id.slice(-6)} (Table {ord.tableNumber})</p>
                          <p className="text-[9px] text-bone-faint mt-0.5">
                            Status: <span className="uppercase">{ord.status}</span> | Paid: {ord.paymentStatus}
                          </p>
                        </div>
                        <span className="font-display text-sm text-ember">${ord.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-bone-faint text-center py-4">No order records linked.</p>
                )}
              </div>
            </div>

            {/* Customer Ledger History */}
            <div className="border border-white/10 p-6 bg-noir-900">
              <h3 className="font-display italic text-lg mb-4 flex items-center gap-2">
                <History size={16} className="text-ember" /> Complete Point Ledger
              </h3>
              {selectedCustHistory.transactions.length > 0 ? (
                <div className="overflow-x-auto max-h-[250px]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-bone-faint text-[9px] uppercase tracking-widest2">
                        <th className="pb-2 font-normal">Date</th>
                        <th className="pb-2 font-normal">Type</th>
                        <th className="pb-2 font-normal">Reason</th>
                        <th className="pb-2 font-normal">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedCustHistory.transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td className="py-2.5 text-bone-dim">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-2.5">
                            <span className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider border ${
                              tx.type === 'EARN' ? 'border-green-500/20 text-green-400 bg-green-500/5' : 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2.5 text-bone-dim truncate max-w-xs">{tx.reason}</td>
                          <td className={`py-2.5 font-semibold ${tx.points > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-bone-faint text-center py-4">No point transactions found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
