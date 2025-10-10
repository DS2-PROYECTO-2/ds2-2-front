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
  details: Record<string, unknown>;
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
  static handleError(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response: { status: number; data: unknown } };
      const { status, data } = errorWithResponse.response;
      
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
    if (error && typeof error === 'object' && 'status' in error && 'data' in error) {
      const errorWithStatus = error as { status: number; data: unknown };
      switch (errorWithStatus.status) {
        case 400:
          return this.handleValidationError(errorWithStatus.data);
        case 401:
          return this.handleAuthError(errorWithStatus.data);
        case 403:
          return this.handlePermissionError(errorWithStatus.data);
        case 404:
          return this.handleNotFoundError(errorWithStatus.data);
        case 500:
          return this.handleServerError(errorWithStatus.data);
        default:
          return 'Error desconocido del servidor';
      }
    }
    
    // Error de red o conexión
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      if (errorWithMessage.message?.includes('Network Error') || errorWithMessage.message?.includes('Failed to fetch')) {
        return 'Error de conexión. Verifica tu conexión a internet.';
      }
    }
    
    // Fallback: intentar parsear si el error es un string JSON
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      if (typeof errorWithMessage.message === 'string' && errorWithMessage.message.startsWith('{')) {
        try {
          const parsedError = JSON.parse(errorWithMessage.message);
          return this.handleValidationError(parsedError);
        } catch {
          // Error al parsear JSON, continuar con el mensaje original
        }
      }
    }
    
    // Error genérico
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      return errorWithMessage.message || 'Error desconocido';
    }
    return 'Error desconocido';
  }

  /**
   * Maneja errores de validación (400 Bad Request)
   */
  static handleValidationError(data: unknown): string {
    
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      
      // Error de negocio específico (prioridad alta)
      if (dataObj.error) {
        return this.handleBusinessError(dataObj);
      }
      
      // Errores de conflicto de horarios (prioridad alta)
      if (dataObj.user_conflict) {
        return this.handleBusinessError(dataObj);
      }
      
      if (dataObj.room_conflict) {
        return this.handleBusinessError(dataObj);
      }
      
      // Error de validación de campos específicos
      const fields = Object.keys(dataObj);
      if (fields.length > 0) {
        const firstField = fields[0];
        const messages = dataObj[firstField];
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
  static handleAuthError(data: unknown): string {
    const dataObj = data as Record<string, unknown>;
    
    if (dataObj.detail === 'Invalid token.') {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    
    if (dataObj.detail === 'Authentication credentials were not provided.') {
      return 'Debes iniciar sesión para acceder a esta función.';
    }
    
    // Errores específicos de campos
    if (dataObj.username) {
      const message = Array.isArray(dataObj.username) ? dataObj.username[0] : dataObj.username;
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
    
    if (dataObj.password) {
      const message = Array.isArray(dataObj.password) ? dataObj.password[0] : dataObj.password;
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
  static handlePermissionError(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      if (dataObj.error) {
        return String(dataObj.error);
      }
    }
    
    return 'No tienes permisos para realizar esta acción.';
  }

  /**
   * Maneja errores de recurso no encontrado (404 Not Found)
   */
  static handleNotFoundError(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      if (dataObj.error) {
        return String(dataObj.error);
      }
    }
    
    return 'Recurso no encontrado.';
  }

  /**
   * Maneja errores del servidor (500 Internal Server Error)
   */
  static handleServerError(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      if (dataObj.error) {
        return String(dataObj.error);
      }
    }
    
    return 'Error interno del servidor. Inténtalo más tarde.';
  }

  /**
   * Maneja errores de negocio específicos
   */
  static handleBusinessError(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      
      // Errores de conflicto de horarios
      if (dataObj.user_conflict) {
        const conflictError = Array.isArray(dataObj.user_conflict) ? dataObj.user_conflict[0] : dataObj.user_conflict;
        
        // Limpiar el mensaje si viene con formato de array con corchetes extra
        if (typeof conflictError === 'string' && conflictError.startsWith("['") && conflictError.endsWith("']")) {
          const cleaned = conflictError.slice(2, -2); // Remover [' y ']
          return cleaned;
        }
        
        // Si ya viene limpio, devolver directamente
        return String(conflictError);
      }
      
      if (dataObj.room_conflict) {
        const conflictError = Array.isArray(dataObj.room_conflict) ? dataObj.room_conflict[0] : dataObj.room_conflict;
        
        // Limpiar el mensaje si viene con formato de array con corchetes extra
        if (typeof conflictError === 'string' && conflictError.startsWith("['") && conflictError.endsWith("']")) {
          const cleaned = conflictError.slice(2, -2); // Remover [' y ']
          return cleaned;
        }
        
        // Si ya viene limpio, devolver directamente
        return String(conflictError);
      }
      
      // Errores generales de negocio
      const error = dataObj.error;
      if (typeof error === 'string') {
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
      if (dataObj.end_datetime) {
        const endError = Array.isArray(dataObj.end_datetime) ? dataObj.end_datetime[0] : dataObj.end_datetime;
        if (typeof endError === 'string') {
          if (endError.includes('posterior a la fecha de inicio')) {
            return 'La fecha de fin debe ser posterior a la fecha de inicio.';
          }
          if (endError.includes('exceder 12 horas')) {
            return 'Un turno no puede exceder 12 horas de duración.';
          }
          return endError;
        }
      }
      
      // Errores de validación de campos
      if (dataObj.non_field_errors) {
        const nonFieldError = Array.isArray(dataObj.non_field_errors) ? dataObj.non_field_errors[0] : dataObj.non_field_errors;
        return String(nonFieldError);
      }
      
      return String(error || 'Error desconocido');
    }
    
    return 'Error desconocido';
  }

  /**
   * Extrae errores de campo específicos para formularios
   */
  static extractFieldErrors(data: unknown): { [key: string]: string } {
    const fieldErrors: { [key: string]: string } = {};
    
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      Object.keys(dataObj).forEach(field => {
        if (Array.isArray(dataObj[field])) {
          const arrayValue = dataObj[field] as unknown[];
          fieldErrors[field] = String(arrayValue[0]);
        } else if (typeof dataObj[field] === 'string') {
          fieldErrors[field] = dataObj[field];
        }
      });
    }
    
    return fieldErrors;
  }

  /**
   * Verifica si el error requiere logout del usuario
   */
  static shouldLogout(error: unknown): boolean {
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response?: { status?: number } };
      if (errorWithResponse.response?.status === 401) {
        return true;
      }
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message?: string };
      if (errorWithMessage.message?.includes('sesión ha expirado')) {
        return true;
      }
      
      if (errorWithMessage.message?.includes('Token inválido')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Maneja errores de notificaciones y warnings
   */
  static handleNotificationError(data: unknown): { message: string; type: 'info' | 'warning' | 'error' } {
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      
      if (dataObj.warning && typeof dataObj.warning === 'object') {
        const warning = dataObj.warning as { message?: string; is_critical?: boolean };
        return {
          message: warning.message || 'Advertencia',
          type: warning.is_critical ? 'error' : 'warning'
        };
      }
      
      if (dataObj.info) {
        return {
          message: String(dataObj.info),
          type: 'info'
        };
      }
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
  const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    try {
      return await apiCall();
    } catch (error: unknown) {
      const errorMessage = ApiErrorHandler.handleError(error);
      throw new Error(errorMessage);
    }
  };

  const handleError = (error: unknown): string => {
    return ApiErrorHandler.handleError(error);
  };

  const extractFieldErrors = (error: unknown): { [key: string]: string } => {
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response?: { data?: unknown } };
      if (errorWithResponse.response?.data) {
        return ApiErrorHandler.extractFieldErrors(errorWithResponse.response.data);
      }
    }
    return {};
  };

  const shouldLogout = (error: unknown): boolean => {
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