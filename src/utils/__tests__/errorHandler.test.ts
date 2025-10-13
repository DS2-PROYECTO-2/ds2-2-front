import { describe, it, expect } from 'vitest';
import { ApiErrorHandler } from '../errorHandler';

describe('ApiErrorHandler', () => {
  describe('handleError', () => {
    it('debe manejar errores de validación', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Error de validación' }
        }
      };
      const result = ApiErrorHandler.handleError(error);
      expect(result).toContain('Error de validación');
    });

    it('debe manejar errores de autenticación', () => {
      const error = {
        response: {
          status: 401,
          data: { detail: 'Invalid token.' }
        }
      };
      const result = ApiErrorHandler.handleError(error);
      expect(result).toContain('sesión ha expirado');
    });

    it('debe manejar errores de permisos', () => {
      const error = {
        response: {
          status: 403,
          data: { error: 'Sin permisos' }
        }
      };
      const result = ApiErrorHandler.handleError(error);
      expect(result).toContain('Sin permisos');
    });

    it('debe manejar errores de servidor', () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Error interno' }
        }
      };
      const result = ApiErrorHandler.handleError(error);
      expect(result).toContain('Error interno');
    });

    it('debe manejar errores de red', () => {
      const error = new Error('Network Error');
      const result = ApiErrorHandler.handleError(error);
      expect(result).toContain('Error de conexión');
    });

    it('debe manejar errores desconocidos', () => {
      const error = new Error('Error desconocido');
      const result = ApiErrorHandler.handleError(error);
      expect(result).toContain('Error desconocido');
    });
  });

  describe('handleValidationError', () => {
    it('debe manejar errores de negocio', () => {
      const data = { error: 'Error de negocio' };
      const result = ApiErrorHandler.handleValidationError(data);
      expect(result).toContain('Error de negocio');
    });

    it('debe manejar errores de conflicto de usuario', () => {
      const data = { user_conflict: 'Conflicto de usuario' };
      const result = ApiErrorHandler.handleValidationError(data);
      expect(result).toContain('Conflicto de usuario');
    });

    it('debe manejar errores de conflicto de sala', () => {
      const data = { room_conflict: 'Conflicto de sala' };
      const result = ApiErrorHandler.handleValidationError(data);
      expect(result).toContain('Conflicto de sala');
    });

    it('debe manejar errores de validación de campos', () => {
      const data = { username: ['Usuario requerido'] };
      const result = ApiErrorHandler.handleValidationError(data);
      expect(result).toContain('Usuario requerido');
    });
  });

  describe('handleAuthError', () => {
    it('debe manejar token inválido', () => {
      const data = { detail: 'Invalid token.' };
      const result = ApiErrorHandler.handleAuthError(data);
      expect(result).toContain('sesión ha expirado');
    });

    it('debe manejar credenciales no proporcionadas', () => {
      const data = { detail: 'Authentication credentials were not provided.' };
      const result = ApiErrorHandler.handleAuthError(data);
      expect(result).toContain('Debes iniciar sesión');
    });

    it('debe manejar errores de usuario', () => {
      const data = { username: 'Usuario no encontrado' };
      const result = ApiErrorHandler.handleAuthError(data);
      expect(result).toContain('Usuario no encontrado');
    });

    it('debe manejar errores de contraseña', () => {
      const data = { password: 'Contraseña incorrecta' };
      const result = ApiErrorHandler.handleAuthError(data);
      expect(result).toContain('Contraseña incorrecta');
    });
  });

  describe('handleBusinessError', () => {
    it('debe manejar errores de negocio específicos', () => {
      const data = { error: 'Sin turno asignado' };
      const result = ApiErrorHandler.handleBusinessError(data);
      expect(result).toContain('No tienes un turno asignado');
    });

    it('debe manejar errores de entrada activa', () => {
      const data = { error: 'entrada activa' };
      const result = ApiErrorHandler.handleBusinessError(data);
      expect(result).toContain('Ya tienes una entrada activa');
    });

    it('debe manejar errores de monitor asignado', () => {
      const data = { error: 'monitor asignado' };
      const result = ApiErrorHandler.handleBusinessError(data);
      expect(result).toContain('La sala ya tiene un monitor asignado');
    });
  });

  describe('shouldLogout', () => {
    it('debe retornar true para errores 401', () => {
      const error = {
        response: {
          status: 401
        }
      };
      const result = ApiErrorHandler.shouldLogout(error);
      expect(result).toBe(true);
    });

    it('debe retornar true para mensajes de sesión expirada', () => {
      const error = {
        message: 'Tu sesión ha expirado'
      };
      const result = ApiErrorHandler.shouldLogout(error);
      expect(result).toBe(true);
    });

    it('debe retornar false para otros errores', () => {
      const error = {
        response: {
          status: 400
        }
      };
      const result = ApiErrorHandler.shouldLogout(error);
      expect(result).toBe(false);
    });
  });
});
