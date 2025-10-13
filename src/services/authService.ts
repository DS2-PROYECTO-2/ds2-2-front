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
    const response = await apiClient.post<LoginCredentials, AuthResponse>('/api/auth/login/', credentials)
    // Guardar token y usuario en localStorage
    localStorage.setItem('authToken', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    return response
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

  async updateProfile(profileData: Partial<User>): Promise<{
    message: string;
    user: User;
  }> {
    const response = await apiClient.patch<Partial<User>, {
      message: string;
      user: User;
    }>('/api/auth/profile/update/', profileData);
    return response;
  },

  async getDashboard(): Promise<{
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    stats: {
      total_schedules: number;
      active_schedules: number;
    };
  }> {
    const response = await apiClient.get<{
      user: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
      stats: {
        total_schedules: number;
        active_schedules: number;
      };
    }>('/api/auth/dashboard/');
    return response;
  },
}