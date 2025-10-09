/**
 * Sistema robusto de manejo de errores basado en la documentación del backend
 * Proporciona mensajes específicos y user-friendly para todos los tipos de errores
 */

export interface ValidationError {
  [fieldName: string]: string[];
}

export interface BusinessError {
  error: string;
  details: {
    reason: string;
    field?: string;
    additional_info?: string;
  };
}

export interface DetailedError {
  error: string;
  details: any;
  info?: string;
  warning?: {
    type: string;
    message: string;
    is_critical: boolean;
  };
}

export const ErrorCodes = {
  // Autenticación
  INVALID_TOKEN: 'invalid_token',
  TOKEN_EXPIRED: 'token_expired',
  USER_NOT_VERIFIED: 'user_not_verified',
  ACCOUNT_DISABLED: 'account_disabled',
  
  // Validación
  VALIDATION_ERROR: 'validation_error',
  REQUIRED_FIELD: 'required_field',
  INVALID_FORMAT: 'invalid_format',
  UNIQUE_CONSTRAINT: 'unique_constraint',
  
  // Negocio
  SCHEDULE_REQUIRED: 'schedule_required',
  SIMULTANEOUS_ENTRY: 'simultaneous_entry',
  MULTIPLE_MONITORS: 'multiple_monitors',
  NO_ACTIVE_ENTRY: 'no_active_entry',
  
  // Servidor
  INTERNAL_ERROR: 'internal_error',
  DATABASE_ERROR: 'database_error',
  NOTIFICATION_ERROR: 'notification_error'
} as const;

