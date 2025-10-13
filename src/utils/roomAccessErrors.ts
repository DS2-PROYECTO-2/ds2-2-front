// Utilidades para manejo de errores de acceso a salas

export interface RoomAccessError {
  type: 'schedule_required' | 'time_mismatch' | 'room_mismatch' | 'user_not_found' | 'server_error';
  message: string;
  details?: Record<string, unknown>;
}

export const parseRoomAccessError = (error: unknown): RoomAccessError => {
  // Si es un error del backend con estructura específica
  if (error && typeof error === 'object' && 'response' in error) {
    const errorWithResponse = error as { response?: { data?: { error?: string; details?: Record<string, unknown> } } };
    if (errorWithResponse.response?.data?.error) {
      const backendError = errorWithResponse.response.data;
    
    // Error de turno requerido
    if (backendError.error?.includes('Sin turno asignado') || 
        backendError.details?.reason === 'schedule_required') {
      return {
        type: 'schedule_required',
        message: 'No tienes turno asignado para esta sala. Contacta al administrador para que te asigne un turno.',
        details: backendError.details
      };
    }
    
    // Error de horario
    if (backendError.error?.includes('horario') || 
        backendError.error?.includes('tiempo')) {
      return {
        type: 'time_mismatch',
        message: 'El acceso no está permitido en este horario',
        details: backendError.details
      };
    }
    
    // Error de sala
    if (backendError.error?.includes('sala') || 
        backendError.error?.includes('room')) {
      return {
        type: 'room_mismatch',
        message: 'No tienes acceso a esta sala',
        details: backendError.details
      };
    }
    
    // Error de usuario
    if (backendError.error?.includes('usuario') || 
        backendError.error?.includes('user')) {
      return {
        type: 'user_not_found',
        message: 'Usuario no encontrado o no autorizado',
        details: backendError.details
      };
    }
    
    // Error genérico del servidor
    return {
      type: 'server_error',
      message: backendError.error || 'Error del servidor',
      details: backendError.details
    };
    }
  }
  
  // Si el error viene directamente en el formato JSON que mencionas
  if (error && typeof error === 'object' && 'data' in error) {
    const errorWithData = error as { data?: { error?: string; details?: Record<string, unknown> } };
    if (errorWithData.data?.error) {
    const errorData = errorWithData.data;
    
    // Error de turno requerido
    if (errorData.error?.includes('Sin turno asignado') || 
        errorData.details?.reason === 'schedule_required') {
      return {
        type: 'schedule_required',
        message: 'No tienes turno asignado para esta sala. Contacta al administrador para que te asigne un turno.',
        details: errorData.details
      };
    }
    
    // Error de horario
    if (errorData.error?.includes('horario') || 
        errorData.error?.includes('tiempo')) {
      return {
        type: 'time_mismatch',
        message: 'El acceso no está permitido en este horario',
        details: errorData.details
      };
    }
    
    // Error de sala
    if (errorData.error?.includes('sala') || 
        errorData.error?.includes('room')) {
      return {
        type: 'room_mismatch',
        message: 'No tienes acceso a esta sala',
        details: errorData.details
      };
    }
    
    // Error de usuario
    if (errorData.error?.includes('usuario') || 
        errorData.error?.includes('user')) {
      return {
        type: 'user_not_found',
        message: 'Usuario no encontrado o no autorizado',
        details: errorData.details
      };
    }
    
    // Error genérico del servidor
    return {
      type: 'server_error',
      message: errorData.error || 'Error del servidor',
      details: errorData.details
    };
    }
  }
  
  // Si es un error de red o conexión
  if (error && typeof error === 'object' && ('code' in error || 'message' in error)) {
    const errorWithCode = error as { code?: string; message?: string };
    if (errorWithCode.code === 'NETWORK_ERROR' || errorWithCode.message?.includes('Network Error')) {
    return {
      type: 'server_error',
      message: 'Error de conexión. Verifica tu internet e intenta nuevamente',
      details: error
    };
    }
  }
  
  // Error genérico
  return {
    type: 'server_error',
    message: 'Error inesperado. Intenta nuevamente',
    details: error as Record<string, unknown>
  };
};

