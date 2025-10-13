import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { useSecurity } from '../../hooks/useSecurity';
import userManagementService from '../../services/userManagementService';
import roomService from '../../services/roomService';
import './TurnComparisonTable.css';

interface TurnComparisonData {
  id?: number;
  usuario: string;
  sala: string;
  turno: string;
  registro: string;
  estado: string;
  diferencia: number;
  fecha: string;
  notas?: string;
}

interface TurnComparisonResponse {
  comparaciones: TurnComparisonData[];
  total_registros: number;
  filters_applied: {
    date_from: string;
    date_to: string;
    user_id: string;
    room_id: string;
  };
}

interface TurnComparisonSummary {
  on_time: number;
  early: number;
  late: number;
  no_registration: number;
}

const TurnComparisonTable: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useSecurity();
  
  const [data, setData] = useState<TurnComparisonData[]>([]);
  const [summary, setSummary] = useState<TurnComparisonSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showAll, setShowAll] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  
  // Opciones para filtros
  const [users, setUsers] = useState<Array<{id: number, username: string, full_name: string}>>([]);
  const [rooms, setRooms] = useState<Array<{id: number, name: string}>>([]);
  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<Array<{value: number, label: string}>>([]);

  // Inicializar opciones de filtros (sin valores por defecto)
  useEffect(() => {
    // Generar años (últimos 3 años)
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear]);
    
    // Generar meses
    const monthOptions = [
      {value: 1, label: 'Enero'}, {value: 2, label: 'Febrero'}, {value: 3, label: 'Marzo'},
      {value: 4, label: 'Abril'}, {value: 5, label: 'Mayo'}, {value: 6, label: 'Junio'},
      {value: 7, label: 'Julio'}, {value: 8, label: 'Agosto'}, {value: 9, label: 'Septiembre'},
      {value: 10, label: 'Octubre'}, {value: 11, label: 'Noviembre'}, {value: 12, label: 'Diciembre'}
    ];
    setMonths(monthOptions);
  }, []);

  // Cargar usuarios y salas
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Cargar usuarios
        const usersData = await userManagementService.getUsers();
        setUsers(usersData || []);
        
        // Cargar salas
        const roomsData = await roomService.getRooms();
        setRooms(roomsData || []);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    
    loadFilterOptions();
  }, []);

  const loadComparisonData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsUpdating(true);
    }
    setError(null);

    try {
      // Usar fechas por defecto si no están establecidas
      const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = dateTo || new Date().toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        date_from: fromDate,
        date_to: toDate
      });

      // Agregar filtros adicionales
      if (selectedUser) params.append('user_id', selectedUser);
      if (selectedRoom) params.append('room_id', selectedRoom);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedMonth) params.append('month', selectedMonth);
      if (showAll) params.append('show_all', 'true');

      console.log('🔍 Cargando datos de comparación con parámetros:', params.toString());
      console.log('📋 Parámetros individuales:', {
        date_from: fromDate,
        date_to: toDate,
        user_id: selectedUser,
        room_id: selectedRoom,
        year: selectedYear,
        month: selectedMonth,
        show_all: showAll
      });
      const response = await apiClient.get(`/api/rooms/reports/turn-comparison/?${params.toString()}`) as TurnComparisonResponse;
      
      console.log('📊 Respuesta del backend:', response);
      setData(response.comparaciones || []);
      
      // Calcular resumen desde los datos
      const comparaciones = response.comparaciones || [];
      const summary = {
        on_time: comparaciones.filter(c => c.estado === 'A_TIEMPO').length,
        early: comparaciones.filter(c => c.estado === 'SOBRE_LA_HORA').length,
        late: comparaciones.filter(c => c.estado === 'TARDE').length,
        no_registration: comparaciones.filter(c => c.estado === 'SIN_REGISTRO').length
      };
      setSummary(summary);
    } catch (err: unknown) {
      console.error('Error loading turn comparison data:', err);
      
      // Manejar diferentes tipos de errores
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as { status?: number };
        if (apiError.status === 500) {
          setError('El endpoint de comparación de turnos no está disponible. Contacta al administrador para habilitar esta funcionalidad.');
        } else if (apiError.status === 404) {
          setError('La funcionalidad de comparación de turnos no está implementada en el backend.');
        } else {
          setError('Error al cargar los datos de comparación de turnos. Verifica tu conexión.');
        }
      } else {
        setError('Error al cargar los datos de comparación de turnos. Verifica tu conexión.');
      }
      
      // Mostrar datos de ejemplo para desarrollo
      setData([]);
      setSummary({
        on_time: 0,
        early: 0,
        late: 0,
        no_registration: 0
      });
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [dateFrom, dateTo, selectedUser, selectedRoom, selectedYear, selectedMonth, showAll]);

  // Cargar datos automáticamente al montar el componente (últimos 30 días)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    
    // Cargar datos automáticamente con el rango de 30 días
    loadComparisonData(true);
  }, [loadComparisonData]);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (dateFrom && dateTo) {
      console.log('🔄 Filtros cambiados, recargando datos:', {
        selectedUser,
        selectedRoom,
        selectedYear,
        selectedMonth,
        showAll
      });
      loadComparisonData(false);
    }
  }, [selectedUser, selectedRoom, selectedYear, selectedMonth, showAll, loadComparisonData, dateFrom, dateTo]);

  // Actualizaciones en tiempo real
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadComparisonData(false);
      }
    };

    const handleWindowFocus = () => loadComparisonData(false);

    const handleScheduleUpdate = () => {
      loadComparisonData(false);
    };

    const handleRoomEntryUpdate = () => {
      loadComparisonData(false);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'schedule-event' || e.key === 'room-entry-updated' || e.key === 'turn-comparison-updated') {
        // Evento disparado desde otras pestañas/ventanas
        loadComparisonData(false);
      }
    };

    // Listeners para actualizaciones automáticas
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    window.addEventListener('room-entry-updated', handleRoomEntryUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('schedule-updated', handleScheduleUpdate);
      window.removeEventListener('room-entry-updated', handleRoomEntryUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadComparisonData]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A_TIEMPO':
        return 'status-on-time';
      case 'SOBRE_LA_HORA':
        return 'status-early';
      case 'TARDE':
        return 'status-late';
      case 'SIN_REGISTRO':
        return 'status-no-registration';
      default:
        return 'status-unknown';
    }
  };


  const formatStatusText = (status: string) => {
    console.log('🔍 Formateando estado:', status);
    switch (status) {
      case 'A_TIEMPO':
        return 'A Tiempo';
      case 'SOBRE_LA_HORA':
        return 'Sobre La Hora';
      case 'TARDE':
        return 'Tarde';
      case 'SIN_REGISTRO':
        return 'Sin Registro';
      default:
        return status;
    }
  };

  // Verificar permisos - solo administradores pueden ver esta tabla
  // Los monitores no ven absolutamente nada
  if (!user || user.role !== 'admin' || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="turn-comparison-container">
        <div className="loading">Cargando comparación de turnos...</div>
      </div>
    );
  }

  return (
    <div className="turn-comparison-container">
      <div className="turn-comparison-header">
        <h3>📊 Comparación de Turnos vs Registros</h3>
        
        <div className="filters-container">
          <div className="filters-row">
            <div className="filter-group">
              <label>Desde:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="filter-group">
              <label>Hasta:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="filter-group">
              <label>Usuario:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los usuarios</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Sala:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="filter-select"
              >
                <option value="">Todas las salas</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filters-row">
            <div className="filter-group">
              <label>Año:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los años</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Mes:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los meses</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group checkbox-group">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="checkbox-input"
                id="showAllCheckbox"
              />
              <label htmlFor="showAllCheckbox" className="checkbox-label">
                Mostrar todos los registros
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Botón para mostrar todos los registros */}
      {data.length > 10 && (
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          {!showAllRecords && (
            <button 
              onClick={() => setShowAllRecords(true)}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              📋 Mostrar todos los registros ({data.length} total)
            </button>
          )}
          {showAllRecords && (
            <button 
              onClick={() => setShowAllRecords(false)}
              style={{
                background: '#ff9800',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              📋 Mostrar solo 10 registros
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
            Esta funcionalidad requiere que el backend tenga implementado el endpoint de comparación de turnos.
          </div>
        </div>
      )}

      {/* Indicador de actualización */}
      {isUpdating && (
        <div className="updating-indicator">
          <div className="updating-spinner"></div>
          <span>Actualizando datos...</span>
        </div>
      )}

      {summary && (
        <div className="summary-cards">
          <div className="summary-card on-time">
            <div className="summary-number">{summary.on_time}</div>
            <div className="summary-label">A Tiempo</div>
          </div>
          <div className="summary-card early">
            <div className="summary-number">{summary.early}</div>
            <div className="summary-label">Sobre la Hora</div>
          </div>
          <div className="summary-card late">
            <div className="summary-number">{summary.late}</div>
            <div className="summary-label">Tarde</div>
          </div>
          <div className="summary-card no-registration">
            <div className="summary-number">{summary.no_registration}</div>
            <div className="summary-label">Sin Registro</div>
          </div>
        </div>
      )}

      <div className="turn-comparison-table">
        <div 
          className="table-scroll"
          style={{
            maxHeight: showAllRecords ? '400px' : 'none',
            overflowY: showAllRecords ? 'auto' : 'visible'
          }}
        >
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Monitor</th>
                <th>Sala</th>
                <th>Turno Asignado</th>
                <th>Registro Real</th>
                <th>Estado</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">
                    {error ? 
                      'No se pueden cargar los datos de comparación. Verifica que el backend esté configurado correctamente.' :
                      'No hay datos de comparación para el período seleccionado. Intenta ajustar los filtros o el rango de fechas.'
                    }
                  </td>
                </tr>
              ) : (
                (showAllRecords ? data : data.slice(0, 10)).map((item, index) => (
                  <tr key={item.id || index} className="comparison-row">
                    <td className="user-cell">{item.usuario}</td>
                    <td className="room-cell">{item.sala}</td>
                    <td className="assigned-cell">
                      <div className="time-range">
                        <div className="start-time">
                          <strong>Turno:</strong> {item.turno}
                        </div>
                        <div className="date-time">
                          <strong>Fecha:</strong> {item.fecha}
                        </div>
                      </div>
                    </td>
                    <td className="actual-cell">
                      <div className="time-range">
                        <div className="start-time">
                          <strong>Registro:</strong> {item.registro}
                        </div>
                        {item.notas && (
                          <div className="notes">
                            <strong>Notas:</strong> {item.notas}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${getStatusColor(item.estado)}`}>
                        {formatStatusText(item.estado)}
                      </span>
                    </td>
                    <td className="difference-cell">
                      {item.estado === 'TARDE' && (
                        <span className="delay-text">
                          +{item.diferencia} min tarde
                        </span>
                      )}
                      {item.estado === 'SOBRE_LA_HORA' && (
                        <span className="early-text">
                          -{item.diferencia} min antes
                        </span>
                      )}
                      {item.estado === 'A_TIEMPO' && (
                        <span className="on-time-text">
                          Puntual
                        </span>
                      )}
                      {item.estado === 'SIN_REGISTRO' && (
                        <span className="no-registration-text">
                          Sin registro
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TurnComparisonTable;
