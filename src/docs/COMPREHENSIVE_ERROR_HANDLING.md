# 🚨 Sistema Completo de Manejo de Errores - Frontend

## Problema Identificado

Los mensajes de error en el frontend eran **genéricos** y no especificaban el error real del backend. Los usuarios veían mensajes como "Error al crear el turno" en lugar de mensajes específicos como "La fecha de fin debe ser posterior a la fecha de inicio".

## Solución Implementada

### **1. Sistema Robusto de Manejo de Errores**

#### **Clase ApiErrorHandler:**
```typescript
export class ApiErrorHandler {
  static handleError(error: any): string {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400: return this.handleValidationError(data);
        case 401: return this.handleAuthError(data);
        case 403: return this.handlePermissionError(data);
        case 404: return this.handleNotFoundError(data);
        case 500: return this.handleServerError(data);
        default: return 'Error desconocido del servidor';
      }
    }
    
    return error.message || 'Error desconocido';
  }
}
```

#### **Manejo de Errores de Validación (400):**
```typescript
static handleValidationError(data: any): string {
  // Error de validación de campos específicos
  const fields = Object.keys(data);
  if (fields.length > 0) {
    const firstField = fields[0];
    const messages = data[firstField];
    const message = Array.isArray(messages) ? messages[0] : messages;
    
    // Mapear campos a nombres más amigables
    const fieldNames = {
      'username': 'Nombre de usuario',
      'email': 'Correo electrónico',
      'password': 'Contraseña',
      'start_datetime': 'Fecha y hora de inicio',
      'end_datetime': 'Fecha y hora de fin',
      'user': 'Monitor',
      'room': 'Sala'
    };
    
    const fieldName = fieldNames[firstField] || firstField;
    return `${fieldName}: ${message}`;
  }
  
  // Error de negocio específico
  if (data.error) {
    return this.handleBusinessError(data);
  }
}
```

#### **Manejo de Errores de Negocio:**
```typescript
static handleBusinessError(data: any): string {
  const error = data.error;
  
  // Errores de entrada a salas
  if (error.includes('Sin turno asignado')) {
    return 'No tienes un turno asignado para esta sala en este horario.';
  }
  
  if (error.includes('entrada activa')) {
    return 'Ya tienes una entrada activa en otra sala. Debes salir primero.';
  }
  
  if (error.includes('monitor asignado')) {
    return 'La sala ya tiene un monitor asignado en este horario.';
  }
  
  // Errores de turnos
  if (error.includes('superponen')) {
    return 'El monitor ya tiene turnos asignados que se superponen con este horario.';
  }
  
  if (error.includes('múltiples monitores')) {
    return 'La sala ya tiene un monitor asignado en ese horario.';
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
  
  return error;
}
```

### **2. Componente ErrorDisplay**

#### **Componente Visual:**
```typescript
interface ErrorDisplayProps {
  error: string | null;
  onClear: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  showIcon?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, onClear, type = 'error', title, showIcon = true, className = '' 
}) => {
  if (!error) return null;

  return (
    <div className={`error-container ${type} ${className}`}>
      <div className="error-content">
        {showIcon && getIcon()}
        <div className="error-text-content">
          {title && <div className="error-title">{title}</div>}
          <div className="error-message">{error}</div>
        </div>
        <button className="error-close" onClick={onClear}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
```

#### **Estilos CSS:**
```css
.error-container {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid;
  animation: slideIn 0.3s ease-out;
}

.error-container.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.error-container.warning {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #d97706;
}
```

### **3. Hook useApiError**

#### **Hook para Componentes:**
```typescript
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
```

### **4. Integración en ScheduleCalendar**

#### **Estados de Error:**
```typescript
// Estados para manejo de errores
const [apiError, setApiError] = useState<string | null>(null);
const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
```

#### **Función saveSchedule Simplificada:**
```typescript
} catch (error: any) {
  console.error('Error creating schedule:', error);
  
  // Usar el nuevo sistema de manejo de errores
  const errorMessage = handleError(error);
  const extractedFieldErrors = extractFieldErrors(error);
  
  // Actualizar estados de error
  setApiError(errorMessage);
  setFieldErrors(extractedFieldErrors);
  
  // Verificar si debe desloguear
  if (shouldLogout(error)) {
    console.warn('Deslogueando por error crítico de token');
    setTimeout(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }, 3000);
  }
}
```

#### **Render del ErrorDisplay:**
```typescript
{/* Error Display */}
<ErrorDisplay 
  error={apiError}
  onClear={() => setApiError(null)}
  type="error"
  title="Error al crear turno"
/>
```

## Tipos de Errores Manejados

