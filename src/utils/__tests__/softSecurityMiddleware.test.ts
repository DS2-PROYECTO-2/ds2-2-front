import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  softSecureApiCall, 
  softAdminOnly, 
  softAuthenticatedOnly 
} from '../softSecurityMiddleware';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock validateToken
vi.mock('../tokenUtils', () => ({
  validateToken: vi.fn()
}));

describe('softSecurityMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('softSecureApiCall', () => {
    it('debería fallar cuando no hay token', async () => {
      const mockApiCall = vi.fn();
      
      localStorageMock.getItem.mockReturnValue(null);

      await expect(softSecureApiCall(mockApiCall, 'admin', 'test action'))
        .rejects.toThrow('No autorizado: Token no encontrado');
      
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it('debería fallar con token inválido', async () => {
      const mockApiCall = vi.fn();
      const mockToken = 'invalid-token';
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const { validateToken } = await import('../tokenUtils');
      vi.mocked(validateToken).mockReturnValue({
        isValid: false,
        error: 'Token inválido'
      });

      await expect(softSecureApiCall(mockApiCall, 'admin', 'test action'))
        .rejects.toThrow('No autorizado: Token inválido');
      
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it('debería fallar con rol incorrecto', async () => {
      const mockApiCall = vi.fn();
      const mockToken = 'valid-token';
      const mockPayload = { user_id: 1, username: 'test', role: 'monitor', exp: 1234567890, iat: 1234567890 };
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const { validateToken } = await import('../tokenUtils');
      vi.mocked(validateToken).mockReturnValue({
        isValid: true,
        payload: mockPayload
      });

      await expect(softSecureApiCall(mockApiCall, 'admin', 'test action'))
        .rejects.toThrow('No autorizado: Se requiere rol admin para test action. Rol actual: monitor');
      
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it('debería permitir cualquier rol cuando se especifica "any"', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'success' });
      const mockToken = 'valid-token';
      const mockPayload = { user_id: 1, username: 'test', role: 'monitor', exp: 1234567890, iat: 1234567890 };
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const { validateToken } = await import('../tokenUtils');
      vi.mocked(validateToken).mockReturnValue({
        isValid: true,
        payload: mockPayload
      });

      const result = await softSecureApiCall(mockApiCall, 'any', 'test action');

      expect(result).toEqual({ data: 'success' });
      expect(mockApiCall).toHaveBeenCalled();
    });
  });

  describe('softAdminOnly', () => {
    it('debería ser una función', () => {
      expect(typeof softAdminOnly).toBe('function');
    });
  });

  describe('softAuthenticatedOnly', () => {
    it('debería ser una función', () => {
      expect(typeof softAuthenticatedOnly).toBe('function');
    });
  });
});
