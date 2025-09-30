import React, { useState } from 'react';
import BackgroundRainParticles from '../BackgroundRainParticles';
import "../../styles/Login.css";
import logo2 from '../../assets/logo2.png'

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para errores
  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });

  // Función de validación
  const validateForm = () => {
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



  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Lógica de login aquí

    if (validateForm()) {
      // Solo proceder si no hay errores
      console.log('Formulario válido:', { username, password });
      // Aquí iría la lógica de login
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
          <div className="input-group">
            <label className="input-label" htmlFor='username'>Usuario</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`login-input ${errors.username ? 'error' : ''}`}
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
          
          
          
          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>

          <a href="#" className="forgot-password">Olvidé mi contraseña</a>
          
          <a href="#" className="register-account">
            ¿Aun no tienes cuenta? Regístrate aquí
          </a>

        </form>
      </div>
    </div>
  );
};

export default Login;