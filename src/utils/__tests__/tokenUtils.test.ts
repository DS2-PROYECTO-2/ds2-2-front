import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateToken, 
  clearAuthData, 
  getTokenInfo, 
  forceLogout, 
  handleTokenError 
} from '../tokenUtils';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    return null // Default to null for all tests
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
});

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn()
});

describe('tokenUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.href
    window.location.href = '';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('validateToken', () => {
    it('debería retornar error para token vacío', () => {
      const result = validateToken('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token no encontrado');
    });

    it('debería retornar error para token con formato inválido', () => {
      const result = validateToken('invalid-token');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Token con formato inválido');
    });

    it('debería retornar error para token con partes faltantes', () => {
      const result = validateToken('header.payload');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Token con formato inválido');
    });

    it('debería validar token correctamente', () => {
      const payload = { user_id: 1, username: 'test', role: 'admin', exp: 1234567890, iat: 1234567890 };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(true);
      expect(result.payload).toEqual(payload);
    });

    it('debería retornar error para token con campos faltantes', () => {
      const payload = { username: 'test' }; // Falta user_id y role
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Campos faltantes en el token');
    });

    it('debería manejar error de decodificación', () => {
      const token = 'header.invalid-base64.signature';
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Error al decodificar token');
    });
  });

  describe('clearAuthData', () => {
    it('debería limpiar todos los datos de autenticación', () => {
      // Mock localStorage methods
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      
      clearAuthData();
      
      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(removeItemSpy).toHaveBeenCalledWith('user');
      expect(removeItemSpy).toHaveBeenCalledWith('token');
    });
  });

  describe('getTokenInfo', () => {
    it('debería retornar error cuando no hay token', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      
      const result = getTokenInfo();
      
      expect(result.present).toBe(false);
      expect(result.error).toBe('No hay token en localStorage');
    });

    it('debería retornar información del token válido', () => {
      const payload = { user_id: 1, username: 'test', role: 'admin', exp: 1234567890, iat: 1234567890 };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(token);
      
      const result = getTokenInfo();
      
      expect(result.present).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(payload);
      expect(result.tokenLength).toBe(token.length);
      expect(result.partsCount).toBe(3);
    });

    it('debería retornar error para token inválido', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-token');
      
      const result = getTokenInfo();
      
      expect(result.present).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('forceLogout', () => {
    it('debería limpiar datos y redirigir al login', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      
      forceLogout();
      
      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(removeItemSpy).toHaveBeenCalledWith('user');
      expect(removeItemSpy).toHaveBeenCalledWith('token');
      expect(window.location.href).toBe('/login');
    });
  });

  describe('handleTokenError', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debería manejar error de token corrupto', () => {
      const error = { message: 'Token con formato inválido' };
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      handleTokenError(error);
      
      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app-toast',
          detail: expect.objectContaining({
            type: 'error',
            message: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          })
        })
      );
      
      // Avanzar el timer
      vi.advanceTimersByTime(2000);
      expect(window.location.href).toBe('/login');
    });

    it('debería manejar error de token inválido', () => {
      const error = { message: 'Token inválido o corrupto' };
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      handleTokenError(error);
      
      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app-toast',
          detail: expect.objectContaining({
            type: 'error'
          })
        })
      );
    });

    it('debería manejar error de decodificación', () => {
      const error = { message: 'Error al decodificar' };
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      handleTokenError(error);
      
      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app-toast',
          detail: expect.objectContaining({
            type: 'error'
          })
        })
      );
    });

    it('debería manejar otros errores sin desloguear', () => {
      const error = { message: 'Problema de permisos' };
      
      handleTokenError(error);
      
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      // Solo verificar que no se desloguea
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('authToken');
    });

    it('debería manejar errores sin mensaje', () => {
      const error = { code: 'UNKNOWN_ERROR' };
      
      handleTokenError(error);
      
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app-toast',
          detail: expect.objectContaining({
            type: 'warning'
          })
        })
      );
    });
  });
});
