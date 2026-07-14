import { createContext, useContext } from 'react'
import type { AuthUser, LoginPayload, SignupPayload } from '../types'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  signup: (payload: SignupPayload) => Promise<AuthUser>
  continueAsGuest: () => AuthUser
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}
