import { createContext } from 'react'
import { type LoginCredentials } from '../services/authService'

interface User {
  id: number
  username: string
  email: string
  role: string
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
export type { User, AuthContextType }