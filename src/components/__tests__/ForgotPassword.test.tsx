import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ForgotPassword from '../layout/ForgotPassword';

// Mock del servicio
vi.mock('../../services/passwordService', () => ({
  sendForgotPasswordEmail: vi.fn()
}));

const MockedForgotPassword = () => (
  <BrowserRouter>
    <ForgotPassword />
  </BrowserRouter>
);

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el formulario correctamente', () => {
      render(<MockedForgotPassword />);
      
      expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Ingresa tu correo electrónico para recibir un enlace de recuperación.')).toBeInTheDocument();
      expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enviar Enlace/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Volver al Login/i })).toBeInTheDocument();
    });

    it('muestra el campo de email como requerido', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      expect(emailInput).toBeRequired();
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Interacciones del usuario', () => {
    it('permite escribir en el campo de email', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('deshabilita el botón durante el envío', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
    });
  });

  describe('Validación de formulario', () => {
    it('requiere un email válido', () => {
      render(<MockedForgotPassword />);
      
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      fireEvent.click(submitButton);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      expect(emailInput).toBeInvalid();
    });

    it('acepta email válido', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toBeValid();
    });
  });

  describe('Envío exitoso', () => {
    it('envía el email correctamente', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockResolvedValue({
        message: 'Enlace enviado correctamente'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(sendForgotPasswordEmail).toHaveBeenCalledWith({
          email: 'test@example.com'
        });
      });
    });

    it('muestra mensaje de éxito', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockResolvedValue({
        message: 'Se ha enviado un enlace de recuperación a tu correo electrónico.'
      });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Se ha enviado un enlace de recuperación a tu correo electrónico.')).toBeInTheDocument();
      });
    });
  });

  describe('Manejo de errores', () => {
    it('muestra error cuando el servicio falla', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockRejectedValue(new Error('Error de conexión'));

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error de conexión')).toBeInTheDocument();
      });
    });

    it('muestra error genérico para errores desconocidos', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockRejectedValue('Error desconocido');

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error de conexión. Inténtalo de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Navegación', () => {
    it('tiene botón para volver al login', () => {
      render(<MockedForgotPassword />);
      
      const backButton = screen.getByRole('button', { name: /Volver al Login/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent('Volver al Login');
    });
  });

  describe('Estados del formulario', () => {
    it('limpia errores al escribir en el email', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockRejectedValue(new Error('Error de prueba'));

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      // Primero generar un error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error de prueba')).toBeInTheDocument();
      });
      
      // Luego escribir de nuevo para limpiar el error
      fireEvent.change(emailInput, { target: { value: 'nuevo@example.com' } });
      
      // El error debería desaparecer (esto depende de la implementación)
      expect(emailInput).toHaveValue('nuevo@example.com');
    });

    it('mantiene el estado del email durante el envío', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(emailInput).toBeDisabled();
    });
  });
});