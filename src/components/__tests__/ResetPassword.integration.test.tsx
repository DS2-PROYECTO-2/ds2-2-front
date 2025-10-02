import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ResetPassword from '../layout/ResetPassword';
// Mock del servicio
vi.mock('../../services/passwordService', () => ({
  validateResetToken: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

import * as passwordService from '../../services/passwordService';

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

const MockedResetPassword = () => (
  <BrowserRouter>
    <ResetPassword />
  </BrowserRouter>
);

describe('ResetPassword - Integración con API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar parámetros de búsqueda
    mockSearchParams.delete('token');
  });

  it('valida token exitosamente y muestra información del usuario', async () => {
    mockSearchParams.set('token', 'valid-token');
    
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User'
    };

    vi.mocked(passwordService.validateResetToken).mockResolvedValue({
      success: true,
      data: { user: mockUser }
    });

    render(<MockedResetPassword />);

    await waitFor(() => {
      expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Restablecer contraseña para:')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('maneja error de token inválido', async () => {
    mockSearchParams.set('token', 'invalid-token');
    
    vi.mocked(passwordService.validateResetToken).mockResolvedValue({
      success: false,
      error: 'Token inválido o expirado'
    });

    render(<MockedResetPassword />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Token inválido o expirado')).toBeInTheDocument();
    });
  });

  it('confirma cambio de contraseña exitosamente', async () => {
    mockSearchParams.set('token', 'valid-token');
    
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    vi.mocked(passwordService.validateResetToken).mockResolvedValue({
      success: true,
      data: { user: mockUser }
    });

    vi.mocked(passwordService.confirmPasswordReset).mockResolvedValue({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

    render(<MockedResetPassword />);

    await waitFor(() => {
      expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
    const submitButton = screen.getByRole('button', { name: /actualizar contraseña/i });

    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('¡Contraseña actualizada!')).toBeInTheDocument();
      expect(screen.getByText('Tu contraseña ha sido cambiada exitosamente.')).toBeInTheDocument();
    });
  });

  it('maneja error al confirmar contraseña', async () => {
    mockSearchParams.set('token', 'valid-token');
    
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    vi.mocked(passwordService.validateResetToken).mockResolvedValue({
      success: true,
      data: { user: mockUser }
    });

    vi.mocked(passwordService.confirmPasswordReset).mockResolvedValue({
      success: false,
      error: 'Error al actualizar la contraseña'
    });

    render(<MockedResetPassword />);

    await waitFor(() => {
      expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
    const submitButton = screen.getByRole('button', { name: /actualizar contraseña/i });

    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error al actualizar la contraseña')).toBeInTheDocument();
    });
  });

  it('valida que las contraseñas coincidan', async () => {
    mockSearchParams.set('token', 'valid-token');
    
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    vi.mocked(passwordService.validateResetToken).mockResolvedValue({
      success: true,
      data: { user: mockUser }
    });

    // Mock para simular error de contraseñas que no coinciden
    vi.mocked(passwordService.confirmPasswordReset).mockResolvedValue({
      success: false,
      error: 'Las contraseñas no coinciden'
    });

    render(<MockedResetPassword />);

    await waitFor(() => {
      expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
    const submitButton = screen.getByRole('button', { name: /actualizar contraseña/i });

    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword456!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });
  });
});
