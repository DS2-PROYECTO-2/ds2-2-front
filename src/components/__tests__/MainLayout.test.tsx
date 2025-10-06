import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import MainLayout from '../layout/MainLayout';
// useAuth is mocked globally
import { vi } from 'vitest';

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
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true
  }))
}));

// Mock de LeftSidebar
vi.mock('../layout/LeftSidebar', () => ({
  default: ({ onNavigate, activeSection }: { onNavigate: (section: string) => void; activeSection: string }) => (
    <div data-testid="left-sidebar">
      <button onClick={() => onNavigate('inventory')}>Navigate to Inventory</button>
      <span data-testid="active-section">{activeSection}</span>
    </div>
  )
}));

// Mock de componentes de salas
vi.mock('../rooms/RoomPanel', () => ({
  default: () => <div data-testid="room-panel">RoomPanel</div>
}));

vi.mock('../rooms/RoomHistory', () => ({
  default: () => <div data-testid="room-history">RoomHistory</div>
}));

vi.mock('../rooms/RoomStatsRow', () => ({
  default: () => <div data-testid="room-stats">RoomStatsRow</div>
}));

describe('MainLayout', () => {
  it('renderiza el layout con children', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout>
            <div data-testid="children">Test Children</div>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
    // El children se renderiza en la sección por defecto (home)
    expect(screen.getByTestId('room-history')).toBeInTheDocument();
  });

  it('muestra la sección home por defecto', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout>
            <div data-testid="children">Test Children</div>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('room-history')).toBeInTheDocument();
  });

  it('cambia de sección cuando se navega', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout>
            <div data-testid="children">Test Children</div>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    const navigateButton = screen.getByText('Navigate to Inventory');
    fireEvent.click(navigateButton);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
  });

  it('muestra estadísticas para monitores', async () => {
    // Mock useAuth para retornar un monitor
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
      user: { ...mockUser, role: 'monitor' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout>
            <div data-testid="children">Test Children</div>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('room-stats')).toBeInTheDocument();
    expect(screen.getByTestId('room-panel')).toBeInTheDocument();
  });
});