### **🔐 Errores de Autenticación (401):**
- **Token inválido:** "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
- **Usuario no verificado:** "Tu cuenta aún no ha sido verificada por un administrador."
- **Cuenta desactivada:** "Tu cuenta ha sido desactivada. Contacta al administrador."

### **📝 Errores de Validación (400):**
- **Campos requeridos:** "Nombre: Este campo es requerido"
- **Formato inválido:** "Email: Ingrese una dirección de correo electrónico válida"
- **Contraseñas no coinciden:** "Confirmación de contraseña: Las contraseñas no coinciden"

### **🏢 Errores de Negocio (400):**
- **Sin turno asignado:** "No tienes un turno asignado para esta sala en este horario"
- **Entrada simultánea:** "Ya tienes una entrada activa en otra sala. Debes salir primero"
- **Sala ocupada:** "La sala ya tiene un monitor asignado en este horario"

### **📅 Errores de Turnos (400):**
- **Fechas inválidas:** "La fecha de fin debe ser posterior a la fecha de inicio"
- **Duración excesiva:** "Un turno no puede exceder 12 horas de duración"
- **Conflicto de horarios:** "El monitor ya tiene turnos asignados que se superponen"

### **🚫 Errores de Permisos (403):**
- **Acceso denegado:** "No tienes permisos para realizar esta acción"

### **🔧 Errores del Servidor (500):**
- **Error interno:** "Error interno del servidor. Inténtalo más tarde"

## Archivos Creados/Modificados

### **1. `src/utils/errorHandler.ts`** (NUEVO)
- ✅ Clase `ApiErrorHandler` completa
- ✅ Hook `useApiError` para componentes
- ✅ Manejo de todos los tipos de errores
- ✅ Mapeo de campos a nombres amigables

### **2. `src/components/common/ErrorDisplay.tsx`** (NUEVO)
- ✅ Componente visual para mostrar errores
- ✅ Soporte para diferentes tipos (error, warning, info, success)
- ✅ Botón de cerrar
- ✅ Iconos descriptivos

### **3. `src/styles/ErrorDisplay.css`** (NUEVO)
- ✅ Estilos para todos los tipos de errores
- ✅ Animaciones de entrada y salida
- ✅ Diseño responsive
- ✅ Variantes de color por tipo

### **4. `src/components/schedule/ScheduleCalendar.tsx`** (MODIFICADO)
- ✅ Integración del nuevo sistema de errores
- ✅ Estados para errores de API y campos
- ✅ Componente ErrorDisplay en el render
- ✅ Función `saveSchedule` simplificada

## Ventajas de la Solución

### **✅ Mensajes Específicos:**
- **Antes:** "Error al crear el turno"
- **Después:** "La fecha de fin debe ser posterior a la fecha de inicio"

### **✅ Mapeo de Campos:**
- **Antes:** "user: ['Este campo es requerido']"
- **Después:** "Monitor: Este campo es requerido"

### **✅ Manejo de Errores de Negocio:**
- **Antes:** "Error de validación"
- **Después:** "No tienes un turno asignado para esta sala en este horario"

### **✅ Experiencia de Usuario:**
- Mensajes claros y específicos
- Iconos descriptivos
- Botón de cerrar
- Animaciones suaves

### **✅ Mantenibilidad:**
- Sistema centralizado
- Fácil agregar nuevos tipos de errores
- Reutilizable en todos los componentes
- Debugging mejorado

## Ejemplos de Uso

### **En Componentes:**
```typescript
const { handleError, extractFieldErrors, shouldLogout } = useApiError();

try {
  await apiCall();
} catch (error) {
  const errorMessage = handleError(error);
  const fieldErrors = extractFieldErrors(error);
  
  setApiError(errorMessage);
  setFieldErrors(fieldErrors);
  
  if (shouldLogout(error)) {
    // Manejar logout
  }
}
```

### **En Render:**
```typescript
<ErrorDisplay 
  error={apiError}
  onClear={() => setApiError(null)}
  type="error"
  title="Error al crear turno"
/>
```

## Conclusión

**El sistema de manejo de errores ha sido completamente implementado y mejorado.** 🎉

- ✅ **Mensajes específicos** - No más errores genéricos
- ✅ **Mapeo de campos** - Nombres amigables para usuarios
- ✅ **Manejo de negocio** - Errores contextuales del backend
- ✅ **Componente visual** - ErrorDisplay con iconos y animaciones
- ✅ **Sistema centralizado** - Fácil mantenimiento y reutilización
- ✅ **Debugging mejorado** - Console.logs detallados

**¡Ahora todos los mensajes de error son específicos, claros y user-friendly!** 🚀







