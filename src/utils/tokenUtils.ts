// Utilidades para manejo de tokens

export const validateToken = (token: string): { isValid: boolean; error?: string; payload?: {
  user_id: number;
  username: string;
  role: string;
  exp: number;
  iat: number;
} } => {
  if (!token) {
    return { isValid: false, error: 'Token no encontrado' };
  }

  // Verificar formato JWT (3 partes separadas por puntos)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { 
      isValid: false, 
      error: `Token con formato inválido. Debe tener 3 partes, tiene ${parts.length}` 
    };
  }

  try {
    // Decodificar el payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar campos requeridos
    const requiredFields = ['user_id', 'role'];
    const missingFields = requiredFields.filter(field => !(field in payload));
    
    if (missingFields.length > 0) {
      return { 
        isValid: false, 
        error: `Campos faltantes en el token: ${missingFields.join(', ')}` 
      };
    }

    return { isValid: true, payload };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Error al decodificar token: ${error}` 
    };
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('token'); // Por si acaso hay un token con nombre diferente
};

export const getTokenInfo = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return { present: false, error: 'No hay token en localStorage' };
  }

  const validation = validateToken(token);
  if (!validation.isValid) {
    return { present: true, valid: false, error: validation.error };
  }

  return { 
    present: true, 
    valid: true, 
    payload: validation.payload,
    tokenLength: token.length,
    partsCount: token.split('.').length
  };
};

export const forceLogout = () => {
  clearAuthData();
  // Redirigir al login
  window.location.href = '/login';
};

export const handleTokenError = (error: unknown) => {
  // Solo desloguear en casos críticos de token corrupto, NO por problemas de permisos
  if (error && typeof error === 'object' && 'message' in error) {
    const errorWithMessage = error as { message: string };
    if (errorWithMessage.message?.includes('formato inválido') || 
        errorWithMessage.message?.includes('Token inválido o corrupto') ||
        errorWithMessage.message?.includes('Token con formato inválido') ||
        errorWithMessage.message?.includes('Error al decodificar')) {
    
    clearAuthData();
    
    // Mostrar notificación al usuario
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { 
        type: 'error', 
        message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        title: 'Sesión Expirada'
      }
    }));
    
    // Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    }
  } else {
    // Para otros errores (como permisos), solo mostrar notificación
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { 
        type: 'warning', 
        message: 'Problema de autenticación. Verifica tus permisos.',
        title: 'Problema de Permisos'
      }
    }));
  }
};
