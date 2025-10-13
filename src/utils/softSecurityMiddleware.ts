import { validateToken } from './tokenUtils';

// Middleware de seguridad "suave" que no desloguea automáticamente
export const softSecureApiCall = async <T>(
  apiCall: () => Promise<T>,
  requiredRole: 'admin' | 'monitor' | 'any' = 'any',
  action: string = 'realizar acción'
): Promise<T> => {
    // 
    // Obtener información del usuario desde el token almacenado
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No autorizado: Token no encontrado. Por favor, inicia sesión nuevamente.');
    }

    // Validar el token usando la utilidad
    const tokenValidation = validateToken(token);
    if (!tokenValidation.isValid) {
      // NO desloguear automáticamente, solo mostrar error
      throw new Error(`No autorizado: ${tokenValidation.error}`);
    }

    const payload = tokenValidation.payload;
    const userRole = payload?.role;
    const isVerified = (payload as Record<string, unknown>)?.is_verified;

    // Validar rol si es necesario
    if (requiredRole !== 'any') {
      if (userRole !== requiredRole) {
        throw new Error(`No autorizado: Se requiere rol ${requiredRole} para ${action}. Rol actual: ${userRole}`);
      }
      
      // Para admins, también verificar que estén verificados
      if (requiredRole === 'admin' && !isVerified) {
        throw new Error('No autorizado: Se requiere usuario verificado para acciones administrativas');
      }
    }

    // Realizar la llamada a la API
    return await apiCall();
};

// Wrapper para operaciones de administrador (versión suave)
export const softAdminOnly = <T>(apiCall: () => Promise<T>, action: string): Promise<T> => {
  return softSecureApiCall(apiCall, 'admin', action);
};

// Wrapper para operaciones que requieren autenticación (versión suave)
export const softAuthenticatedOnly = <T>(apiCall: () => Promise<T>, action: string): Promise<T> => {
  return softSecureApiCall(apiCall, 'any', action);
};
