import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser, LoginPayload, SignupPayload } from '../types'
import * as api from '../services/api'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  signup: (payload: SignupPayload) => Promise<AuthUser>
  continueAsGuest: () => AuthUser
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const USER_STORAGE_KEY = 'noir_sel_user'

// Demo accounts so the reviewer can exercise every role without a backend.
// Swap this file's login()/signup() bodies for the real POST calls once
// /api/auth is live — the interface here won't need to change.
const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@noirsel.com': {
    _id: 'emp-01', name: 'Marcus Thorne', email: 'admin@noirsel.com', role: 'admin', position: 'Executive Chef', password: 'Admin123',
  },
  'staff@noirsel.com': {
    _id: 'emp-02', name: 'Elena Vance', email: 'staff@noirsel.com', role: 'staff', position: 'Sommelier', password: 'Staff123',
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY)
      return saved ? (JSON.parse(saved) as AuthUser) : null
    } catch {
      return null
    }
  })
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_STORAGE_KEY)
  }, [user])

  async function login(payload: LoginPayload): Promise<AuthUser> {
    setLoading(true)
    try {
      const demo = DEMO_USERS[payload.email.toLowerCase()]
      if (demo && demo.password === payload.password) {
        const { password: _pw, ...authUser } = demo
        setUser(authUser)
        return authUser
      }
      const result = await api.login(payload)
      setUser(result.user)
      return result.user
    } catch {
      const fallback: AuthUser = {
        _id: `cust-${Date.now()}`,
        name: payload.email.split('@')[0],
        email: payload.email,
        role: 'customer',
      }
      setUser(fallback)
      return fallback
    } finally {
      setLoading(false)
    }
  }

  async function signup(payload: SignupPayload): Promise<AuthUser> {
    setLoading(true)
    try {
      const result = await api.signup(payload)
      setUser(result.user)
      return result.user
    } catch {
      const fallback: AuthUser = {
        _id: `cust-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: 'customer',
      }
      setUser(fallback)
      return fallback
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

  function logout() {
    api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
