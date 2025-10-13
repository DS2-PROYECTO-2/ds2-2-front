
import React, { useState, useEffect, useCallback } from 'react'
import { authService, type LoginCredentials } from '../services/authService'
import { AuthContext, type User } from './AuthContext'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cargar usuario inicial desde localStorage para evitar parpadeo
  const getInitialUser = (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getInitialUser())
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'))
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false) // Estado de hidratación

  const setAuth = useCallback((auth: {token: string|null, user: User|null}) => {
    setToken(auth.token)
    setUser(auth.user)
  }, [])

  // Marcar como hidratado después del primer render
  useEffect(() => {
    setIsHydrated(true);
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return;
      }
      
      // Solo hacer bootstrap si hay token pero no hay usuario
      if (token && !user) {
        setIsLoading(true);
        try {
          // Cargar datos completos del usuario desde el dashboard
          const dashboardData = await authService.getDashboard();
          const userData = dashboardData.user;
          
          // Construir full_name a partir de first_name y last_name si están disponibles
          const userDataTyped = userData as Record<string, unknown>;
          const fullName = userDataTyped.first_name && userDataTyped.last_name 
            ? `${String(userDataTyped.first_name)} ${String(userDataTyped.last_name)}`.trim()
            : String(userDataTyped.full_name || userData.username);
          const userWithFullName = { 
            ...userData, 
            full_name: fullName,
            is_verified: Boolean(userDataTyped.is_verified ?? true) // Valor por defecto si no está presente
          };
          
          setAuth({ token, user: userWithFullName });
        } catch {
          // Token inválido, limpiar
          authService.logout();
          setAuth({ token: null, user: null });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    bootstrap();
  }, [setAuth, user])

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
      isHydrated,
      login,
      logout,
      setAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}