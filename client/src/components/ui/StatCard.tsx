interface StatCardProps {
  label: string
  value: string | number
  hint?: string
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="px-6 py-5 border-r last:border-r-0 border-white/10">
      <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">{label}</p>
      <p className="font-display text-3xl">{value}</p>
      {hint && <p className="text-xs text-bone-dim mt-1">{hint}</p>}
    </div>
  )
}
