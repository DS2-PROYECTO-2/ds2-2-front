import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../../styles/AdminApproval.css';
import BackgroundRainParticles from '../BackgroundRainParticles';

const AdminApproval: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [componentError, setComponentError] = useState<string | null>(null);

  const action = searchParams.get('action');
  const user = searchParams.get('user');
  const error = searchParams.get('error');

  useEffect(() => {
    try {
      // Simular carga para mejor UX
      setTimeout(() => setLoading(false), 1000);
    } catch (err) {
      console.error('Error en AdminApproval:', err);
      setComponentError('Error al cargar el componente');
      setLoading(false);
    }
  }, []);

  const getMessage = () => {
    // Debug: Log para verificar parámetros
    console.log('AdminApproval - Parámetros recibidos:', { action, user, error });
    
    if (error) {
      switch (error) {
        case 'missing_token':
          return {
            type: 'error',
            title: 'Token no encontrado',
            message: 'No se proporcionó un token válido.',
            icon: '❌'
          };
        case 'invalid_token':
          return {
            type: 'error',
            title: 'Enlace inválido',
            message: 'El enlace no es válido o ha sido modificado.',
            icon: '❌'
          };
        case 'expired':
          return {
            type: 'error',
            title: 'Enlace expirado',
            message: 'Este enlace ha expirado. Los enlaces son válidos por 24 horas.',
            icon: '⏰'
          };
        case 'used':
          return {
            type: 'error',
            title: 'Enlace ya usado',
            message: 'Este enlace ya fue utilizado anteriormente.',
            icon: '🔄'
          };
        default:
          return {
            type: 'error',
            title: 'Error desconocido',
            message: `Ha ocurrido un error inesperado: ${error}`,
            icon: '❌'
          };
      }
    }

    if (action === 'approved') {
      return {
        type: 'success',
        title: 'Usuario Aprobado',
        message: `El usuario @${user} ha sido verificado exitosamente.`,
        icon: '✅'
      };
    }

    if (action === 'rejected') {
      return {
        type: 'success',
        title: 'Usuario Rechazado',
        message: `El usuario @${user} ha sido eliminado del sistema.`,
        icon: '🗑️'
      };
    }

    // Si no hay parámetros, mostrar mensaje de carga o error
    if (!action && !error) {
      return {
        type: 'info',
        title: 'Cargando...',
        message: 'Procesando la solicitud, por favor espera.',
        icon: '⏳'
      };
    }

    return {
      type: 'info',
      title: 'Acción no reconocida',
      message: `No se pudo determinar la acción realizada. Parámetros: action=${action}, user=${user}`,
      icon: '❓'
    };
  };

  const message = getMessage();

  // Manejo de errores del componente
  if (componentError) {
    return (
      <div className="admin-approval-container">
        <BackgroundRainParticles density={110} speed={0.9} />
        <div className="admin-approval-form">
          <div className="message-card error">
            <div className="status-icon">❌</div>
            <h2>Error del Componente</h2>
            <p className="status-message">{componentError}</p>
            <div className="action-buttons">
              <button 
                onClick={() => window.location.reload()}
                className="primary-button"
              >
                Recargar Página
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="secondary-button"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-approval-container">
        <BackgroundRainParticles density={110} speed={0.9} />
        <div className="admin-approval-form">
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Procesando acción...</h2>
            <p>Por favor espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-approval-container">
      <BackgroundRainParticles density={110} speed={0.9} />
      <div className="admin-approval-form">
        <div className={`message-card ${message.type}`}>
          <div className="title-container">
            <div className="status-icon">{message.icon}</div>
            <h2>{message.title}</h2>
          </div>
          <p className="status-message">{message.message}</p>
          
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/dashboard')}
              className="primary-button"
            >
              Ir al Panel de Administración
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="secondary-button"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApproval;


