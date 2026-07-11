interface ProgressBarProps {
  label: string
  progress: number // 0-100
  eta?: string
  tone?: 'ember' | 'neutral'
}

export default function ProgressBar({ label, progress, eta, tone = 'ember' }: ProgressBarProps) {
  const done = progress >= 100
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest2 text-bone-faint mb-1.5">
        <span>{label}</span>
        <span className={done ? 'text-bone-dim' : tone === 'ember' ? 'text-ember' : 'text-bone-dim'}>
          {done ? 'Done' : eta}
        </span>
      </div>
      <div className="h-[3px] w-full bg-white/10">
        <div
          className={`h-full transition-all duration-500 ${done ? 'bg-white/25' : 'bg-ember'}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}
