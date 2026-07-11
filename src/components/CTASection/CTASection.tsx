import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { validateEmail } from '../../utils/validation'

export default function CTASection() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e: FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    setError(err)
    if (err) return
    // No dedicated collection for this in the ERD yet — treat as a
    // lightweight lead-capture the backend can wire up later.
    setSubscribed(true)
    setEmail('')
  }

  return (
    <section className="relative border-t border-white/10">
      <div className="grid md:grid-cols-2">
        <div className="relative overflow-hidden min-h-[360px]">
          <img
            src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"
            alt="Private cellar dining room"
            className="w-full h-full object-cover absolute inset-0 grayscale-[20%]"
          />
          <div className="absolute inset-0 bg-noir-950/50" />
        </div>

        <div className="flex flex-col justify-center px-8 md:px-16 py-16">
          <p className="eyebrow mb-4">Private Cellar</p>
          <h3 className="font-display text-3xl md:text-4xl leading-tight mb-4">
            Ten seats. <em className="text-ember italic">One table.</em>
          </h3>
          <p className="text-bone-dim text-sm leading-relaxed max-w-sm mb-8">
            Our private cellar hosts one seating a night for groups who want the full nine
            courses to themselves — chef-guided, wine-paired, off the main floor.
          </p>
          <Button as={Link} to="/reservation" className="w-fit mb-10">
            Reserve The Cellar
          </Button>

          <div className="pt-8 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-3">
              Hear about new menus first
            </p>
            {subscribed ? (
              <p className="text-sm text-ember">You&rsquo;re on the list — welcome.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`field !py-3 ${error ? 'field-error' : ''}`}
                    aria-label="Email address"
                  />
                  {error && <p className="text-[11px] text-ember mt-1.5">{error}</p>}
                </div>
                <Button type="submit" variant="outline" className="shrink-0">
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
