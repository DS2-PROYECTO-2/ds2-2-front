import { apiClient } from '../utils/api'
import type { User } from '../context/AuthContext'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  message: string
  token: string
  user: {
    id: number
    username: string
    email: string
    role: string
    is_verified: boolean
  }
}

export interface AuthError {
  username?: string[]
  password?: string[]
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<LoginCredentials, AuthResponse>('/api/auth/login/', credentials)
      
      // Guardar token y usuario en localStorage
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return response
    } catch (error: unknown) {
      // Re-lanzar el error para que el componente pueda manejarlo
      throw new Error(error instanceof Error ? error.message : String(error))
    }
  },

  logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },

  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  getToken() {
    return localStorage.getItem('authToken')
  },

  isAuthenticated() {
    return !!this.getToken()
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/profile/');
    return response;
  },
}