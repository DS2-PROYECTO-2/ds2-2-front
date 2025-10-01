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

describe('ForgotPassword - Todos los Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado y UI', () => {
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

    it('deshabilita el botón durante el envío', () => {
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
  });

  describe('Estados del formulario', () => {
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

    it('deshabilita campos durante el envío', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
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
});
