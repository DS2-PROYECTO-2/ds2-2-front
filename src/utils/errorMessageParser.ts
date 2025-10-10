// Utilidad para parsear mensajes de error del backend y convertirlos en mensajes legibles

export const parseErrorMessage = (error: unknown): string => {
  if (!error) return 'Error desconocido';
  
  // Si es un string directo
  if (typeof error === 'string') {
    return parseJsonError(error);
  }
  
  // Si es un objeto Error
  if (error instanceof Error && error.message) {
    return parseJsonError(error.message);
  }
  
  // Si es un objeto con message
  const anyErr = error as { message?: string; data?: unknown; status?: number };
  if (anyErr?.message) {
    return parseJsonError(anyErr.message);
  }
  
  // Si tiene data, intentar extraer el mensaje
  if (anyErr?.data) {
    const d = anyErr.data as Record<string, unknown>;
    if (typeof d.detail === 'string') return d.detail;
    if (Array.isArray(d.non_field_errors)) return d.non_field_errors.join(', ');
    const firstField = Object.keys(d)[0];
    const val = d[firstField];
    if (Array.isArray(val)) return `${firstField}: ${val.join(', ')}`;
    if (typeof val === 'string') return `${firstField}: ${val}`;
  }
  
  return 'Ocurrió un error procesando la solicitud';
};

const parseJsonError = (message: string): string => {
  // Si no parece ser JSON, devolver tal como está
  if (!message.includes('{') || !message.includes('error')) {
    return message;
  }
  
  try {
    const errorData = JSON.parse(message);
    
    // Error específico de turno requerido
    if (errorData.error === 'Sin turno asignado para esta sala' || 
        errorData.details?.reason === 'schedule_required') {
      return 'No tienes turno asignado para esta sala. Contacta al administrador para que te asigne un turno.';
    }
    
    // Error de horario
    if (errorData.error?.includes('horario') || 
        errorData.error?.includes('tiempo') ||
        errorData.error?.includes('time')) {
      return 'El acceso no está permitido en este horario. Verifica que tu turno esté activo.';
    }
    
    // Error de sala
    if (errorData.error?.includes('sala') || 
        errorData.error?.includes('room')) {
      return 'No tienes acceso a esta sala. Verifica que tu turno sea para la sala correcta.';
    }
    
    // Error de usuario
    if (errorData.error?.includes('usuario') || 
        errorData.error?.includes('user')) {
      return 'Usuario no encontrado o no autorizado.';
    }
    
    // Error de sala ocupada
    if (errorData.error?.includes('ocupada') || 
        errorData.error?.includes('occupied')) {
      return 'La sala está ocupada por otro monitor. Solo se permite un monitor por sala.';
    }
    
    // Error de entrada simultánea
    if (errorData.error?.includes('simultánea') || 
        errorData.error?.includes('simultaneous')) {
      return 'Ya tienes una entrada activa en otra sala. Debes salir primero antes de ingresar a otra sala.';
    }
    
    // Si tiene un error genérico, usarlo
    if (errorData.error) {
      return errorData.error;
    }
    
    // Si no se puede parsear específicamente, devolver el mensaje original
    return message;
  } catch {
    // Si no se puede parsear como JSON, devolver el mensaje original
    return message;
  }
};

// Función específica para errores de acceso a salas
export const parseRoomAccessError = (error: unknown): string => {
  const message = parseErrorMessage(error);
  
  // Si el mensaje ya está parseado, devolverlo
  if (message.includes('No tienes turno asignado') || 
      message.includes('El acceso no está permitido') ||
      message.includes('No tienes acceso a esta sala') ||
      message.includes('Usuario no encontrado') ||
      message.includes('La sala está ocupada') ||
      message.includes('Ya tienes una entrada activa')) {
    return message;
  }
  
  // Si no se pudo parsear específicamente, devolver mensaje genérico
  return 'Error al acceder a la sala. Verifica que tengas un turno asignado y que esté activo.';
};



