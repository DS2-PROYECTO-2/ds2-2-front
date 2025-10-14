import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';
import logo2 from '../../assets/logo2.png';

import { 
  Home, 
  Monitor, 
  BarChart3, 
  Users
} from 'lucide-react';

interface LeftSidebarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onNavigate, activeSection }) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const buttons = [
    { icon: Home, id: 'home', title: 'Inicio' },
    { icon: Monitor, id: 'inventory', title: 'Inventario' },
    { icon: BarChart3, id: 'reports', title: 'Reportes' }
  ];

  // Agregar botón de usuarios solo para administradores
  if (user?.role === 'admin') {
    buttons.splice(3, 0, { icon: Users, id: 'users', title: 'Gestión de Usuarios' });
  }

  return (
    <aside className="left-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img src={logo2} alt="Monitores EISC" className="sidebar-logo-img" />
          <div className="sidebar-logo-text">Salas EISC</div>
        </div>
        <NotificationBell />
      </div>
      <nav className="sidebar-nav">
        {buttons.map(({ icon: Icon, id, title }) => (
          <button
            key={id}
            className={`sidebar-button ${activeSection === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            title={title}
          >
            <Icon size={24} />
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          aria-label="Cerrar sesión"
          className="logout-button"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;