import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import LeftSidebar from '../layout/LeftSidebar';
import { vi } from 'vitest';

// Mock de useAuth
const mockUser = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin'
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn()
  })
}));

// Mock de NotificationBell
vi.mock('../notifications/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">NotificationBell</div>
}));

describe('LeftSidebar', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el logo y el texto', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LeftSidebar onNavigate={mockOnNavigate} activeSection="home" />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Salas EISC')).toBeInTheDocument();
    expect(screen.getByAltText('Monitores EISC')).toBeInTheDocument();
  });

  it('renderiza todos los botones de navegación', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LeftSidebar onNavigate={mockOnNavigate} activeSection="home" />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTitle('Inicio')).toBeInTheDocument();
    expect(screen.getByTitle('Inventario')).toBeInTheDocument();
    expect(screen.getByTitle('Reportes')).toBeInTheDocument();
    expect(screen.getByTitle('Configuración')).toBeInTheDocument();
  });

  it('marca el botón activo correctamente', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LeftSidebar onNavigate={mockOnNavigate} activeSection="inventory" />
        </AuthProvider>
      </BrowserRouter>
    );

    const inventoryButton = screen.getByTitle('Inventario');
    expect(inventoryButton).toHaveClass('active');
  });

  it('llama a onNavigate cuando se hace clic en un botón', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LeftSidebar onNavigate={mockOnNavigate} activeSection="home" />
        </AuthProvider>
      </BrowserRouter>
    );

    const inventoryButton = screen.getByTitle('Inventario');
    fireEvent.click(inventoryButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('inventory');
  });

  it('renderiza el botón de logout', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LeftSidebar onNavigate={mockOnNavigate} activeSection="home" />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTitle('Cerrar sesión')).toBeInTheDocument();
  });
});
