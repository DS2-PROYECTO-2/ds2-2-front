import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../styles/ResetPassword.css';
import { validateResetToken, confirmPasswordReset } from '../../services/passwordService';
import BackgroundRainParticles from '../BackgroundRainParticles';

interface User {
  username: string;
  email: string;
  full_name?: string;
}

interface PasswordRequirements {
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumbers: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

// Función para validar estructura de contraseña
const validatePasswordStructure = (password: string): PasswordRequirements => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  };
};

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChar: false,
    isValid: false
  });

  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token no proporcionado');
        setIsValidating(false);
        return;
      }

      try {
        const result = await validateResetToken(token);
        
        if (result.success && result.data) {
          setUser(result.data.user);
        } else {
          setError(result.error || 'Token inválido o expirado');
        }
      } catch (error) {
        setError('Error de conexión. Inténtalo de nuevo.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordRequirements(validatePasswordStructure(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!passwordRequirements.isValid) {
      setError('La contraseña debe cumplir con todos los requisitos');
      setIsLoading(false);
      return;
    }

    try {
      const result = await confirmPasswordReset(token!, password, confirmPassword);

      if (result.success) {
        setSuccess(true);
        setMessage('Contraseña actualizada correctamente');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        // Mostrar el error específico del backend
        const errorMessage = result.error || result.message || 'Error al actualizar la contraseña';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error completo:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="reset-password-container">
        <BackgroundRainParticles density={110} speed={0.9} />
        <div className="reset-password-form">
          <div className="loading-state">
            <h2>Validando token...</h2>
            <p>Por favor espera...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="reset-password-container">
        <BackgroundRainParticles density={110} speed={0.9} />
        <div className="reset-password-form">
          <div className="error-state">
            <h2>Error</h2>
            <p>{error}</p>
            <button 
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="link-button"
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <BackgroundRainParticles density={110} speed={0.9} />
        <div className="reset-password-form">
          <div className="success-state">
            <h2>¡Contraseña actualizada!</h2>
            <p>Tu contraseña ha sido cambiada exitosamente.</p>
            <p>Serás redirigido al login en unos segundos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <BackgroundRainParticles density={110} speed={0.9} />
      <div className="reset-password-form">
        <h2>Restablecer Contraseña</h2>
        
        {user && (
          <div className="user-info">
            <h3>Restablecer contraseña para:</h3>
            <p><strong>Usuario:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {user.full_name && <p><strong>Nombre:</strong> {user.full_name}</p>}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={isLoading}
            />
            
            {/* Indicadores de validación de contraseña */}
            <div className="password-requirements">
              <div className={`requirement ${passwordRequirements.hasUpperCase ? 'valid' : 'invalid'}`}>
                <span className="requirement-icon">
                  {passwordRequirements.hasUpperCase ? '✓' : '✗'}
                </span>
                Al menos una letra mayúscula
              </div>
              <div className={`requirement ${passwordRequirements.hasLowerCase ? 'valid' : 'invalid'}`}>
                <span className="requirement-icon">
                  {passwordRequirements.hasLowerCase ? '✓' : '✗'}
                </span>
                Al menos una letra minúscula
              </div>
              <div className={`requirement ${passwordRequirements.hasNumbers ? 'valid' : 'invalid'}`}>
                <span className="requirement-icon">
                  {passwordRequirements.hasNumbers ? '✓' : '✗'}
                </span>
                Al menos un número
              </div>
              <div className={`requirement ${passwordRequirements.hasSpecialChar ? 'valid' : 'invalid'}`}>
                <span className="requirement-icon">
                  {passwordRequirements.hasSpecialChar ? '✓' : '✗'}
                </span>
                Al menos un carácter especial
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {confirmPassword && password === confirmPassword && password && (
              <div className="password-match">
                ✓ Las contraseñas coinciden
              </div>
            )}
          </div>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>

        <div className="form-links">
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            className="link-button"
          >
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;