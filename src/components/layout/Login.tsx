import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BackgroundRainParticles from '../BackgroundRainParticles';
import "../../styles/Login.css";
import logo2 from '../../assets/logo2.png'

// Función de validación - FUERA del componente
const validateForm = (username: string, password: string, setErrors: (errors: {username: string, password: string}) => void) => {
  const newErrors = {
    username: '',
    password: ''
  };

  // Validar usuario
  if (!username.trim()) {
    newErrors.username = 'El usuario es obligatorio';
  }

  // Validar contraseña
  if (!password.trim()) {
    newErrors.password = 'La contraseña es obligatoria';
  }

  setErrors(newErrors);
  return !newErrors.username && !newErrors.password;
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Estados para errores
  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });
  const [generalError, setGeneralError] = useState('');

  const { login, isLoading} = useAuth();
  const navigate = useNavigate();



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setErrors({ username: '', password: '' });
    setGeneralError('');
    
    if (validateForm(username, password, setErrors)) {
      try {
        await login({ username, password });
        navigate('/dashboard');
      } catch (error: unknown) {
        // Manejar errores específicos del backend
        try {
          // El error viene del apiClient con estructura ApiError
          if (error && typeof error === 'object' && 'data' in error) {
            const apiError = error as { status: number; data: unknown; message: string };
            const errorData = apiError.data as Record<string, unknown>;
            
            // Manejar non_field_errors (errores generales)
            if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
              setErrors({
                username: '',
                password: errorData.non_field_errors[0] as string
              });
            }
            // Manejar errores específicos de campos
            else if (errorData.username && Array.isArray(errorData.username)) {
              setErrors({
                username: errorData.username[0] as string,
                password: ''
              });
            }
            else if (errorData.password && Array.isArray(errorData.password)) {
              setErrors({
                username: '',
                password: errorData.password[0] as string
              });
            }
            // Manejar errores de autenticación específicos
            else if (apiError.status === 401) {
              setGeneralError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
            }
            else if (apiError.status === 400) {
              setGeneralError('Datos de entrada inválidos. Verifica tu información.');
            }
            else if (apiError.status === 403) {
              setGeneralError('Tu cuenta no tiene permisos para acceder.');
            }
            else if (apiError.status === 500) {
              setGeneralError('Error interno del servidor. Inténtalo más tarde.');
            }
            else {
              // Usar el mensaje del apiClient
              setGeneralError(apiError.message || 'Error de autenticación');
            }
          } else {
            // Error de conexión o formato inesperado
            setGeneralError('Error de conexión con el servidor');
          }
          
        } catch {
          // Error de conexión o formato inesperado
          setGeneralError('Error de conexión con el servidor');
        }
      }
    }
  };

  return (
    <div className="login-container">
      <BackgroundRainParticles density={110} speed={0.9} />
      
      <div className="login-card">
        <div className="login-header">
          <img src={logo2} alt="Monitores EISC" className="login-logo" />
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {generalError && (
            <div className="error-message-general">
              {generalError}
            </div>
          )}
          <div className="input-group">
            <label className="input-label" htmlFor='username'>Usuario</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`login-input ${errors.username ? 'error' : ''}`}
              placeholder="Ingresa tu usuario"
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor='password'>Contraseña</label>
            <input
              id="password" 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`login-input ${errors.password ? 'error' : ''}`}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              //<span className="error-message">{errors.password}</span>
              <span id="password-error" className="error-message">{errors.password}</span>
            )}

              
              <div className="password-toggle">
                <label className="password-toggle-label">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    aria-controls="password-input"
                  />
                    Mostrar contraseña
                </label>
              </div>
          </div>
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
          <div className="form-links">
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
              className="link-button"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          
          <a href="/register" className="register-account">
            ¿Aun no tienes cuenta? Regístrate aquí
          </a>

        </form>
      </div>
    </div>
  );
};

export default Login;