export const getErrorMessage = (error: RoomAccessError): string => {
  switch (error.type) {
    case 'schedule_required':
      return 'No tienes turno asignado para esta sala. Contacta al administrador para que te asigne un turno.';
    
    case 'time_mismatch':
      return 'El acceso no está permitido en este horario. Verifica que tu turno esté activo.';
    
    case 'room_mismatch':
      return 'No tienes acceso a esta sala. Verifica que tu turno sea para la sala correcta.';
    
    case 'user_not_found':
      return 'Usuario no encontrado. Verifica que estés logueado correctamente.';
    
    case 'server_error':
    default:
      return error.message || 'Error inesperado. Intenta nuevamente.';
  }
};

export const getErrorTitle = (error: RoomAccessError): string => {
  switch (error.type) {
    case 'schedule_required':
      return 'Sin Turno Asignado';
    
    case 'time_mismatch':
      return 'Horario Incorrecto';
    
    case 'room_mismatch':
      return 'Sala No Autorizada';
    
    case 'user_not_found':
      return 'Usuario No Encontrado';
    
    case 'server_error':
    default:
      return 'Error de Acceso';
  }
};

export const getErrorIcon = (error: RoomAccessError): string => {
  switch (error.type) {
    case 'schedule_required':
      return '📅';
    
    case 'time_mismatch':
      return '⏰';
    
    case 'room_mismatch':
      return '🚪';
    
    case 'user_not_found':
      return '👤';
    
    case 'server_error':
    default:
      return '⚠️';
  }
};

export const getErrorAction = (error: RoomAccessError): string => {
  switch (error.type) {
    case 'schedule_required':
      return 'Contacta al administrador para que te asigne un turno';
    
    case 'time_mismatch':
      return 'Verifica el horario de tu turno';
    
    case 'room_mismatch':
      return 'Verifica que tu turno sea para la sala correcta';
    
    case 'user_not_found':
      return 'Verifica que estés logueado correctamente';
    
    case 'server_error':
    default:
      return 'Intenta nuevamente en unos minutos';
  }
};

// Función específica para manejar el formato JSON del backend
export const parseBackendJsonError = (jsonError: string): RoomAccessError => {
  try {
    const errorData = JSON.parse(jsonError);
    
    // Error de turno requerido
    if (errorData.error === 'Sin turno asignado para esta sala' || 
        errorData.details?.reason === 'schedule_required') {
      return {
        type: 'schedule_required',
        message: 'No tienes turno asignado para esta sala. Contacta al administrador para que te asigne un turno.',
        details: errorData.details
      };
    }
    
    // Error de horario
    if (errorData.error?.includes('horario') || 
        errorData.error?.includes('tiempo')) {
      return {
        type: 'time_mismatch',
        message: 'El acceso no está permitido en este horario. Verifica que tu turno esté activo.',
        details: errorData.details
      };
    }
    
    // Error de sala
    if (errorData.error?.includes('sala') || 
        errorData.error?.includes('room')) {
      return {
        type: 'room_mismatch',
        message: 'No tienes acceso a esta sala. Verifica que tu turno sea para la sala correcta.',
        details: errorData.details
      };
    }
    
    // Error de usuario
    if (errorData.error?.includes('usuario') || 
        errorData.error?.includes('user')) {
      return {
        type: 'user_not_found',
        message: 'Usuario no encontrado o no autorizado.',
        details: errorData.details
      };
    }
    
    // Error genérico del servidor
    return {
      type: 'server_error',
      message: errorData.error || 'Error del servidor',
      details: errorData.details
    };
  } catch (parseError) {
    // Si no se puede parsear el JSON, devolver error genérico
    return {
      type: 'server_error',
      message: 'Error inesperado del servidor',
      details: { originalError: jsonError, parseError }
    };
  }
};
