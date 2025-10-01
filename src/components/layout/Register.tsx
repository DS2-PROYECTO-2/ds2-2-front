import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/Register.css";
import BackgroundRainParticles from '../BackgroundRainParticles';




// Función para validar estructura de contraseña
const validatePasswordStructure = (password: string) => {
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

// Función para validar identificación
const validateIdentification = (identification: string) => {
  const cleanId = identification.replace(/\D/g, ''); // Solo números
  return cleanId.length >= 6 && cleanId.length <= 10;
};

// Función para verificar si el usuario ya existe (simulada)
const checkUsernameExists = async (username: string) => {
  // Simular llamada al API
  const existingUsernames = ['admin', 'test', 'user', 'demo'];
  return existingUsernames.includes(username.toLowerCase());
};

// Función para actualizar requisitos de contraseña - FUERA del componente
const updatePasswordRequirements = (password: string, setPasswordRequirements: (requirements: any) => void) => {
  const validation = validatePasswordStructure(password);
  setPasswordRequirements(validation);
};

// Función de validación del formulario - FUERA del componente
const validateForm = async (
  formData: any,
  setErrors: (errors: Record<string, string>) => void
) => {
  const newErrors: Record<string, string> = {};

  // Validaciones básicas
  
  if (!formData.username.trim()) {
      newErrors.username = 'El usuario es obligatorio';
  } else {
      // Verificar si el usuario ya existe
      const usernameExists = await checkUsernameExists(formData.username);
      if (usernameExists) {
      newErrors.username = 'Este nombre de usuario ya está en uso';
      }
    }

  if (!formData.email.trim()) {
    newErrors.email = 'El email es obligatorio';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'El email no es válido';
  }

  if (!formData.password.trim()){ 
      newErrors.password = 'La contraseña es obligatoria';
    } else {
      // Validar longitud mínima primero
      if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      } else {
        // Validar estructura de contraseña
        const passwordValidation = validatePasswordStructure(formData.password);
        
        if (!passwordValidation.isValid) {
          // Mostrar el primer requisito faltante
          if (!passwordValidation.hasUpperCase) {
            newErrors.password = 'La contraseña debe contener al menos una mayúscula';
          } else if (!passwordValidation.hasLowerCase) {
            newErrors.password = 'La contraseña debe contener al menos una minúscula';
          } else if (!passwordValidation.hasNumbers) {
            newErrors.password = 'La contraseña debe contener al menos una número';
          } else if (!passwordValidation.hasSpecialChar) {
            newErrors.password = 'La contraseña debe contener al menos una carácter especial';
          }
        }
      }
    }

  if (!formData.password_confirm.trim()) {
      newErrors.password_confirm = 'La confirmación de contraseña es obligatoria';
  } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Las contraseñas no coinciden';
  }

  if (!formData.first_name.trim()) newErrors.first_name = 'El nombre es obligatorio';
  if (!formData.last_name.trim()) newErrors.last_name = 'El apellido es obligatorio';
  

  if (!formData.identification.trim()) {
      newErrors.identification = 'La identificación es obligatoria';
  } else if (!validateIdentification(formData.identification)) {
      newErrors.identification = 'La identificación debe tener entre 6 y 10 dígitos';
  }


  if (!formData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Función para manejar cambios en inputs - FUERA del componente
const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setFormData: (updater: (prev: any) => any) => void,
  setErrors: (updater: (prev: Record<string, string>) => Record<string, string>) => void,
  errors: Record<string, string>
) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
  
  // Limpiar error del campo cuando el usuario empiece a escribir
  if (errors[name]) {
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  }
};

