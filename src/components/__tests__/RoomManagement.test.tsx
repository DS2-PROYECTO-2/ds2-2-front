import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import RoomManagement from '../rooms/RoomManagement';
import { vi } from 'vitest';

// Mock del servicio
vi.mock('../../services/roomService', () => ({
  getRooms: vi.fn(),
  getRoomDetails: vi.fn(),
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

describe('RoomManagement', () => {
  it('renderiza el componente de gestión de salas', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RoomManagement />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
  });
});
