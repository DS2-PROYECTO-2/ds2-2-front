import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface SecurityGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'monitor';
  requireVerified?: boolean;
}

const SecurityGuard: React.FC<SecurityGuardProps> = ({ 
  children, 
  requiredRole, 
  requireVerified = false 
}) => {
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = () => {
      // Verificar autenticación básica
      if (!user) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Verificar rol si es requerido
      if (requiredRole && user.role !== requiredRole) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Verificar verificación si es requerida
      if (requireVerified && !user.is_verified) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Verificar integridad del token
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        // Decodificar y verificar el token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Verificar expiración
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem('token');
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Verificar que el usuario del token coincida
        if (payload.user_id !== user.id) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);
      } catch {
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [user, requiredRole, requireVerified]);

  if (isLoading) {
    return (
      <div className="security-guard-loading">
        <div className="spinner"></div>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="security-guard-denied">
        <h3>Acceso Denegado</h3>
        <p>No tienes permisos para acceder a esta función.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default SecurityGuard;


