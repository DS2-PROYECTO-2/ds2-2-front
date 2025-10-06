import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService, type Notification } from '../../services/notificationService';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);
  const [animateBell, setAnimateBell] = useState(false);
  const prevUnreadRef = React.useRef<number>(0);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const backendNotifs = await notificationService.getNotifications();
      
      setNotifications(backendNotifs);
      
      const unreadCount = backendNotifs.filter(n => !n.is_read).length;
      setUnreadCount(unreadCount);
      
    } catch {
      // Silencio errores en pruebas/offline
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silencio errores en pruebas/offline
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      
      // Marcar todas las notificaciones no leídas individualmente
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // Procesar todas las notificaciones no leídas en paralelo
      await Promise.all(
        unreadNotifications.map(notification => 
          notificationService.markAsRead(notification.id)
        )
      );
      
      // Actualizar el estado local
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silencio errores en pruebas/offline
    } finally {
      setMarkingAll(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Reproducir animación del timbre al incrementar las no leídas
  useEffect(() => {
    const prevUnread = prevUnreadRef.current;
    if (unreadCount > 0 && unreadCount > prevUnread) {
      setAnimateBell(true);
      const timeout = setTimeout(() => setAnimateBell(false), 650); // debe coincidir con CSS ~600ms
      return () => clearTimeout(timeout);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleWindowFocus = () => loadNotifications();
    window.addEventListener('focus', handleWindowFocus);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'room-event' || e.key === 'notifications-updated') {
        loadNotifications();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef && !dropdownRef.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, dropdownRef]);

  // Escuchar eventos de entrada/salida de salas para actualizar notificaciones
  useEffect(() => {
    const handleRoomEntry = (event: CustomEvent) => {
      const { roomName, userName } = event.detail || {};
      
      if (roomName && userName) {
        // Actualizar inmediatamente
        loadNotifications();
      }
    };

    const handleRoomExit = (event: CustomEvent) => {
      const { roomName, userName } = event.detail || {};
      
      if (roomName && userName) {
        // Actualizar inmediatamente
        loadNotifications();
      }
    };

    window.addEventListener('room-entry-added', handleRoomEntry);
    window.addEventListener('room-entry-exited', handleRoomExit);
    
    return () => {
      window.removeEventListener('room-entry-added', handleRoomEntry);
      window.removeEventListener('room-entry-exited', handleRoomExit);
    };
  }, []);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mostrar para usuarios autenticados (admins y monitores)
  if (!user) {
    return null;
  }


  return (
    <div className="notification-bell">
      <button
        className={`bell-button ${unreadCount > 0 ? 'has-notifications' : ''} ${animateBell ? 'icon-anim' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
          }
        }}
        title={`${unreadCount} notificaciones no leídas`}
      >
        {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && (
          <span className="notification-badge badge-anim">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={setDropdownRef}
          className="notification-dropdown animate-fade-in"
        >
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <div className="notification-actions">
              <button 
                className="refresh-btn"
                onClick={loadNotifications}
                disabled={loading}
                title="Actualizar notificaciones"
              >
                {loading ? '⟳' : '↻'}
              </button>
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                  disabled={markingAll}
                >
                  {markingAll ? 'Limpiando...' : 'Limpiar'}
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="loading">Cargando notificaciones...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">No hay notificaciones</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    {notification.monitor_name && (
                      <span className="monitor-info">
                        Monitor: {notification.monitor_name}
                      </span>
                    )}
                    <time>{formatDate(notification.created_at)}</time>
                  </div>
                  {!notification.is_read && <div className="unread-indicator" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
