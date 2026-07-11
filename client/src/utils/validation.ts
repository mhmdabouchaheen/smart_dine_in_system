export type FieldErrors<T extends string = string> = Partial<Record<T, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Accepts formats like +1 555-123-4567, (555) 123-4567, 5551234567
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/
const CARD_NUMBER_RE = /^\d{13,19}$/
const CVV_RE = /^\d{3,4}$/

export function required(value: unknown, label: string): string | undefined {
  if (value === null || value === undefined) return `${label} is required.`
  if (typeof value === 'string' && value.trim().length === 0) return `${label} is required.`
  if (typeof value === 'number' && Number.isNaN(value)) return `${label} is required.`
  return undefined
}

export function validateEmail(value: string): string | undefined {
  if (!value) return 'Email is required.'
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address.'
  return undefined
}

export function validatePhone(value: string, optional = false): string | undefined {
  if (!value) return optional ? undefined : 'Phone number is required.'
  if (!PHONE_RE.test(value)) return 'Enter a valid phone number.'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter.'
  if (!/[0-9]/.test(value)) return 'Include at least one number.'
  return undefined
}

export function validateConfirmPassword(value: string, password: string): string | undefined {
  if (!value) return 'Please confirm your password.'
  if (value !== password) return 'Passwords do not match.'
  return undefined
}

export function validateName(value: string, label = 'Name'): string | undefined {
  if (!value || !value.trim()) return `${label} is required.`
  if (value.trim().length < 2) return `${label} must be at least 2 characters.`
  return undefined
}

export function validatePositiveNumber(value: number | string, label: string): string | undefined {
  const num = typeof value === 'string' ? Number(value) : value
  if (value === '' || value === null || value === undefined || Number.isNaN(num)) {
    return `${label} is required.`
  }
  if (num <= 0) return `${label} must be greater than 0.`
  return undefined
}

export function validateDateNotPast(value: string): string | undefined {
  if (!value) return 'Date is required.'
  const chosen = new Date(value + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (chosen < today) return 'Date cannot be in the past.'
  return undefined
}

export function validateTime(value: string): string | undefined {
  if (!value) return 'Time is required.'
  return undefined
}

export function validatePartySize(value: number, max = 20): string | undefined {
  if (!value || value < 1) return 'Party size must be at least 1.'
  if (value > max) return `Party size cannot exceed ${max} for this table.`
  return undefined
}

export function validateCardNumber(value: string): string | undefined {
  const digitsOnly = value.replace(/\s/g, '')
  if (!digitsOnly) return 'Card number is required.'
  if (!CARD_NUMBER_RE.test(digitsOnly)) return 'Enter a valid card number.'
  return undefined
}

export function validateCardExpiry(value: string): string | undefined {
  if (!value) return 'Expiry date is required.'
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim())
  if (!match) return 'Use MM/YY format.'
  const month = Number(match[1])
  const year = Number(`20${match[2]}`)
  if (month < 1 || month > 12) return 'Enter a valid month.'
  const now = new Date()
  const expiry = new Date(year, month)
  if (expiry < now) return 'Card has expired.'
  return undefined
}

export function validateCVV(value: string): string | undefined {
  if (!value) return 'CVV is required.'
  if (!CVV_RE.test(value)) return 'Enter a valid CVV.'
  return undefined
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}
