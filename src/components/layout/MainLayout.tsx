import React, { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import '../../styles/dashboard.css';
import RoomPanel from '../rooms/RoomPanel';
import RoomHistory from '../rooms/RoomHistory';
import RoomStatsRow from '../rooms/RoomStatsRow';
import { useAuth } from '../../hooks/useAuth';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activeSection, setActiveSection] = useState('home');
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const { user } = useAuth();

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
        return children;
    }
  };

  return (
    <div className="dashboard-layout">
      <LeftSidebar onNavigate={setActiveSection} activeSection={activeSection} />
      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  );
};

export default MainLayout;
