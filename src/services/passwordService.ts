export interface ForgotPasswordData {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export const sendForgotPasswordEmail = async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
  const response = await fetch('http://localhost:8000/api/auth/forgot-password/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Error al enviar el enlace de recuperación');
  }

  return result;
};