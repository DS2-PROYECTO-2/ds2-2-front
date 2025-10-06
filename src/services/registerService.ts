const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  identification: string;
  phone: string;
  role: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    is_verified: boolean;
  };
}

export interface RegisterError {
  username?: string[];
  email?: string[];
  identification?: string[];
  password_confirm?: string[];
  [key: string]: string[] | undefined;
}

export const registerUser = async (data: Omit<RegisterData, 'role'>): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      role: 'monitor' // Siempre se crea como monitor
    })
  });

  const result = await response.json();

  if (!response.ok) {
    // El backend devuelve errores en formato { "field": ["error message"] }
    // Convertir a formato que el componente pueda manejar
    const errorDetails = result;
    throw new Error(JSON.stringify(errorDetails));
  }

  return result;
};