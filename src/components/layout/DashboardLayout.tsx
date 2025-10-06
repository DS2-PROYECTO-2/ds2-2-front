import React, { useState, useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import "../../styles/dashboard.css";
import RoomPanel from '../rooms/RoomPanel';
import RoomHistory from '../rooms/RoomHistory';
import RoomStatsRow from '../rooms/RoomStatsRow';
import { useAuth } from '../../hooks/useAuth';


const DashboardLayout: React.FC = () => {
  const { user, isLoading, isHydrated } = useAuth();
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [activeSection, setActiveSection] = useState('home');

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
        return (
          <div className="content-panel">
            <h2>Inventario</h2>
            <p>Gestión de inventario de salas</p>
          </div>
        );
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
    </div>
  );
};

export default DashboardLayout;

