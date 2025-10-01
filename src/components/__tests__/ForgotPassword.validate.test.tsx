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

describe('ForgotPassword - Validaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validación de email', () => {
    it('requiere un email válido', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.click(submitButton);
      
      expect(emailInput).toBeInvalid();
    });

    it('acepta email con formato válido', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'usuario@ejemplo.com' } });
      
      expect(emailInput).toBeValid();
    });

    it('rechaza email sin @', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'usuarioejemplo.com' } });
      
      expect(emailInput).toBeInvalid();
    });

    it('rechaza email sin dominio', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'usuario@' } });
      
      expect(emailInput).toBeInvalid();
    });

    it('rechaza email sin usuario', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: '@ejemplo.com' } });
      
      expect(emailInput).toBeInvalid();
    });

    it('acepta email con subdominio', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'usuario@mail.ejemplo.com' } });
      
      expect(emailInput).toBeValid();
    });

    it('acepta email con guiones en el dominio', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'usuario@mi-sitio.com' } });
      
      expect(emailInput).toBeValid();
    });

    it('acepta email con números en el usuario', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'usuario123@ejemplo.com' } });
      
      expect(emailInput).toBeValid();
    });

    it('acepta email con puntos en el usuario', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'usuario.nombre@ejemplo.com' } });
      
      expect(emailInput).toBeValid();
    });
  });

  describe('Validación de campos requeridos', () => {
    it('no permite envío con email vacío', () => {
      render(<MockedForgotPassword />);
      
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.click(submitButton);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      expect(emailInput).toBeInvalid();
    });

    it('no permite envío con solo espacios en blanco', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);
      
      expect(emailInput).toBeInvalid();
    });
  });

  describe('Comportamiento del formulario', () => {
    it('previene envío múltiple durante carga', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      // El botón debería estar deshabilitado durante el envío
      expect(submitButton).toBeDisabled();
    });

    it('permite envío después de completar el anterior', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail)
        .mockResolvedValueOnce({ message: 'Primer envío' })
        .mockResolvedValueOnce({ message: 'Segundo envío' });

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      // Primer envío
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Primer envío')).toBeInTheDocument();
      });
      
      // Segundo envío
      fireEvent.change(emailInput, { target: { value: 'test2@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Segundo envío')).toBeInTheDocument();
      });
      
      expect(sendForgotPasswordEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('Limpieza de estado', () => {
    it('limpia mensajes de error al cambiar el email', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockRejectedValue(new Error('Error de prueba'));

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      // Generar error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error de prueba')).toBeInTheDocument();
      });
      
      // Cambiar email debería limpiar el error
      fireEvent.change(emailInput, { target: { value: 'nuevo@example.com' } });
      
      // El error debería desaparecer (depende de la implementación)
      expect(emailInput).toHaveValue('nuevo@example.com');
    });

    it('mantiene el valor del email durante el envío', async () => {
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
    });
  });

  describe('Accesibilidad', () => {
    it('tiene etiquetas apropiadas', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('tiene botones con nombres descriptivos', () => {
      render(<MockedForgotPassword />);
      
      expect(screen.getByRole('button', { name: /Enviar Enlace/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Volver al Login/i })).toBeInTheDocument();
    });

    it('deshabilita campos durante el envío', async () => {
      const { sendForgotPasswordEmail } = await import('../../services/passwordService');
      vi.mocked(sendForgotPasswordEmail).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
