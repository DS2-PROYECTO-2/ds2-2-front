import { useAuth } from './useAuth';

export const useSecurity = () => {
  const { user } = useAuth();

  const requireAdmin = (action: string, silent: boolean = false) => {
    if (!user) {
      if (!silent) {
        console.warn(`Acceso denegado: Usuario no autenticado para ${action}`);
      }
      return false;
    }

    // Verificar que sea administrador
    if (user.role !== 'admin') {
      if (!silent) {
        console.warn(`Acceso denegado: Solo administradores pueden ${action}. Rol actual: ${user.role}`);
      }
      return false;
    }

    // Verificar que esté verificado (los admins se verifican automáticamente)
    if (!user.is_verified) {
      if (!silent) {
        console.warn(`Acceso denegado: Usuario no verificado para ${action}`);
      }
      return false;
    }

    return true;
  };

  const requireAuth = (action: string) => {
    if (!user) {
      console.warn(`Acceso denegado: Usuario no autenticado para ${action}`);
      return false;
    }

    return true;
  };

  const canEdit = (silent: boolean = false) => {
    return requireAdmin('editar turnos', silent);
  };

  const canDelete = (silent: boolean = false) => {
    return requireAdmin('eliminar turnos', silent);
  };

  const canCreate = (silent: boolean = false) => {
    return requireAdmin('crear turnos', silent);
  };

  const canView = () => {
    return requireAuth('ver turnos');
  };

  const handleSecurityError = (error: any, action: string) => {
    if (error.message?.includes('No autorizado')) {
      console.warn(`Acceso denegado: ${error.message}`);
      // Mostrar notificación al usuario
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          type: 'error', 
          message: `No tienes permisos para ${action}` 
        }
      }));
    } else {
      console.error('Error de seguridad:', error);
    }
  };

  return {
    requireAdmin,
    requireAuth,
    canEdit,
    canDelete,
    canCreate,
    canView,
    handleSecurityError,
    // Restaurar validaciones correctas basadas en el backend
    isAdmin: user?.role === 'admin' && user?.is_verified,
    isAuthenticated: !!user
  };
};
