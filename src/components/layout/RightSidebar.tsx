import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, CheckCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { User as AppUser } from '../../context/AuthContext';

const RightSidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Obtener iniciales del usuario
  const getUserInitials = (user: AppUser) => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Obtener nombre completo
  const getFullName = (user: AppUser) => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return `${firstName} ${lastName}`.trim() || user?.username || 'Usuario';
  };


  // Formatear fecha de creación
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No disponible';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Manejar click en el perfil para navegar
  const handleProfileClick = () => {
    console.log('Profile clicked, navigating to /profile');
    navigate('/profile');
  };

  if (!user) {
    return (
      <aside className="right-sidebar">
        <div className="profile-section">
          <div className="profile-placeholder">
            <User size={24} />
            <p>Cargando...</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="right-sidebar">
      <div className="profile-section">
        {/* Avatar y nombre */}
        <div className="profile-summary" onClick={handleProfileClick}>
          <div className="profile-avatar-mini">
            <span className="avatar-initials-mini">{getUserInitials(user)}</span>
          </div>
          <div className="profile-info-mini">
            <h4 className="profile-name-mini">{getFullName(user)}</h4>
            <p className="profile-email-mini">{user.email}</p>
            <div className="profile-role-mini">
              <Shield size={12} />
              <span>{user.role === 'admin' ? 'Administrador' : 'Monitor'}</span>
            </div>
            <div className="profile-status-mini">
              <CheckCircle size={12} />
              <span className={user.is_verified ? 'verified' : 'pending'}>
                {user.is_verified ? 'Verificado' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="profile-stats">
          <h5>Actividad Reciente</h5>
          <div className="stat-item">
            <Calendar size={14} />
            <span>Miembro desde: {formatDate(user.created_at)}</span>
          </div>
          <div className="stat-item">
            <Shield size={14} />
            <span>Rol: {user.role === 'admin' ? 'Administrador' : 'Monitor'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;