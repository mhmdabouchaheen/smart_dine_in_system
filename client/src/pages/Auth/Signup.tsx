import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
import { TextInput } from '../../components/ui/FormField'
import Button from '../../components/ui/Button'
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  hasErrors,
  type FieldErrors,
} from '../../utils/validation'

interface FormState {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const initialForm: FormState = { name: '', email: '', phone: '', password: '', confirmPassword: '' }

export default function Signup() {
  const { signup, isLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FieldErrors<keyof FormState>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors: FieldErrors<keyof FormState> = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.confirmPassword, form.password),
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    try {
      setFormError(null)
      await signup(form)
      navigate('/')
    } catch {
      setFormError('Could not create your account. Please try again.')
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-40 pb-24">
      <p className="eyebrow mb-4">Join Us</p>
      <h1 className="font-display text-4xl mb-8">
        Create an <em className="text-ember italic">account.</em>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextInput
          label="Full Name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
          placeholder="Your name"
        />
        <TextInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <TextInput
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          error={errors.phone}
          placeholder="+1 (___) ___-____"
        />
        <TextInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
          hint="At least 8 characters, one uppercase letter, one number."
          placeholder="••••••••"
        />
        <TextInput
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          placeholder="••••••••"
        />

        {formError && <p className="text-sm text-ember">{formError}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-sm text-bone-dim mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-ember hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
