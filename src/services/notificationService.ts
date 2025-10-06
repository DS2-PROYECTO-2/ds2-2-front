import { apiClient } from '../utils/api';

export interface Notification {
  id: number;
  type: 'hours_exceeded' | 'system' | 'warning';
  title: string;
  message: string;
  monitor_id?: number;
  monitor_name?: string;
  created_at: string;
  is_read: boolean;
}

export interface HoursExceededNotification {
  monitor_id: number;
  monitor_name: string;
  hours_worked: number;
  date: string;
}

export const notificationService = {
  // Obtener notificaciones del admin
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get('/api/notifications/list/');
    return response.notifications || [];
  },

  // Marcar notificación como leída
  async markAsRead(notificationId: number): Promise<void> {
    return apiClient.patch(`/api/notifications/${notificationId}/mark-read/`);
  },

  // Marcar todas como leídas
  async markAllAsRead(): Promise<void> {
    return apiClient.patch('/api/notifications/mark-all-read/');
  },

  // Enviar notificación de horas excedidas (ya no necesario - automático)
  async notifyHoursExceeded(data: HoursExceededNotification): Promise<void> {
    return apiClient.post('/api/notifications/hours-exceeded/', data);
  },

  // Obtener contador de notificaciones no leídas
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/api/notifications/unread-count/');
    return response.unread_count || 0;
  }
};
