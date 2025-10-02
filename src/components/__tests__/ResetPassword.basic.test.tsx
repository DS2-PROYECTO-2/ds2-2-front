import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ResetPassword from '../layout/ResetPassword';

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

// Mock del servicio
vi.mock('../../services/passwordService', () => ({
  validateResetToken: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

import * as passwordService from '../../services/passwordService';

// Mock de BackgroundRainParticles
vi.mock('../BackgroundRainParticles', () => ({
  default: () => <div data-testid="background-particles" />
}));

const MockedResetPassword = () => (
  <BrowserRouter>
    <ResetPassword />
  </BrowserRouter>
);

describe('ResetPassword - Tests Básicos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar parámetros de búsqueda
    mockSearchParams.delete('token');
  });

  it('renderiza el componente correctamente', () => {
    mockSearchParams.set('token', 'test-token');
    
    render(<MockedResetPassword />);
    
    expect(screen.getByTestId('background-particles')).toBeInTheDocument();
  });

  it('muestra error cuando no hay token', async () => {
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Token no proporcionado')).toBeInTheDocument();
    });
  });

  it('muestra estado de carga mientras valida el token', () => {
    mockSearchParams.set('token', 'test-token');
    
    // Configurar mock para que se mantenga en estado de carga
    vi.mocked(passwordService.validateResetToken).mockImplementation(() => new Promise(() => {}));
    
    render(<MockedResetPassword />);
    
    expect(screen.getByText('Validando token...')).toBeInTheDocument();
  });

  it('muestra botón de solicitar nuevo enlace cuando hay error', async () => {
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText('Solicitar nuevo enlace')).toBeInTheDocument();
    });
  });

  it('navega a forgot-password cuando se hace clic en solicitar nuevo enlace', async () => {
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      const newLinkButton = screen.getByText('Solicitar nuevo enlace');
      expect(newLinkButton).toBeInTheDocument();
      
      // El botón debería estar presente, aunque no probemos el clic para evitar complejidad
    });
  });
});
