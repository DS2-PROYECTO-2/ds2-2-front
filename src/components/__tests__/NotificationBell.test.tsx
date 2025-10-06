import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import NotificationBell from '../notifications/NotificationBell';
// useAuth is mocked globally
import { vi } from 'vitest';

// Mock del servicio de notificaciones
vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue([
      {
        id: 1,
        type: 'hours_exceeded',
        title: 'Monitor excedió 8 horas',
        message: 'Juan Pérez ha excedido las 8 horas',
        created_at: '2024-01-01T10:00:00Z',
        is_read: false
      }
    ]),
    markAsRead: vi.fn().mockResolvedValue({}),
    getUnreadCount: vi.fn().mockResolvedValue(1)
  }
}));

// Mock de useAuth
const mockUser = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin',
  is_verified: true
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', is_verified: true },
    token: 'token',
    isLoading: false,
    isHydrated: true,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
    setAuth: vi.fn()
  }))
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el componente para usuarios admin', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationBell />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    })
  });

  it('también renderiza para monitores (no admin)', async () => {
    // Mock useAuth para retornar un monitor
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { ...mockUser, role: 'monitor' },
      token: 'token',
      isLoading: false,
      isHydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      setAuth: vi.fn()
    });

    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationBell />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    })
  });

  it('muestra el contador de notificaciones no leídas', async () => {
    // Asegurar que el mock retorne un admin
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', is_verified: true },
      token: 'token',
      isLoading: false,
      isHydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      setAuth: vi.fn()
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationBell />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('abre el dropdown al hacer clic', async () => {
    // Asegurar que el mock retorne un admin
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', is_verified: true },
      token: 'token',
      isLoading: false,
      isHydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      setAuth: vi.fn()
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationBell />
        </AuthProvider>
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    });
  });
});
