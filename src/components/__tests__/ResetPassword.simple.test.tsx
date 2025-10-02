import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ResetPassword from '../layout/ResetPassword';
import { validateResetToken } from '../../services/passwordService';

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

// Mock de BackgroundRainParticles
vi.mock('../BackgroundRainParticles', () => ({
  default: () => <div data-testid="background-particles" />
}));

const MockedResetPassword = () => (
  <BrowserRouter>
    <ResetPassword />
  </BrowserRouter>
);

describe('ResetPassword - Tests Simplificados', () => {
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
    // No configurar token para que falle la validación
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Token no proporcionado')).toBeInTheDocument();
    });
  });

  it('muestra estado de carga mientras valida el token', () => {
    mockSearchParams.set('token', 'test-token');
    
    // No configurar el mock para que se mantenga en estado de carga
    vi.mocked(validateResetToken).mockImplementation(() => new Promise(() => {}));
    
    render(<MockedResetPassword />);
    
    expect(screen.getByText('Validando token...')).toBeInTheDocument();
  });

  it('permite al usuario volver al login', async () => {
    mockSearchParams.set('token', 'test-token');
    
    // Configurar el mock para que devuelva un resultado exitoso
    vi.mocked(validateResetToken).mockResolvedValue({
      success: true,
      data: {
        user: {
          username: 'testuser',
          email: 'test@example.com',
          full_name: 'Test User'
        }
      }
    });
    
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      const backButton = screen.getByText('Volver al Login');
      expect(backButton).toBeInTheDocument();
    });
  });

  it('permite solicitar nuevo enlace cuando hay error', async () => {
    mockSearchParams.set('token', 'invalid-token');
    
    // Configurar el mock para que falle la validación
    vi.mocked(validateResetToken).mockResolvedValue({
      success: false,
      error: 'Token inválido o expirado'
    });
    
    render(<MockedResetPassword />);
    
    await waitFor(() => {
      const newLinkButton = screen.getByText('Solicitar nuevo enlace');
      expect(newLinkButton).toBeInTheDocument();
    });
  });
});
