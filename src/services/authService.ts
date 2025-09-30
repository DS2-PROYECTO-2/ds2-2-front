import { apiClient } from '../utils/api'

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
      const response = await apiClient.post('/api/auth/login/', credentials)
      
      // Guardar token y usuario en localStorage
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return response
    } catch (error: any) {
      // Re-lanzar el error para que el componente pueda manejarlo
      throw new Error(error.message)
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
  }
}