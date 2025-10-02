import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('ResetPassword', () => {
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
    
    render(<MockedResetPassword />);
    
    expect(screen.getByText('Validando token...')).toBeInTheDocument();
  });

  it('permite al usuario volver al login', async () => {
    mockSearchParams.set('token', 'test-token');
    
    // Mock del servicio para que funcione correctamente
    vi.mocked(passwordService.validateResetToken).mockResolvedValue({
      success: true,
      data: { user: { username: 'test', email: 'test@test.com' } }
    });
    
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      const backButton = screen.getByText('Volver al Login');
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('permite solicitar nuevo enlace cuando hay error', async () => {
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      const newLinkButton = screen.getByText('Solicitar nuevo enlace');
      fireEvent.click(newLinkButton);
      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
  });
});
