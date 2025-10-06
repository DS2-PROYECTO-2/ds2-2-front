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
  role: 'admin'
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true
  }))
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el componente para usuarios admin', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationBell />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('no renderiza para usuarios no admin', async () => {
    // Mock useAuth para retornar un monitor
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
      user: { ...mockUser, role: 'monitor' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true
    });

    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationBell />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('muestra el contador de notificaciones no leídas', async () => {
    // Asegurar que el mock retorne un admin
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true
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
    (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true
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
