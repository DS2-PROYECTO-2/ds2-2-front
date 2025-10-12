import { useAuth } from './useAuth';

export const useSecurity = () => {
  const { user } = useAuth();

  const requireAdmin = (action: string, silent: boolean = false) => {
    if (!user) {
      return false;
    }

    // Verificar que sea administrador
    if (user.role !== 'admin') {
      return false;
    }

    // Verificar que esté verificado (los admins se verifican automáticamente)
    if (!user.is_verified) {
      return false;
    }

    return true;
  };

  const requireAuth = (action: string) => {
    if (!user) {
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

  const handleSecurityError = (error: unknown, action: string) => {
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      if (errorWithMessage.message?.includes('No autorizado')) {
        // Mostrar notificación al usuario
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { 
            type: 'error', 
            message: `No tienes permisos para ${action}` 
          }
        }));
      }
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
