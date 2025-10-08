import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/Register.css";
import BackgroundRainParticles from '../BackgroundRainParticles';


// Interfaces para tipado
interface FormData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  identification: string;
  phone: string;
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

// Función para validar identificación
const validateIdentification = (identification: string) => {
  const cleanId = identification.replace(/\D/g, ''); // Solo números
  return cleanId.length >= 6 && cleanId.length <= 10;
};


// Función para actualizar requisitos de contraseña - FUERA del componente
const updatePasswordRequirements = (password: string, setPasswordRequirements: (requirements: PasswordRequirements) => void) => {
  const validation = validatePasswordStructure(password);
  setPasswordRequirements(validation);
};

// Función de validación del formulario - FUERA del componente
const validateForm = async (
  formData: FormData,
  setErrors: (errors: Record<string, string>) => void
) => {
  const newErrors: Record<string, string> = {};

  // Validaciones básicas
  
  if (!formData.username.trim()) {
      newErrors.username = 'El usuario es obligatorio';
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
  setFormData: (updater: (prev: FormData) => FormData) => void,
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


const Register = () => {
  const [formData, setFormData] = useState<FormData>({
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChar: false,
    isValid: false
  });

  // Handlers para campos numéricos (evitar letras y 'e')
  const onNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const onNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text');
    if (/[^0-9]/.test(paste)) {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      const digits = paste.replace(/\D/g, '');
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      const maxLen = target.maxLength > 0 ? target.maxLength : undefined;
      const next = (target.value.slice(0, start) + digits + target.value.slice(end));
      const finalValue = maxLen ? next.slice(0, maxLen) : next;
      const name = target.name as keyof FormData;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      if (errors[name as string]) {
        setErrors(prev => ({ ...prev, [name as string]: '' }));
      }
    }
  };

  const onNumericChange = (name: keyof FormData, maxLen?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const value = typeof maxLen === 'number' ? digits.slice(0, maxLen) : digits;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as string]) {
      setErrors(prev => ({ ...prev, [name as string]: '' }));
    }
  };

  // Función para manejar envío del formulario - DENTRO del componente
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const isValid = await validateForm(formData, setErrors);
    
    if (isValid) {
      setIsLoading(true);
      try {
        // Importar el servicio de registro
        const { registerUser } = await import('../../services/registerService');
        
        // Llamar a la API
        const response = await registerUser(formData);
        
        // Mostrar modal de éxito
        setSuccessMessage(response.message);
        setShowSuccessModal(true);
      } catch (error: unknown) {
        // Error de registro capturado
        
        // Manejar errores de la API
        if (error instanceof Error) {
          try {
            const apiErrors = JSON.parse(error.message);
            const newErrors: Record<string, string> = {};
            
            // Mapear errores específicos del backend
            Object.keys(apiErrors).forEach(key => {
              if (apiErrors[key] && Array.isArray(apiErrors[key]) && apiErrors[key].length > 0) {
                // Tomar el primer error del array
                newErrors[key] = apiErrors[key][0];
              } else if (typeof apiErrors[key] === 'string') {
                // Error directo como string
                newErrors[key] = apiErrors[key];
              }
            });
            
            // Si no hay errores específicos de campo, mostrar error general
            if (Object.keys(newErrors).length === 0) {
              setErrors({
                general: 'Error al crear la cuenta. Inténtalo de nuevo.'
              });
            } else {
              setErrors(newErrors);
            }
          } catch {
            // Error genérico si no se puede parsear
            setErrors({
              general: 'Error al crear la cuenta. Inténtalo de nuevo.'
            });
          }
        } else {
          setErrors({
            general: 'Error de conexión. Inténtalo de nuevo.'
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const navigate = useNavigate();

  return (
    <div className="register-container">
      <BackgroundRainParticles density={110} speed={0.9} />
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">Completa tus datos para registrarte</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
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
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.identification}
                onChange={onNumericChange('identification', 10)}
                onKeyDown={onNumericKeyDown}
                onPaste={onNumericPaste}
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
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.phone}
                onChange={onNumericChange('phone')}
                onKeyDown={onNumericKeyDown}
                onPaste={onNumericPaste}
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

          {errors.general && (
            <div className="error-message-general">
                {errors.general}
            </div>
          )}

          <div className="register-options">
            <p className="login-link">
              ¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a>
            </p>
          </div>
        </form>
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-modal-content">
              <div className="success-icon">✅</div>
              <h3>¡Registro Exitoso!</h3>
              <p>{successMessage}</p>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/login');
                }}
                className="success-modal-button"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Register;