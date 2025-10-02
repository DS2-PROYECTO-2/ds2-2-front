import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminApproval from '../layout/AdminApproval';

// Mock de react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

// Mock de BackgroundRainParticles
vi.mock('../BackgroundRainParticles', () => ({
  default: () => <div data-testid="background-particles" />
}));

const MockedAdminApproval = () => (
  <BrowserRouter>
    <AdminApproval />
  </BrowserRouter>
);

describe('AdminApproval - Tests Básicos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar parámetros de búsqueda
    mockSearchParams.delete('action');
    mockSearchParams.delete('user');
    mockSearchParams.delete('error');
  });

  it('renderiza el componente correctamente', () => {
    mockSearchParams.set('action', 'approved');
    mockSearchParams.set('user', 'testuser');
    
    render(<MockedAdminApproval />);
    
    expect(screen.getByTestId('background-particles')).toBeInTheDocument();
  });

  it('muestra estado de carga inicialmente', () => {
    render(<MockedAdminApproval />);
    
    expect(screen.getByText('Procesando acción...')).toBeInTheDocument();
  });

  it('muestra mensaje de aprobación exitosa', async () => {
    mockSearchParams.set('action', 'approved');
    mockSearchParams.set('user', 'testuser');
    
    render(<MockedAdminApproval />);
    
    await waitFor(() => {
      expect(screen.getByText('Usuario Aprobado')).toBeInTheDocument();
      expect(screen.getByText('El usuario @testuser ha sido verificado exitosamente.')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('muestra mensaje de rechazo exitoso', async () => {
    mockSearchParams.set('action', 'rejected');
    mockSearchParams.set('user', 'testuser');
    
    render(<MockedAdminApproval />);
    
    await waitFor(() => {
      expect(screen.getByText('Usuario Rechazado')).toBeInTheDocument();
      expect(screen.getByText('El usuario @testuser ha sido eliminado del sistema.')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('muestra error de token expirado', async () => {
    mockSearchParams.set('error', 'expired');
    
    render(<MockedAdminApproval />);
    
    await waitFor(() => {
      expect(screen.getByText('Enlace expirado')).toBeInTheDocument();
      expect(screen.getByText('Este enlace ha expirado. Los enlaces son válidos por 24 horas.')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('muestra error de token inválido', async () => {
    mockSearchParams.set('error', 'invalid_token');
    
    render(<MockedAdminApproval />);
    
    await waitFor(() => {
      expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
      expect(screen.getByText('El enlace no es válido o ha sido modificado.')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('muestra botones de navegación', async () => {
    mockSearchParams.set('action', 'approved');
    mockSearchParams.set('user', 'testuser');
    
    render(<MockedAdminApproval />);
    
    await waitFor(() => {
      expect(screen.getByText('Ir al Panel de Administración')).toBeInTheDocument();
      expect(screen.getByText('Ir al Login')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
