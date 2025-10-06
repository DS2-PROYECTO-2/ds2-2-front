export interface ForgotPasswordData {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface User {
  username: string;
  email: string;
  full_name?: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  data?: {
    user: User;
  };
  error?: string;
}

export interface ConfirmPasswordData {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ConfirmPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const sendForgotPasswordEmail = async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/password/reset-request/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: result.message || 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.'
      };
    } else {
      // Manejar errores específicos del backend
      let errorMessage = 'Error al procesar la solicitud. Inténtalo de nuevo.';
      
      if (result.detail) {
        // Error específico del backend
        errorMessage = result.detail;
      } else if (result.error) {
        // Error en formato estándar
        errorMessage = result.error;
      } else if (result.message) {
        // Mensaje de error
        errorMessage = result.message;
      } else if (result.email) {
        // Error de validación de email
        errorMessage = Array.isArray(result.email) ? result.email[0] : result.email;
      } else if (result.non_field_errors) {
        // Errores generales
        errorMessage = Array.isArray(result.non_field_errors) ? result.non_field_errors[0] : result.non_field_errors;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch {
    return {
      success: false,
      error: 'Error de conexión. Inténtalo de nuevo.'
    };
  }
};

export const validateResetToken = async (token: string): Promise<ValidateTokenResponse> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/password/reset-confirm/?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok && data.valid) {
      return { success: true, data: { user: data.user } };
    } else {
      // Manejar errores específicos del token
      let errorMessage = 'Token inválido o expirado';
      
      if (data.error) {
        errorMessage = data.error;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      return { success: false, error: errorMessage };
    }
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
};

export const confirmPasswordReset = async (
  token: string, 
  newPassword: string, 
  confirmPassword: string
): Promise<ConfirmPasswordResponse> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/password/reset-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        token,
        new_password: newPassword,
        new_password_confirm: confirmPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      // Manejar errores específicos del backend
      let errorMessage = 'Error al actualizar la contraseña';
      
      if (data.detail) {
        // Error específico del backend
        errorMessage = data.detail;
      } else if (data.error) {
        // Error en formato estándar
        errorMessage = data.error;
      } else if (data.message) {
        // Mensaje de error
        errorMessage = data.message;
      } else if (data.new_password) {
        // Error de validación de contraseña
        errorMessage = Array.isArray(data.new_password) ? data.new_password[0] : data.new_password;
      } else if (data.new_password_confirm) {
        // Error de confirmación de contraseña
        errorMessage = Array.isArray(data.new_password_confirm) ? data.new_password_confirm[0] : data.new_password_confirm;
      } else if (data.token) {
        // Error de token
        errorMessage = Array.isArray(data.token) ? data.token[0] : data.token;
      } else if (data.non_field_errors) {
        // Errores generales
        errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
      }
      
      return { success: false, error: errorMessage };
    }
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
};