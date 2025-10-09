
// Middleware de seguridad para validar permisos antes de hacer llamadas a la API
export const secureApiCall = async (
  apiCall: () => Promise<any>,
  action: string = 'realizar acción'
) => {
  try {
    // Obtener token del localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No autorizado: Token no encontrado. Por favor, inicia sesión nuevamente.');
    }

    // Validar formato básico del token (debe ser string alfanumérico)
    if (!/^[a-zA-Z0-9]+$/.test(token)) {
      throw new Error('No autorizado: Token con formato inválido');
    }

    // Realizar la llamada a la API con el token
    return await apiCall();
  } catch (error: any) {
    
    // Manejar errores específicos del backend
    if (error.status === 401) {
      // Token inválido o expirado - desloguear
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (error.status === 403) {
      // Sin permisos - NO desloguear, solo mostrar error
      throw new Error(`No tienes permisos para ${action}. Verifica tu rol y estado de verificación.`);
    } else if (error.status === 400) {
      // Error de validación - NO desloguear, pero preservar el mensaje específico
      if (error.data && typeof error.data === 'object') {
        // Pasar el error original para que el handler lo procese
        throw error;
      } else {
        throw new Error('Datos inválidos. Verifica la información ingresada.');
      }
    } else {
      // Otros errores - NO desloguear
      throw error;
    }
  }
};

// Wrapper para operaciones de administrador
export const adminOnly = (apiCall: () => Promise<any>, action: string) => {
  return secureApiCall(apiCall, action);
};

// Wrapper para operaciones que requieren autenticación
export const authenticatedOnly = (apiCall: () => Promise<any>, action: string) => {
  return secureApiCall(apiCall, action);
};
