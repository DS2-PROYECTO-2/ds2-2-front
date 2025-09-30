import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <div>Cargando...</div>
  if (!isAuthenticated) return <Navigate to="/login" />
  
  return <>{children}</>
}