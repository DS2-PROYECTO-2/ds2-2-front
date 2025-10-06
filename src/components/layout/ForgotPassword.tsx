import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/ForgotPassword.css';
import { sendForgotPasswordEmail } from '../../services/passwordService';
import BackgroundRainParticles from '../BackgroundRainParticles';


const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [existsFlag, setExistsFlag] = useState<boolean | undefined>(undefined);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const safeEmail = email.trim();
      const response = await sendForgotPasswordEmail({ email: safeEmail });

      if (response.success) {
        // Mostrar mensaje explícito del backend. Si existe=false, lo tratamos como aviso informativo.
        setMessage(response.message || (response.exists ? 'Enlace enviado.' : 'El email no está registrado o el usuario no está activo'));
        setExistsFlag(response.exists);
      } else {
        setError(response.error || 'Error al procesar la solicitud. Inténtalo de nuevo.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error de conexión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="forgot-password-container">
        <BackgroundRainParticles density={110} speed={0.9} />
      <div className="forgot-password-form">
        <h2>Recuperar Contraseña</h2>
        <p>Ingresa tu correo electrónico para recibir un enlace de recuperación.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {message && (
            <div className={existsFlag === false ? 'error-message' : 'success-message'}>
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Enlace'}
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

export default ForgotPassword;