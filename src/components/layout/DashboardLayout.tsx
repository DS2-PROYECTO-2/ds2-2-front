import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import "../../styles/dashboard.css";
import RoomPanel from '../rooms/RoomPanel';
import RoomHistory from '../rooms/RoomHistory';
import RoomStatsRow from '../rooms/RoomStatsRow';
import RoomManagement from '../rooms/RoomManagement';
import { useAuth } from '../../hooks/useAuth';


const DashboardLayout: React.FC = () => {
  const { user, isLoading, isHydrated } = useAuth();
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const location = useLocation();
  const [confirmConfig, setConfirmConfig] = useState<null | {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);
  
  // Determinar la sección activa basada en la ruta
  const getActiveSection = useCallback(() => {
    const path = location.pathname;
    if (path === '/inventory') return 'inventory';
    if (path === '/reports') return 'reports';
    if (path === '/settings') return 'settings';
    return 'home';
  }, [location.pathname]);
  
  const [activeSection, setActiveSection] = useState(getActiveSection());

  // Actualizar la sección activa cuando cambie la ruta
  useEffect(() => {
    setActiveSection(getActiveSection());
  }, [getActiveSection]);

  // Componentes de las diferentes secciones
  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <>
            {/* Solo monitores ven las estadísticas y panel de registro */}
            {user?.role === 'monitor' && (
              <>
                <RoomStatsRow />
                <div className="content-panel panel-room">
                  <RoomPanel onChanged={() => setHistoryReloadKey(k => k + 1)} />
                </div>
              </>
            )}
            
            {/* Todos ven el historial */}
            <div className="content-panel panel-list" style={{ marginTop: user?.role === 'monitor' ? '1rem' : '0' }}>
              <RoomHistory reloadKey={historyReloadKey} />
            </div>
          </>
        );
      case 'inventory':
        return <RoomManagement />;
      case 'reports':
        return (
          <div className="content-panel">
            <h2>Reportes</h2>
            <p>Reportes y estadísticas del sistema</p>
          </div>
        );
      case 'settings':
        return (
          <div className="content-panel">
            <h2>Configuración</h2>
            <p>Configuración del sistema</p>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const els = document.querySelectorAll('.content-panel');
    els.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Listener global para confirmaciones de la app
  useEffect(() => {
    const onConfirmEvent = (e: Event) => {
      const custom = e as CustomEvent;
      const detail = custom.detail || {};
      setConfirmConfig({
        title: detail.title || 'Confirmación',
        message: detail.message || '¿Confirmar la acción?',
        confirmText: detail.confirmText || 'Confirmar',
        cancelText: detail.cancelText || 'Cancelar',
        onConfirm: detail.onConfirm,
        onCancel: detail.onCancel,
      });
    };
    window.addEventListener('app-confirm' as unknown as string, onConfirmEvent as EventListener);
    return () => window.removeEventListener('app-confirm' as unknown as string, onConfirmEvent as EventListener);
  }, []);

  // Listener global para toasts de la app
  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail || {} as { message: string; type: 'success' | 'error' };
      if (!message) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts(prev => [...prev, { id, message, type: type === 'success' ? 'success' : 'error' }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    const onToastClear = () => setToasts([]);
    window.addEventListener('app-toast' as unknown as string, onToast as EventListener);
    window.addEventListener('app-toast-clear' as unknown as string, onToastClear as EventListener);
    return () => {
      window.removeEventListener('app-toast' as unknown as string, onToast as EventListener);
      window.removeEventListener('app-toast-clear' as unknown as string, onToastClear as EventListener);
    };
  }, []);

  // El RoomHistory ahora maneja las actualizaciones en tiempo real para todos los usuarios
  // El reloadKey solo se usa para actualizaciones manuales desde el RoomPanel (monitores)


  // Mostrar loading solo si está cargando Y no está hidratado
  if (isLoading && !isHydrated) {
    return (
      <div className="dashboard-layout">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Cargando...</div>
        </div>
      </div>
    );
  }

  // Solo mostrar "No autenticado" si está hidratado y no hay usuario
  if (isHydrated && !user) {
    return (
      <div className="dashboard-layout">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>No autenticado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <LeftSidebar onNavigate={setActiveSection} activeSection={activeSection} />
      <main className="main-content">
        {renderSection()}
      </main>

      {confirmConfig && (
        <div className="modal-overlay" onClick={() => { confirmConfig.onCancel?.(); setConfirmConfig(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{confirmConfig.title}</h2>
            </div>
            <div className="modal-body">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => { confirmConfig.onCancel?.(); setConfirmConfig(null); }}
              >
                {confirmConfig.cancelText || 'Cancelar'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { confirmConfig.onConfirm?.(); setConfirmConfig(null); }}
              >
                {confirmConfig.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts globales */}
      {toasts.length > 0 && (
        <div
          className="toast-container"
          style={{ position: 'fixed', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 1000 }}
        >
          {toasts.map(t => (
            <div key={t.id} className={`notification-toast ${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;