export class ApiErrorHandler {
  /**
   * Maneja errores de API y retorna mensajes específicos y user-friendly
   */
  static handleError(error: any): string {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return this.handleValidationError(data);
        case 401:
          return this.handleAuthError(data);
        case 403:
          return this.handlePermissionError(data);
        case 404:
          return this.handleNotFoundError(data);
        case 500:
          return this.handleServerError(data);
        default:
          return 'Error desconocido del servidor';
      }
    }
    
    // Si no hay response, verificar si el error tiene status y data directamente
    if (error.status && error.data) {
      switch (error.status) {
        case 400:
          return this.handleValidationError(error.data);
        case 401:
          return this.handleAuthError(error.data);
        case 403:
          return this.handlePermissionError(error.data);
        case 404:
          return this.handleNotFoundError(error.data);
        case 500:
          return this.handleServerError(error.data);
        default:
          return 'Error desconocido del servidor';
      }
    }
    
    // Error de red o conexión
    if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }
    
    // Fallback: intentar parsear si el error es un string JSON
    if (typeof error.message === 'string' && error.message.startsWith('{')) {
      try {
        const parsedError = JSON.parse(error.message);
        return this.handleValidationError(parsedError);
      } catch (e) {
        // Error al parsear JSON, continuar con el mensaje original
      }
    }
    
    // Error genérico
    return error.message || 'Error desconocido';
  }

  /**
   * Maneja errores de validación (400 Bad Request)
   */
  static handleValidationError(data: any): string {
    
    if (typeof data === 'object' && data !== null) {
      // Error de negocio específico (prioridad alta)
      if (data.error) {
        return this.handleBusinessError(data);
      }
      
      // Errores de conflicto de horarios (prioridad alta)
      if (data.user_conflict) {
        return this.handleBusinessError(data);
      }
      
      if (data.room_conflict) {
        return this.handleBusinessError(data);
      }
      
      // Error de validación de campos específicos
      const fields = Object.keys(data);
      if (fields.length > 0) {
        const firstField = fields[0];
        const messages = data[firstField];
        const message = Array.isArray(messages) ? messages[0] : messages;
        
        // Mapear campos a nombres más amigables
        const fieldNames: { [key: string]: string } = {
          'username': 'Nombre de usuario',
          'email': 'Correo electrónico',
          'password': 'Contraseña',
          'password_confirm': 'Confirmación de contraseña',
          'first_name': 'Nombre',
          'last_name': 'Apellido',
          'identification': 'Identificación',
          'phone': 'Teléfono',
          'start_datetime': 'Fecha y hora de inicio',
          'end_datetime': 'Fecha y hora de fin',
          'user': 'Monitor',
          'room': 'Sala'
        };
        
        const fieldName = fieldNames[firstField] || firstField;
        return `${fieldName}: ${message}`;
      }
    }
    
    return 'Error de validación. Verifica los datos ingresados.';
  }

  /**
   * Maneja errores de autenticación (401 Unauthorized)
   */
  static handleAuthError(data: any): string {
    
    if (data.detail === 'Invalid token.') {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    
    if (data.detail === 'Authentication credentials were not provided.') {
      return 'Debes iniciar sesión para acceder a esta función.';
    }
    
    // Errores específicos de campos
    if (data.username) {
      const message = Array.isArray(data.username) ? data.username[0] : data.username;
      if (message.includes('no ha sido verificada')) {
        return 'Tu cuenta aún no ha sido verificada por un administrador.';
      }
      if (message.includes('desactivada')) {
        return 'Tu cuenta ha sido desactivada. Contacta al administrador.';
      }
      if (message.includes('no encontrado')) {
        return 'Usuario no encontrado. Verifica tu nombre de usuario.';
      }
      return `Usuario: ${message}`;
    }
    
    if (data.password) {
      const message = Array.isArray(data.password) ? data.password[0] : data.password;
      if (message.includes('incorrecta')) {
        return 'Contraseña incorrecta. Verifica tu contraseña.';
      }
      return `Contraseña: ${message}`;
    }
    
    return 'Error de autenticación. Verifica tus credenciales.';
  }

  /**
   * Maneja errores de permisos (403 Forbidden)
   */
  static handlePermissionError(data: any): string {
    
    if (data.error) {
      return data.error;
    }
    
    return 'No tienes permisos para realizar esta acción.';
  }

  /**
   * Maneja errores de recurso no encontrado (404 Not Found)
   */
  static handleNotFoundError(data: any): string {
    
    if (data.error) {
      return data.error;
    }
    
    return 'Recurso no encontrado.';
  }

  /**
   * Maneja errores del servidor (500 Internal Server Error)
   */
  static handleServerError(data: any): string {
    
    if (data.error) {
      return data.error;
    }
    
    return 'Error interno del servidor. Inténtalo más tarde.';
  }

  /**
   * Maneja errores de negocio específicos
   */
  static handleBusinessError(data: any): string {
    
    // Errores de conflicto de horarios
    if (data.user_conflict) {
      const conflictError = Array.isArray(data.user_conflict) ? data.user_conflict[0] : data.user_conflict;
      
      // Limpiar el mensaje si viene con formato de array con corchetes extra
      if (typeof conflictError === 'string' && conflictError.startsWith("['") && conflictError.endsWith("']")) {
        const cleaned = conflictError.slice(2, -2); // Remover [' y ']
        return cleaned;
      }
      
      // Si ya viene limpio, devolver directamente
      return conflictError;
    }
    
    if (data.room_conflict) {
      const conflictError = Array.isArray(data.room_conflict) ? data.room_conflict[0] : data.room_conflict;
      
      // Limpiar el mensaje si viene con formato de array con corchetes extra
      if (typeof conflictError === 'string' && conflictError.startsWith("['") && conflictError.endsWith("']")) {
        const cleaned = conflictError.slice(2, -2); // Remover [' y ']
        return cleaned;
      }
      
      // Si ya viene limpio, devolver directamente
      return conflictError;
    }
    
    // Errores generales de negocio
    const error = data.error;
    if (error) {
      // Errores de entrada a salas
      if (error.includes('Sin turno asignado')) {
        return 'No tienes un turno asignado para esta sala en este horario.';
      }
      
      if (error.includes('entrada activa')) {
        return 'Ya tienes una entrada activa en otra sala. Debes salir primero.';
      }
      
      if (error.includes('monitor asignado') || error.includes('ya tiene un monitor')) {
        return 'La sala ya tiene un monitor asignado en este horario.';
      }
      
      if (error.includes('Sala no encontrada')) {
        return 'La sala seleccionada no existe o está inactiva.';
      }
      
      // Errores de turnos
      if (error.includes('superponen') || error.includes('superposición')) {
        return 'El monitor ya tiene turnos asignados que se superponen con este horario.';
      }
      
      if (error.includes('múltiples monitores') || error.includes('ya tiene un monitor asignado')) {
        return 'La sala ya tiene un monitor asignado en ese horario.';
      }
      
      if (error.includes('fechas pasadas')) {
        return 'No se pueden crear turnos en fechas pasadas.';
      }
    }
    
    // Errores de validación de fechas
    if (data.end_datetime) {
      const endError = Array.isArray(data.end_datetime) ? data.end_datetime[0] : data.end_datetime;
      if (endError.includes('posterior a la fecha de inicio')) {
        return 'La fecha de fin debe ser posterior a la fecha de inicio.';
      }
      if (endError.includes('exceder 12 horas')) {
        return 'Un turno no puede exceder 12 horas de duración.';
      }
      return endError;
    }
    
    // Errores de conflicto de horarios
    if (data.user_conflict) {
      const conflictError = Array.isArray(data.user_conflict) ? data.user_conflict[0] : data.user_conflict;
      
      // Limpiar el mensaje si viene con formato de array con corchetes extra
      if (typeof conflictError === 'string' && conflictError.startsWith("['") && conflictError.endsWith("']")) {
        const cleaned = conflictError.slice(2, -2); // Remover [' y ']
        return cleaned;
      }
      
      // Si ya viene limpio, devolver directamente
      return conflictError;
    }
    
    if (data.room_conflict) {
      const conflictError = Array.isArray(data.room_conflict) ? data.room_conflict[0] : data.room_conflict;
      
      // Limpiar el mensaje si viene con formato de array con corchetes extra
      if (typeof conflictError === 'string' && conflictError.startsWith("['") && conflictError.endsWith("']")) {
        const cleaned = conflictError.slice(2, -2); // Remover [' y ']
        return cleaned;
      }
      
      // Si ya viene limpio, devolver directamente
      return conflictError;
    }
    
    // Errores de validación de campos
    if (data.non_field_errors) {
      const nonFieldError = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
      return nonFieldError;
    }
    
    return error;
  }

  /**
   * Extrae errores de campo específicos para formularios
   */
  static extractFieldErrors(data: any): { [key: string]: string } {
    const fieldErrors: { [key: string]: string } = {};
    
    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(field => {
        if (Array.isArray(data[field])) {
          fieldErrors[field] = data[field][0];
        } else if (typeof data[field] === 'string') {
          fieldErrors[field] = data[field];
        }
      });
    }
    
    return fieldErrors;
  }

  /**
   * Verifica si el error requiere logout del usuario
   */
  static shouldLogout(error: any): boolean {
    if (error.response?.status === 401) {
      return true;
    }
    
    if (error.message?.includes('sesión ha expirado')) {
      return true;
    }
    
    if (error.message?.includes('Token inválido')) {
      return true;
    }
    
    return false;
  }

  /**
   * Maneja errores de notificaciones y warnings
   */
  static handleNotificationError(data: any): { message: string; type: 'info' | 'warning' | 'error' } {
    if (data.warning) {
      return {
        message: data.warning.message,
        type: data.warning.is_critical ? 'error' : 'warning'
      };
    }
    
    if (data.info) {
    return {
        message: data.info,
        type: 'info'
    };
  }
  
    return {
      message: this.handleError({ response: { status: 400, data } }),
      type: 'error'
    };
  }
}

/**
 * Hook para manejo de errores en componentes
 */
export const useApiError = () => {
  const handleApiCall = async (apiCall: () => Promise<any>): Promise<any> => {
    try {
      return await apiCall();
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleError(error);
      throw new Error(errorMessage);
    }
  };

  const handleError = (error: any): string => {
    return ApiErrorHandler.handleError(error);
  };

  const extractFieldErrors = (error: any): { [key: string]: string } => {
    if (error.response?.data) {
      return ApiErrorHandler.extractFieldErrors(error.response.data);
    }
    return {};
  };

  const shouldLogout = (error: any): boolean => {
    return ApiErrorHandler.shouldLogout(error);
  };

  return {
    handleApiCall,
    handleError,
    extractFieldErrors,
    shouldLogout
  };
};

export default ApiErrorHandler;