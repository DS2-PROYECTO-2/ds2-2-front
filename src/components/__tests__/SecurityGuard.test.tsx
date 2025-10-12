import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SecurityGuard from '../auth/SecurityGuard';

// Mock del hook useAuth
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock de localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};

// Mock de atob para decodificar JWT
const mockAtob = vi.fn();

describe('SecurityGuard', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Setup atob mock
    Object.defineProperty(window, 'atob', {
      value: mockAtob,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Renderizado básico', () => {
    it('debería renderizar children cuando está autorizado', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard>
          <div data-testid="protected-content">Contenido protegido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('debería renderizar correctamente con usuario autorizado', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard>
          <div data-testid="protected-content">Contenido protegido</div>
        </SecurityGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('debería mostrar acceso denegado cuando no está autorizado', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <SecurityGuard>
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
        expect(screen.getByText('No tienes permisos para acceder a esta función.')).toBeInTheDocument();
      });
    });
  });

  describe('Verificación de usuario', () => {
    it('debería denegar acceso cuando no hay usuario', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <SecurityGuard>
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
      });
    });

    it('debería denegar acceso cuando el rol no coincide', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'monitor',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard requiredRole="admin">
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
      });
    });

    it('debería denegar acceso cuando el usuario no está verificado y se requiere verificación', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: false
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard requireVerified={true}>
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
      });
    });
  });

  describe('Verificación de token', () => {
    it('debería denegar acceso cuando no hay token', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <SecurityGuard>
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
      });
    });

    it('debería denegar acceso cuando el token es inválido', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('invalid.token');
      mockAtob.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      render(
        <SecurityGuard>
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
      });
    });

    it('debería denegar acceso cuando el token está expirado', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('expired.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) - 3600 }));

      render(
        <SecurityGuard>
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      });
    });

    it('debería denegar acceso cuando el user_id del token no coincide', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 2, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard>
          <div>Contenido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
      });
    });
  });

  describe('Casos de éxito', () => {
    it('debería permitir acceso con usuario autorizado sin restricciones', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard>
          <div data-testid="protected-content">Contenido protegido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('debería permitir acceso con todas las verificaciones pasadas', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard requiredRole="admin" requireVerified={true}>
          <div data-testid="protected-content">Contenido protegido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Props', () => {
    it('debería funcionar con requiredRole', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'monitor',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard requiredRole="monitor">
          <div data-testid="protected-content">Contenido protegido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('debería funcionar con requireVerified', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'admin',
        is_verified: true
      };

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockLocalStorage.getItem.mockReturnValue('valid.token.here');
      mockAtob.mockReturnValue(JSON.stringify({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

      render(
        <SecurityGuard requireVerified={true}>
          <div data-testid="protected-content">Contenido protegido</div>
        </SecurityGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });
});
