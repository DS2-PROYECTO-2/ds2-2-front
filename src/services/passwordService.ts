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
  const response = await fetch('http://localhost:8000/api/auth/password/reset-request/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }

  return result;
};

export const validateResetToken = async (token: string): Promise<ValidateTokenResponse> => {
  try {
    const response = await fetch(`http://localhost:8000/api/auth/password/reset-confirm/?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (response.ok && data.valid) {
      return { success: true, data: { user: data.user } };
    } else {
      return { success: false, error: data.error || 'Token inválido o expirado' };
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
    const response = await fetch('http://localhost:8000/api/auth/password/reset-confirm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      // Manejar diferentes tipos de errores del backend
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
      }
      
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Error en confirmPasswordReset:', error);
    return { success: false, error: 'Error de conexión' };
  }
};