// Función para manejar envío del formulario - FUERA del componente
const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>,
  formData: any,
  setErrors: (errors: Record<string, string>) => void,
  setIsLoading: (loading: boolean) => void,
  navigate: (path: string) => void
) => {
  e.preventDefault();
  
  const isValid = await validateForm(formData, setErrors);
  
  if (isValid) {
      setIsLoading(true);
      try {
      // Aquí iría la llamada al API de registro
      console.log('Datos de registro:', formData);
      // Simular llamada al API
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/login');
      } catch (error: unknown) {
      console.error('Error en registro:', error);
      setErrors({
          general: 'Error al crear la cuenta. Inténtalo de nuevo.'
      });
      } finally {
      setIsLoading(false);
      }
  }
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    identification: '',
    phone: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [passwordRequirements, setPasswordRequirements] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChar: false
  });

  const navigate = useNavigate();

  return (
    <div className="register-container">
      <BackgroundRainParticles density={110} speed={0.9} />
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">Completa tus datos para registrarte</p>
        </div>
        
        <form onSubmit={(e) => handleSubmit(e, formData, setErrors, setIsLoading, navigate)} className="register-form">
          <div className="form-row">
            <div className="input-group">
              <label className="input-label" htmlFor="first_name">Nombre</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
                className={`register-input ${errors.first_name ? 'error' : ''}`}
                placeholder="Tu nombre"
              />
              {errors.first_name && (
                <span className="error-message">{errors.first_name}</span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="last_name">Apellido</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
                className={`register-input ${errors.last_name ? 'error' : ''}`}
                placeholder="Tu apellido"
              />
              {errors.last_name && (
                <span className="error-message">{errors.last_name}</span>
              )}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
              className={`register-input ${errors.username ? 'error' : ''}`}
              placeholder="Nombre de usuario"
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
              className={`register-input ${errors.email ? 'error' : ''}`}
              placeholder="tu@email.com"
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="identification">Identificación</label>
            <input
                id="identification"
                name="identification"
                type="text"
                value={formData.identification}
                onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
                className={`register-input ${errors.identification ? 'error' : ''}`}
                placeholder="Entre 6 y 10 dígitos"
                maxLength={10}
            />
            {errors.identification && (
                <span className="error-message">{errors.identification}</span>
            )}
            </div>

          <div className="input-group">
            <label className="input-label" htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
              className={`register-input ${errors.phone ? 'error' : ''}`}
              placeholder="Número de teléfono"
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          <div className="form-row">
            <div className="input-group">
                <label className="input-label" htmlFor="password">Contraseña</label>
                <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                    handleInputChange(e, setFormData, setErrors, errors);
                    updatePasswordRequirements(e.target.value, setPasswordRequirements);
                    }}
                    className={`register-input ${errors.password ? 'error' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                />
                {errors.password && (
                    <span className="error-message">{errors.password}</span>
                )}
                
                {/* Indicadores de requisitos de contraseña */}
                {formData.password && (
                    <div className="password-requirements">
                    <div className={`requirement ${passwordRequirements.hasUpperCase ? 'valid' : 'invalid'}`}>
                         Una mayúscula
                    </div>
                    <div className={`requirement ${passwordRequirements.hasLowerCase ? 'valid' : 'invalid'}`}>
                         Una minúscula
                    </div>
                    <div className={`requirement ${passwordRequirements.hasNumbers ? 'valid' : 'invalid'}`}>
                         Un número
                    </div>
                    <div className={`requirement ${passwordRequirements.hasSpecialChar ? 'valid' : 'invalid'}`}>
                         Un carácter especial
                    </div>
                    </div>
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

            <div className="input-group">
              <label className="input-label" htmlFor="password_confirm">Confirmar Contraseña</label>
              <input
                id="password_confirm"
                name="password_confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.password_confirm}
                onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
                className={`register-input ${errors.password_confirm ? 'error' : ''}`}
                placeholder="Repite tu contraseña"
              />
              {errors.password_confirm && (
                <span className="error-message">{errors.password_confirm}</span>
              )}
              <div className="password-toggle">
                <label className="password-toggle-label">
                  <input
                    type="checkbox"
                    checked={showConfirmPassword}
                    onChange={(e) => setShowConfirmPassword(e.target.checked)}
                    aria-controls="password_confirm-input"
                  />
                  Mostrar confirmación
                </label>
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="error-message-general">
              {errors.general}
            </div>
          )}

          <button 
            type="submit" 
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>

          <div className="register-options">
            <p className="login-link">
              ¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};


export default Register;