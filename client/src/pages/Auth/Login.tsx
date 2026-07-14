import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserRound, LogIn } from 'lucide-react'
import { useAuth } from '../../context/authContextValue'
import { TextInput } from '../../components/ui/FormField'
import Button from '../../components/ui/Button'
import { validateEmail, hasErrors, type FieldErrors } from '../../utils/validation'

interface FormState {
  email: string
  password: string
}

type Stage = 'choice' | 'form'

export default function Login() {
  const { login, continueAsGuest, isLoading } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('choice')
  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<keyof FormState>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function handleGuest() {
    continueAsGuest()
    navigate('/')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors: FieldErrors<keyof FormState> = {
      email: validateEmail(form.email),
      password: form.password ? undefined : 'Password is required.',
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    try {
      setFormError(null)
      const user = await login(form)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'staff') navigate('/staff/orders')
      else navigate('/')
    } catch {
      setFormError('Could not sign you in. Check your details and try again.')
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-40 pb-24">
      <p className="eyebrow mb-4">Welcome</p>
      <h1 className="font-display text-4xl mb-8">
        {stage === 'choice' ? (
          <>
            How would you <em className="text-ember italic">like to continue?</em>
          </>
        ) : (
          <>
            Sign <em className="text-ember italic">in.</em>
          </>
        )}
      </h1>

      {stage === 'choice' && (
        <div className="space-y-3">
          <button
            onClick={handleGuest}
            className="w-full flex items-center gap-4 border border-white/15 hover:border-ember p-5 text-left transition-colors"
          >
            <UserRound size={20} className="text-ember shrink-0" />
            <div>
              <p className="text-sm text-bone">Continue as Guest</p>
              <p className="text-xs text-bone-faint mt-0.5">
                Order and reserve right away — no account needed.
              </p>
            </div>
          </button>
          <button
            onClick={() => setStage('form')}
            className="w-full flex items-center gap-4 border border-white/15 hover:border-ember p-5 text-left transition-colors"
          >
            <LogIn size={20} className="text-ember shrink-0" />
            <div>
              <p className="text-sm text-bone">Login / Sign Up</p>
              <p className="text-xs text-bone-faint mt-0.5">
                Save your details, track order history, and more.
              </p>
            </div>
          </button>
        </div>
      )}

      {stage === 'form' && (
        <>
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              error={errors.email}
              placeholder="you@example.com"
            />
            <TextInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              error={errors.password}
              placeholder="••••••••"
            />

            {formError && <p className="text-sm text-ember">{formError}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-sm text-bone-dim mt-8">
            New here?{' '}
            <Link to="/signup" className="text-ember hover:underline">
              Create an account
            </Link>
          </p>

          <button
            onClick={() => setStage('choice')}
            className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone mt-8"
          >
            &larr; Back
          </button>

          <div className="mt-10 pt-8 border-t border-white/10 text-xs text-bone-faint space-y-1">
            <p className="uppercase tracking-widest2 mb-2">Demo accounts</p>
            <p>Admin — admin@noirsel.com / Admin123</p>
            <p>Staff — staff@noirsel.com / Staff123</p>
            <p>Any other email/password creates a guest customer session.</p>
          </div>
        </>
      )}
    </div>
  )
}
