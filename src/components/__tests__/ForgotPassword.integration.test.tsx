import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ForgotPassword from '../layout/ForgotPassword';

// Mock del servicio
vi.mock('../../services/passwordService', () => ({
  sendForgotPasswordEmail: vi.fn()
}));

import * as passwordService from '../../services/passwordService';

const MockedForgotPassword = () => (
  <BrowserRouter>
    <ForgotPassword />
  </BrowserRouter>
);

describe('ForgotPassword - Integración con API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Envío exitoso', () => {
    it('envía email correctamente a la API', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu correo electrónico.'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(passwordService.sendForgotPasswordEmail).toHaveBeenCalledWith({
          email: 'test@example.com'
        });
      });
    });

    it('muestra mensaje de éxito tras envío exitoso', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        success: true,
        message: 'Enlace de recuperación enviado exitosamente'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Enlace de recuperación enviado exitosamente')).toBeInTheDocument();
      });
    });
  });

  describe('Manejo de errores de API', () => {
    it('maneja error 400 - Email no encontrado', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        success: false,
        error: 'No existe una cuenta con este correo electrónico'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'noexiste@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('No existe una cuenta con este correo electrónico')).toBeInTheDocument();
      });
    });

    it('maneja error 429 - Demasiados intentos', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        success: false,
        error: 'Demasiados intentos. Inténtalo más tarde'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Demasiados intentos. Inténtalo más tarde')).toBeInTheDocument();
      });
    });

    it('maneja error 500 - Error del servidor', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        success: false,
        error: 'Error interno del servidor'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error interno del servidor')).toBeInTheDocument();
      });
    });
  });

  describe('Manejo de errores de red', () => {
    it('maneja error de conexión', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockRejectedValue(new Error('Network error'));

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('maneja respuesta inválida de la API', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        ok: true,
        json: async () => 'Invalid JSON response'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      // Verificar que se hizo la llamada a la API
      await waitFor(() => {
        expect(passwordService.sendForgotPasswordEmail).toHaveBeenCalledWith({
          email: 'test@example.com'
        });
      });
    });
  });

  describe('Estados de carga', () => {
    it('muestra estado de carga durante el envío', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });

    it('restaura estado normal tras completar envío', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        success: true,
        message: 'Email enviado exitosamente'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email enviado exitosamente')).toBeInTheDocument();
      });
      
      expect(submitButton).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
    });
  });

  describe('Validación de datos enviados', () => {
    it('envía el email correcto a la API', async () => {
      vi.mocked(passwordService.sendForgotPasswordEmail).mockResolvedValue({
        success: true,
        message: 'Success'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'usuario@ejemplo.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(passwordService.sendForgotPasswordEmail).toHaveBeenCalledWith({
          email: 'usuario@ejemplo.com'
        });
      });
    });

    it('no envía datos vacíos', async () => {
      render(<MockedForgotPassword />);
      
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      fireEvent.click(submitButton);
      
      // El formulario no debería enviarse si el email está vacío
      expect(passwordService.sendForgotPasswordEmail).not.toHaveBeenCalled();
    });
  });
});
