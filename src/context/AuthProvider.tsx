
import React, { useState, useEffect, useCallback } from 'react'
import { authService, type LoginCredentials } from '../services/authService'
import { AuthContext, type User } from './AuthContext'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'))
  const [isLoading, setIsLoading] = useState(true)

  const setAuth = useCallback((auth: {token: string|null, user: User|null}) => {
    setToken(auth.token)
    setUser(auth.user)
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Cargar perfil del usuario
        const userData = await authService.getProfile();
        setAuth({ token, user: userData });
      } catch {
        // Token inválido, limpiar
        authService.logout();
        setAuth({ token: null, user: null });
      } finally {
        setIsLoading(false);
      }
    };
    
    bootstrap();
  }, [setAuth])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      setToken(response.token)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      setAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}