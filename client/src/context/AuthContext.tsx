import { useEffect, useState, type ReactNode } from 'react'
import type { AuthUser, LoginPayload, SignupPayload } from '../types'
import * as api from '../services/api'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setLoading] = useState(true)

  // Restore logged-in user from JWT cookie
  useEffect(() => {
    async function checkAuth() {
      try {
        const savedGuest = sessionStorage.getItem('guest_user')
        if (savedGuest) {
          setUser(JSON.parse(savedGuest))
          setLoading(false)
          return
        }

        const result = await api.getCurrentUser()

        setUser({
  ...result.user,
  role: result.user.role as AuthUser['role'],
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
      sessionStorage.removeItem('guest_user')
      const result = await api.login(payload)

      const loggedUser = {
  ...result.user,
  role: result.user.role as AuthUser['role'],
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
      sessionStorage.removeItem('guest_user')
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
      role: 'Customer',
    }

    sessionStorage.setItem('guest_user', JSON.stringify(guest))
    setUser(guest)
    api.logout().catch((err) => console.error('Failed to clear customer cookie:', err))

    return guest
  }

  async function logout() {
    await api.logout()
    sessionStorage.removeItem('guest_user')
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

export { useAuth } from './authContextValue'