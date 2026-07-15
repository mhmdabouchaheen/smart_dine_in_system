import { z } from 'zod'

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function required(value: unknown, label: string): string | undefined {
  if (value === null || value === undefined) return `${label} is required.`
  if (typeof value === 'string' && value.trim().length === 0) return `${label} is required.`
  if (typeof value === 'number' && Number.isNaN(value)) return `${label} is required.`
  return undefined
}

function getZodError(result: any): string | undefined {
  if (result.success) return undefined
  if (!result.error) return 'Invalid input.'
  const issue = result.error.issues?.[0] || result.error.errors?.[0]
  return issue?.message || 'Invalid input.'
}

const emailSchema = z.string().min(1, 'Email is required.').email('Enter a valid email address.')
export function validateEmail(value: string): string | undefined {
  return getZodError(emailSchema.safeParse(value))
}

const phoneSchemaOptional = z.string().regex(/^[+]?[\d\s()-]{7,20}$/, 'Enter a valid phone number.').optional().or(z.literal(''))
const phoneSchemaRequired = z.string().min(1, 'Phone number is required.').regex(/^[+]?[\d\s()-]{7,20}$/, 'Enter a valid phone number.')
export function validatePhone(value: string, optional = false): string | undefined {
  return getZodError(optional ? phoneSchemaOptional.safeParse(value) : phoneSchemaRequired.safeParse(value))
}

const passwordSchema = z.string()
  .min(1, 'Password is required.')
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[0-9]/, 'Include at least one number.')
export function validatePassword(value: string): string | undefined {
  return getZodError(passwordSchema.safeParse(value))
}

export function validateConfirmPassword(value: string, password: string): string | undefined {
  if (!value) return 'Please confirm your password.'
  if (value !== password) return 'Passwords do not match.'
  return undefined
}

export function validateName(value: string, label = 'Name'): string | undefined {
  const schema = z.string().trim().min(1, `${label} is required.`).min(2, `${label} must be at least 2 characters.`)
  return getZodError(schema.safeParse(value))
}

export function validatePositiveNumber(value: number | string, label: string): string | undefined {
  if (value === '' || value === null || value === undefined) return `${label} is required.`
  
  const schema = z.coerce.number().positive(`${label} must be greater than 0.`)
  const result = schema.safeParse(value)
  
  if (!result.success) {
    const msg = getZodError(result)
    if (msg === `${label} must be greater than 0.`) return msg
    return `${label} is required.`
  }
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

const cardNumberSchema = z.string().transform(v => v.replace(/\s/g, '')).pipe(z.string().min(1, 'Card number is required.').regex(/^\d{13,19}$/, 'Enter a valid card number.'))
export function validateCardNumber(value: string): string | undefined {
  return getZodError(cardNumberSchema.safeParse(value))
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

const cvvSchema = z.string().min(1, 'CVV is required.').regex(/^\d{3,4}$/, 'Enter a valid CVV.')
export function validateCVV(value: string): string | undefined {
  return getZodError(cvvSchema.safeParse(value))
}
