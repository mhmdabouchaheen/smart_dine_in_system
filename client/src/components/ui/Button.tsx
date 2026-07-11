import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'solid' | 'outline' | 'ghost' | 'danger'
  as?: ElementType
  href?: string
  to?: string
  className?: string
  [key: string]: unknown
}

export default function Button({
  children,
  variant = 'solid',
  className = '',
  as: Comp = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-widest2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed'

  const variants: Record<string, string> = {
    solid: 'bg-ember text-noir-950 hover:bg-ember-light',
    outline: 'border border-white/25 text-bone hover:border-ember hover:text-ember',
    ghost: 'text-bone-dim hover:text-bone',
    danger: 'border border-red-500/40 text-red-400 hover:bg-red-500/10',
  }

  return (
    <Comp className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Comp>
  )
}
