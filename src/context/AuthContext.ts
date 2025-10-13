import { createContext } from 'react'
import { type LoginCredentials } from '../services/authService'

interface User {
  id: number
  username: string
  email: string
  role: string
  is_verified: boolean
  full_name?: string
  first_name?: string
  last_name?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  setAuth: (auth: {token: string|null, user: User|null}) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
export type { User, AuthContextType }