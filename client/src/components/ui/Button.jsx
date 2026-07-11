export default function Button({
  children,
  variant = 'solid',
  className = '',
  as: Comp = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-widest2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    solid: 'bg-ember text-noir-950 hover:bg-ember-light',
    outline: 'border border-white/25 text-bone hover:border-ember hover:text-ember',
    ghost: 'text-bone-dim hover:text-bone',
  }

  return (
    <Comp className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Comp>
  )
}
