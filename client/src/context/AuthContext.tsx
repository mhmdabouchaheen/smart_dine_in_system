import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser, LoginPayload, SignupPayload } from '../types'
import * as api from '../services/api'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  signup: (payload: SignupPayload) => Promise<AuthUser>
  continueAsGuest: () => AuthUser
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setLoading] = useState(true)

  // Restore logged-in user from JWT cookie
  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await api.getCurrentUser()

        setUser({
          ...result.user,
          role: String(result.user.role).toLowerCase() as AuthUser['role'],
        })
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  async function login(payload: LoginPayload): Promise<AuthUser> {
    setLoading(true)

    try {
      const result = await api.login(payload)

      const loggedUser = {
        ...result.user,
        role: String(result.user.role).toLowerCase() as AuthUser['role'],
      }

      setUser(loggedUser)

      return loggedUser
    } finally {
      setLoading(false)
    }
  }

  async function signup(payload: SignupPayload): Promise<AuthUser> {
    setLoading(true)

    try {
      const result = await api.signup(payload)

      const newUser = {
        ...result.user,
        role: String(result.user.role).toLowerCase() as AuthUser['role'],
      }

      setUser(newUser)

      return newUser
    } finally {
      setLoading(false)
    }
  }

  function continueAsGuest(): AuthUser {
    const guest: AuthUser = {
      _id: `guest-${Date.now()}`,
      name: 'Guest',
      email: '',
      role: 'customer',
    }

    setUser(guest)

    return guest
  }

  async function logout() {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}