import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import UserManagement from '../layout/UserManagement';

import { vi } from 'vitest';

// Mock del servicio
vi.mock('../../services/userManagementService', () => ({
  __esModule: true,
  default: {
    getUsers: vi.fn().mockResolvedValue([]),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

// Mock de useAuth
const mockUser = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  full_name: 'Admin User',
  role: 'admin' as const,
  is_active: true,
  is_verified: true,
  date_joined: '2024-01-01',
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
  }),
}));

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el componente de gestión de usuarios', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <UserManagement />
          </AuthProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Administra usuarios, roles y permisos del sistema')).toBeInTheDocument();
  });

  it('muestra el botón de crear usuario para administradores', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <UserManagement />
          </AuthProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument();
  });

  it('renderiza los filtros de búsqueda', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <UserManagement />
          </AuthProvider>
        </BrowserRouter>
      );
    });

    // Esperar a que se complete la carga
    await act(async () => {
      // Esperar a que desaparezca el estado de carga
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByPlaceholderText('Buscar por nombre, email o cédula...')).toBeInTheDocument();
    expect(screen.getAllByText('Limpiar Filtros')).toHaveLength(2);
  });

  it('permite cambiar los filtros de búsqueda', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <UserManagement />
          </AuthProvider>
        </BrowserRouter>
      );
    });

    const searchInput = screen.getByPlaceholderText('Buscar por nombre, email o cédula...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test user' } });
    });
    
    expect(searchInput).toHaveValue('test user');
  });

  it('muestra el botón de crear usuario', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <UserManagement />
          </AuthProvider>
        </BrowserRouter>
      );
    });

    const createButton = screen.getByText('Nuevo Usuario');
    expect(createButton).toBeInTheDocument();
  });
});
