import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Edit, Mail, Phone, CreditCard, Shield, Calendar, User as UserIcon } from 'lucide-react';
import { authService } from '../../services/authService';
import type { User } from '../../context/AuthContext';
import ProfileEditModal from './ProfileEditModal';
import '../../styles/Profile.css';

const ProfileView: React.FC = () => {
  const { user: contextUser, updateUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del perfil
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar el usuario del contexto si está disponible, sino cargar desde el servicio
      if (contextUser) {
        setUser(contextUser);
      } else {
        const profileData = await authService.getProfile();
        setUser(profileData);
      }
    } catch (err: unknown) {
      const error = err as { message: string };
      const errorMessage = error.message || 'Error al cargar el perfil';
      setError(errorMessage);
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [contextUser]);

  // Cargar perfil al montar el componente
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

      const weekday = weekdays[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      return `${weekday}, ${day} de ${month} de ${year}`;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Fecha inválida';
    }
  };

  // Obtener iniciales del usuario
  const getUserInitials = (user: User) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Obtener nombre completo
  const getFullName = (user: User) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || user.username;
  };

  // Manejar edición de perfil
  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  // Manejar guardado de perfil
  const handleSaveProfile = async (updatedData: Partial<User>) => {
    try {
      setIsSaving(true);
      setError(null);

      // Llamada al endpoint real para actualizar el perfil
      const response = await authService.updateProfile(updatedData);

      // Actualizar el estado local del usuario con la respuesta del servidor
      if (user) {
        const updatedUser = { ...user, ...response.user };
        setUser(updatedUser);
        // Actualizar el contexto de autenticación
        updateUser(updatedUser);
      }

      // Cerrar modal
      setShowEditModal(false);

      // Mostrar notificación de éxito
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { type: 'success', message: response.message || 'Perfil actualizado correctamente' }
      }));

    } catch (err: unknown) {
      const error = err as { message: string };
      const errorMessage = error.message || 'Error al actualizar el perfil';
      setError(errorMessage);
      console.error('Error updating profile:', err);

      // Mostrar notificación de error
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { type: 'error', message: errorMessage }
      }));
    } finally {
      setIsSaving(false);
    }
  };


  // Mostrar loading
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="profile-container">
        <div className="error-state">
          <UserIcon size={48} />
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadProfile} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Mostrar si no hay usuario
  if (!user) {
    return (
      <div className="profile-container">
        <div className="empty-state">
          <UserIcon size={48} />
          <h3>No hay datos de usuario</h3>
          <p>No se pudieron cargar los datos del perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <h1>Mi Perfil</h1>
          <p>{formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Avatar y nombre */}
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          <span className="avatar-initials">{getUserInitials(user)}</span>
        </div>
        <h2 className="profile-name">{getFullName(user)}</h2>
      </div>

      {/* Información personal */}
      <div className="profile-card">
        <div className="card-header">
          <h3>Información Personal</h3>
          <button
            className="btn-edit-profile"
            onClick={handleEditProfile}
          >
            <Edit size={16} />
            Editar Perfil
          </button>
        </div>

        <div className="profile-info">
          <div className="info-item">
            <div className="info-label">
              <Mail size={16} />
              Dirección de correo:
            </div>
            <div className="info-value email">{user.email}</div>
          </div>

          <div className="info-item">
            <div className="info-label">
              <Shield size={16} />
              Rol:
            </div>
            <div className="info-value">{user.role === 'admin' ? 'Administrador' : 'Monitor'}</div>
          </div>

          <div className="info-item">
            <div className="info-label">
              <Phone size={16} />
              Teléfono:
            </div>
            <div className="info-value">{(user as User & { phone?: string }).phone || 'No especificado'}</div>
          </div>

          <div className="info-item">
            <div className="info-label">
              <CreditCard size={16} />
              Identificación:
            </div>
            <div className="info-value">{(user as User & { identification?: string }).identification || 'No especificada'}</div>
          </div>

          <div className="info-item">
            <div className="info-label">
              <Calendar size={16} />
              Estado de verificación:
            </div>
            <div className={`info-value status ${user.is_verified ? 'verified' : 'pending'}`}>
              {user.is_verified ? 'Verificado' : 'Pendiente'}
            </div>
          </div>
        </div>
      </div>


      {/* Modal de edición */}
      {showEditModal && user && (
        <ProfileEditModal
          user={user}
          onSave={handleSaveProfile}
          onClose={() => setShowEditModal(false)}
          isLoading={isSaving}
        />
      )}
    </div>
  );
};

export default ProfileView;
