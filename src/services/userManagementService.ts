import { apiClient } from '../utils/api';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  identification?: string;
  phone?: string;
  role: 'admin' | 'monitor';
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  last_login?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  is_verified?: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  identification?: string;
  phone?: string;
  role: 'admin' | 'monitor';
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  cedula?: string;
  identification?: string;
  phone?: string;
  role?: 'admin' | 'monitor';
  is_active?: boolean;
  is_verified?: boolean;
}

const userManagementService = {
  // Obtener lista de usuarios
  async getUsers(filters?: UserFilters): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) {
        // Usar solo un parámetro de búsqueda para evitar confusión
        params.append('search', filters.search);
      }
      if (filters?.role) {
        params.append('role', filters.role);
      }
      if (filters?.is_verified !== undefined) {
        params.append('is_verified', filters.is_verified.toString());
      }
      
      // Agregar ordenamiento ascendente por ID
      params.append('ordering', 'id');

      const url = `/api/auth/admin/users/?${params.toString()}`;
      const response = await apiClient.get(url) as User[];
      
      // Verificar que response existe y es un array
      if (!response || !Array.isArray(response)) {
        console.warn('No users data received or invalid format:', response);
        return [];
      }
      
      // El backend no incluye campos de último acceso
      // Usaremos created_at como fallback si está disponible
      
      // Mapear usuarios con manejo robusto de campos
      const mappedUsers = response.map(user => ({
        id: user.id,
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        identification: user.identification || undefined,
        phone: user.phone || undefined,
        role: user.role || 'monitor',
        is_active: user.is_active !== undefined ? user.is_active : true,
        is_verified: user.is_verified !== undefined ? user.is_verified : false,
        date_joined: user.date_joined || '',
        last_login: user.last_login || undefined
      }));
      
      // Ordenar por ID en orden ascendente
      return mappedUsers.sort((a, b) => a.id - b.id);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Obtener usuario por ID
  async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get(`/api/auth/admin/users/${id}/`);
      return response as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Crear nuevo usuario
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Usar el endpoint de registro estándar que ya existe
      const response = await apiClient.post('/api/auth/register/', userData);
      return response as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Actualizar usuario por admin (edición consolidada)
  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    try {
      // Endpoint de edición por administrador que permite cambiar datos y campos administrativos
      const response = await apiClient.patch(`/api/auth/admin/users/${id}/edit/`, userData);
      return response as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Eliminar usuario
  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/auth/admin/users/${id}/`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Verificar/Desverificar usuario
  async verifyUser(id: number, isVerified: boolean): Promise<User> {
    try {
      const response = await apiClient.patch(`/api/auth/admin/users/${id}/verify/`, {
        is_verified: isVerified
      });
      
      return response as User;
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  },


  // Activar usuario con token
  async activateUser(token: string): Promise<User> {
    try {
      const response = await apiClient.post('/api/auth/admin/users/activate/', { token });
      return response as User;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  // Eliminar usuario con token
  async deleteUserWithToken(token: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/admin/users/delete/', { token });
    } catch (error) {
      console.error('Error deleting user with token:', error);
      throw error;
    }
  },

  // Cambiar contraseña de usuario
  async changeUserPassword(id: number, newPassword: string): Promise<void> {
    try {
      await apiClient.post(`/api/auth/admin/users/${id}/change-password/`, {
        password: newPassword
      });
    } catch (error) {
      console.error('Error changing user password:', error);
      throw error;
    }
  },

  // Obtener solo monitores
  async getMonitors(): Promise<User[]> {
    try {
      return await this.getUsers({ role: 'monitor' });
    } catch (error) {
      console.error('Error fetching monitors:', error);
      throw error;
    }
  }
};

export default userManagementService;
