import React from 'react'
import { Navigate } from 'react-router-dom'
import { UserContext } from '../UserContext'

interface ProtectedRouteProps {
  children: React.ReactElement
  requiredRole?: string
  redirectTo?: string
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = '/login_page',
}: ProtectedRouteProps): React.ReactElement => {
  const { userInfo, isLoading } = UserContext()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen" />
  }

  if (!userInfo) {
    return <Navigate to={redirectTo} replace />
  }

  if (requiredRole && userInfo.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
