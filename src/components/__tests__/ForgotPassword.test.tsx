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
  it('renderiza el formulario correctamente', () => {
    render(<MockedForgotPassword />);
    
    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Enlace/i })).toBeInTheDocument();
  });

  it('envía el formulario con email válido', async () => {
    const { sendForgotPasswordEmail } = await import('../../services/passwordService');
    vi.mocked(sendForgotPasswordEmail).mockResolvedValue({
      message: 'Enlace enviado correctamente'
    });

    render(<MockedForgotPassword />);
    
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Enviar Enlace/i }));
    
    await waitFor(() => {
      expect(sendForgotPasswordEmail).toHaveBeenCalledWith({
        email: 'test@example.com'
      });
    });
  });
});