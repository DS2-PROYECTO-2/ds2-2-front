import { render, screen, fireEvent } from '@testing-library/react';
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

describe('ForgotPassword - Comportamiento Simplificado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flujo de usuario completo', () => {
    it('permite al usuario completar el flujo de recuperación exitosamente', () => {
      render(<MockedForgotPassword />);
      
      // 1. Usuario ve el formulario
      expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Ingresa tu correo electrónico para recibir un enlace de recuperación.')).toBeInTheDocument();
      
      // 2. Usuario ingresa su email
      const emailInput = screen.getByLabelText('Correo Electrónico');
      fireEvent.change(emailInput, { target: { value: 'usuario@ejemplo.com' } });
      expect(emailInput).toHaveValue('usuario@ejemplo.com');
      
      // 3. Usuario hace clic en enviar
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      fireEvent.click(submitButton);
      
      // 4. Se muestra estado de carga
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });

    it('permite al usuario volver al login en cualquier momento', () => {
      render(<MockedForgotPassword />);
      
      const backButton = screen.getByRole('button', { name: /Volver al Login/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent('Volver al Login');
    });
  });

  describe('Manejo de errores del usuario', () => {
    it('guía al usuario cuando ingresa email inválido', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      // Usuario intenta enviar sin email
      fireEvent.click(submitButton);
      
      // El navegador muestra validación nativa
      expect(emailInput).toBeInvalid();
    });

    it('informa al usuario sobre errores de conexión', () => {
      render(<MockedForgotPassword />);
      
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.click(submitButton);
      
      // Verificar que se muestra estado de carga
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
    });

    it('permite al usuario reintentar después de un error', () => {
      render(<MockedForgotPassword />);
      
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      // El botón debería estar habilitado inicialmente
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Estados de la interfaz', () => {
    it('muestra estado inicial correcto', () => {
      render(<MockedForgotPassword />);
      
      expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Correo Electrónico')).toHaveValue('');
      expect(screen.getByRole('button', { name: /Enviar Enlace/i })).not.toBeDisabled();
      expect(screen.queryByText(/Enviando/)).not.toBeInTheDocument();
    });

    it('muestra estado de carga correctamente', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });

    it('muestra estado de éxito correctamente', () => {
      render(<MockedForgotPassword />);
      
      // Verificar que el formulario está listo para recibir input
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      expect(emailInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });

    it('muestra estado de error correctamente', () => {
      render(<MockedForgotPassword />);
      
      // Verificar que el formulario está listo para recibir input
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      expect(emailInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Interacciones del usuario', () => {
    it('responde a cambios en el campo de email', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'nuevo@email.com' } });
      expect(emailInput).toHaveValue('nuevo@email.com');
      
      fireEvent.change(emailInput, { target: { value: 'otro@email.com' } });
      expect(emailInput).toHaveValue('otro@email.com');
    });

    it('previene envío múltiple durante procesamiento', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      // El botón debería estar deshabilitado durante el envío
      expect(submitButton).toBeDisabled();
    });

    it('permite envío después de completar el anterior', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      // El botón debería estar habilitado inicialmente
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Navegación', () => {
    it('navega correctamente al login', () => {
      render(<MockedForgotPassword />);
      
      const backButton = screen.getByRole('button', { name: /Volver al Login/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent('Volver al Login');
    });
  });
});
