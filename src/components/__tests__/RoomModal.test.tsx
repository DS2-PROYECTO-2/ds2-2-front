import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import RoomModal from '../rooms/RoomModal';
import { vi } from 'vitest';

// Mock de useAuth
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@test.com',
  full_name: 'Test User',
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

describe('RoomModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockRoom = {
    id: '1',
    name: 'Sala A',
    code: 'SA001',
    capacity: 20,
    description: 'Sala de sistemas',
    computers: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el modal de sala', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RoomModal
            room={mockRoom}
            onSave={mockOnSave}
            onClose={mockOnClose}
          />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Editar Sala')).toBeInTheDocument();
  });

  it('muestra el botón de cerrar', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RoomModal
            room={mockRoom}
            onSave={mockOnSave}
            onClose={mockOnClose}
          />
        </AuthProvider>
      </BrowserRouter>
    );

    const closeButton = screen.getByText('Cancelar');
    expect(closeButton).toBeInTheDocument();
  });

  it('llama a onClose cuando se hace clic en cancelar', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RoomModal
            room={mockRoom}
            onSave={mockOnSave}
            onClose={mockOnClose}
          />
        </AuthProvider>
      </BrowserRouter>
    );

    const closeButton = screen.getByText('Cancelar');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
