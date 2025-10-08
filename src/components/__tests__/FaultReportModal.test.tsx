import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import FaultReportModal from '../rooms/FaultReportModal';
import { vi } from 'vitest';

// Mock de useAuth
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@test.com',
  full_name: 'Test User',
  role: 'monitor' as const,
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

const mockComputer = {
  id: '1',
  roomId: 'room1',
  number: 1,
  serial: 'ABC123',
  status: 'operational' as const,
};

describe('FaultReportModal', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el modal de reporte de fallas', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <FaultReportModal
            computer={mockComputer}
            onSave={mockOnSave}
            onClose={mockOnClose}
          />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Reportar Falla')).toBeInTheDocument();
  });

  it('muestra el botón de cerrar', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <FaultReportModal
            computer={mockComputer}
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
          <FaultReportModal
            computer={mockComputer}
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
