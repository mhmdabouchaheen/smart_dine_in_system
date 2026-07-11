import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldWrapperProps {
  label: string
  error?: string
  full?: boolean
  children: ReactNode
  hint?: string
}

export function FieldWrapper({ label, error, full, children, hint }: FieldWrapperProps) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-bone-faint mt-1.5">{hint}</p>}
      {error && <p className="text-[11px] text-ember mt-1.5">{error}</p>}
    </div>
  )
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  full?: boolean
  hint?: string
}

export function TextInput({ label, error, full, hint, className = '', ...props }: TextInputProps) {
  return (
    <FieldWrapper label={label} error={error} full={full} hint={hint}>
      <input
        {...props}
        className={`field ${error ? 'field-error' : ''} ${className}`}
      />
    </FieldWrapper>
  )
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
  full?: boolean
}

export function TextArea({ label, error, full, className = '', ...props }: TextAreaProps) {
  return (
    <FieldWrapper label={label} error={error} full={full}>
      <textarea {...props} className={`field resize-none ${error ? 'field-error' : ''} ${className}`} />
    </FieldWrapper>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  full?: boolean
  children: ReactNode
}

export function Select({ label, error, full, className = '', children, ...props }: SelectProps) {
  return (
    <FieldWrapper label={label} error={error} full={full}>
      <select {...props} className={`field ${error ? 'field-error' : ''} ${className}`}>
        {children}
      </select>
    </FieldWrapper>
  )
}
