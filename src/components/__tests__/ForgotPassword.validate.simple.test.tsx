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

describe('ForgotPassword - Validaciones Simplificadas', () => {
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
    it('deshabilita el botón durante el envío', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      const submitButton = screen.getByRole('button', { name: /Enviar Enlace/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      // El botón debería estar deshabilitado durante el envío
      expect(submitButton).toBeDisabled();
    });

    it('permite escribir en el campo de email', () => {
      render(<MockedForgotPassword />);
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      
      fireEvent.change(emailInput, { target: { value: 'nuevo@email.com' } });
      expect(emailInput).toHaveValue('nuevo@email.com');
      
      fireEvent.change(emailInput, { target: { value: 'otro@email.com' } });
      expect(emailInput).toHaveValue('otro@email.com');
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
});
