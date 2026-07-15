import { useEffect, useState } from 'react'
import { Crown, Gift, HelpCircle, History, Sparkles, TrendingUp } from 'lucide-react'
import { fetchMyLoyaltySummary, fetchMyTransactions } from '../../services/api'
import type { LoyaltySummary, LoyaltyTransaction } from '../../types'

export default function LoyaltyPage() {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null)
  const [txData, setTxData] = useState<{
    transactions: LoyaltyTransaction[]
    page: number
    totalPages: number
    total: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [txPage, setTxPage] = useState(1)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [sum, txs] = await Promise.all([
          fetchMyLoyaltySummary(),
          fetchMyTransactions(txPage, 8)
        ])
        setSummary(sum)
        setTxData(txs)
      } catch (err) {
        console.error('Failed to load loyalty data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [txPage])

  if (isLoading && !summary) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-bone-dim text-sm animate-pulse">Loading your rewards dashboard...</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-red-400 text-sm">Failed to load rewards account. Make sure you are signed in.</p>
      </div>
    )
  }

  const dollarDiscount = (summary.loyaltyPoints * summary.settings.dollarValuePerPoint).toFixed(2)

  return (
    <div className="max-w-5xl mx-auto px-6 pt-32 pb-24">
      {/* Page Header */}
      <p className="eyebrow mb-4">Loyalty Program</p>
      <h1 className="font-display text-4xl lg:text-5xl leading-none mb-10">
        Your rewards <em className="text-ember italic">status.</em>
      </h1>

      {/* Main Grid: Card + Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Tier Card */}
        <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-noir-900 to-noir-950 border border-white/10 p-8 flex flex-col justify-between min-h-[220px]">
          {/* Glassmorphic Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-ember/15 blur-3xl" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="flex items-center gap-1.5 text-[10px] tracking-widest2 uppercase text-ember font-medium mb-1">
                <Crown size={12} /> Member Status
              </span>
              <h2 className="font-display text-2xl tracking-wide italic">Noir &amp; Sel Elite</h2>
            </div>
            <Sparkles className="text-white/20" size={24} />
          </div>

          <div className="mt-8 flex justify-between items-end border-t border-white/5 pt-6">
            <div>
              <p className="text-[10px] tracking-widest2 uppercase text-bone-faint mb-1">Point Balance</p>
              <p className="font-display text-5xl text-bone leading-none">
                {summary.loyaltyPoints.toLocaleString()} <span className="text-lg font-sans text-bone-dim">pts</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest2 uppercase text-bone-faint mb-1">Equivalent Discount</p>
              <p className="font-display text-2xl text-ember leading-none">
                ${dollarDiscount}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Columns */}
        <div className="bg-white/5 border border-white/10 p-8 flex flex-col justify-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-ember bg-white/5">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] tracking-widest2 uppercase text-bone-faint mb-0.5">Lifetime Earned</p>
              <p className="font-display text-xl text-bone leading-none">
                {summary.totalPointsEarned.toLocaleString()} <span className="text-xs font-sans text-bone-dim">pts</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-white/5 pt-6">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-bone-dim bg-white/5">
              <Gift size={16} />
            </div>
            <div>
              <p className="text-[10px] tracking-widest2 uppercase text-bone-faint mb-0.5">Total Redeemed</p>
              <p className="font-display text-xl text-bone leading-none">
                {summary.totalPointsRedeemed.toLocaleString()} <span className="text-xs font-sans text-bone-dim">pts</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="border border-white/10 p-5 bg-white/5 mb-12 text-sm text-bone-dim flex items-start gap-3">
        <HelpCircle className="text-ember shrink-0 mt-0.5" size={16} />
        <div>
          <p className="font-semibold text-bone mb-1">Earning and Redemption Guidelines</p>
          <p className="leading-relaxed text-xs">
            Earn <span className="text-bone">{summary.settings.pointsPerDollar} points per $1</span> spent on food and beverage items you add to your table.
            Redeem points at checkout in increments of <span className="text-bone">{summary.settings.minimumRedemptionPoints} points</span> ({Math.round(1 / summary.settings.dollarValuePerPoint)} points = $1 discount),
            up to a maximum of <span className="text-bone">{summary.settings.maximumRedemptionPoints} points</span> per order.
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="border border-white/10 p-6 bg-noir-900">
        <h3 className="font-display italic text-2xl mb-6 flex items-center gap-2">
          <History size={18} className="text-ember" /> Transaction History
        </h3>
        
        {txData && txData.transactions.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-bone-faint text-[10px] uppercase tracking-widest2">
                    <th className="pb-3 font-normal">Date</th>
                    <th className="pb-3 font-normal">Type</th>
                    <th className="pb-3 font-normal">Reason</th>
                    <th className="pb-3 font-normal">Points</th>
                    <th className="pb-3 font-normal text-right">Value Equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {txData.transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 text-bone-dim">{new Date(tx.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-semibold border ${
                          tx.type === 'EARN' 
                            ? 'border-green-500/30 text-green-400 bg-green-500/5' 
                            : tx.type === 'REDEEM' 
                            ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' 
                            : 'border-blue-500/30 text-blue-400 bg-blue-500/5'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-bone-dim max-w-xs truncate">{tx.reason}</td>
                      <td className={`py-3.5 font-semibold ${tx.points > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points}
                      </td>
                      <td className="py-3.5 text-right font-display text-bone-dim">${tx.moneyEquivalent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {txData.totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-6">
                <span className="text-xs text-bone-faint">
                  Showing Page {txData.page} of {txData.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className="border border-white/15 px-3 py-1 text-xs hover:border-ember disabled:opacity-30 disabled:hover:border-white/15 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setTxPage((p) => Math.min(txData.totalPages, p + 1))}
                    disabled={txPage === txData.totalPages}
                    className="border border-white/15 px-3 py-1 text-xs hover:border-ember disabled:opacity-30 disabled:hover:border-white/15 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-bone-faint py-4 text-center">No transaction records found.</p>
        )}
      </div>
    </div>
  )
}
