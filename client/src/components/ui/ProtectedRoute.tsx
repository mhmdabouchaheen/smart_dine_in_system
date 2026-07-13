import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types'

interface ProtectedRouteProps {
  children: ReactNode
  allow: UserRole[]
}

export default function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
