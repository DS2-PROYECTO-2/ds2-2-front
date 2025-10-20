import CustomSelect from './CustomSelect';
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { useSecurity } from '../../hooks/useSecurity';
import { usePassiveUpdates } from '../../hooks/usePassiveUpdates';
import userManagementService from '../../services/userManagementService';
import roomService from '../../services/roomService';
import '../../styles/TurnComparisonTable.css';
import '../../styles/TurnComparisonFilters.css';

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
    
    // Establecer año actual por defecto para mostrar datos recientes
    setSelectedYear(String(currentYear));
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
      } catch {
        // Error loading filter options
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
      // Calcular fechas basadas en filtros de año y mes
      let fromDate, toDate;
      
      if (selectedYear && selectedMonth) {
        // Si se seleccionó año y mes específicos
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        fromDate = firstDay.toISOString().split('T')[0];
        toDate = lastDay.toISOString().split('T')[0];
      } else if (selectedYear) {
        // Si solo se seleccionó año
        const year = parseInt(selectedYear);
        fromDate = `${year}-01-01`;
        toDate = `${year}-12-31`;
      } else if (dateFrom && dateTo) {
        // Si se configuraron fechas manuales
        fromDate = dateFrom;
        toDate = dateTo;
      } else {
        // Por defecto, mes actual
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fromDate = firstDayOfMonth.toISOString().split('T')[0];
        toDate = lastDayOfMonth.toISOString().split('T')[0];
      }
      
      const params = new URLSearchParams({
        date_from: fromDate,
        date_to: toDate
      });

      // Agregar filtros adicionales
      if (selectedUser) params.append('user_id', selectedUser);
      if (selectedRoom) params.append('room_id', selectedRoom);
      if (showAll) params.append('show_all', 'true');
      
      // Limitar registros por defecto a 20, mostrar todos solo con filtros o showAll
      if (showAll || selectedUser || selectedRoom || (selectedYear && selectedMonth)) {
        // Mostrar todos los registros cuando hay filtros activos
        params.append('page_size', '10000');
        params.append('page', '1');
      } else {
        // Limitar a 20 registros por defecto
        params.append('page_size', '20');
        params.append('page', '1');
      }

      const response = await apiClient.get(`/api/rooms/reports/turn-comparison/?${params.toString()}`) as TurnComparisonResponse;
      
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

  // Cargar datos del mes actual por defecto (sin activar filtros visualmente)
  useEffect(() => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
    
    // Cargar datos del año actual internamente sin establecer los estados de filtro
    const loadCurrentYearData = async () => {
      setLoading(true);
      setError(null);

      try {
        const fromDate = firstDayOfYear.toISOString().split('T')[0];
        const toDate = lastDayOfYear.toISOString().split('T')[0];
        
        const params = new URLSearchParams({
          date_from: fromDate,
          date_to: toDate
        });

        const response = await apiClient.get(`/api/rooms/reports/turn-comparison/?${params.toString()}`) as TurnComparisonResponse;
        
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
        
        setData([]);
        setSummary({
          on_time: 0,
          early: 0,
          late: 0,
          no_registration: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadCurrentYearData();
  }, []);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {

    const loadDataWithFilters = async () => {
      setIsUpdating(true);
      setError(null);

      try {
        // Calcular fechas basadas en filtros de año y mes
        let fromDate, toDate;
        
        if (selectedYear && selectedMonth) {
          // Si se seleccionó año y mes específicos
          const year = parseInt(selectedYear);
          const month = parseInt(selectedMonth);
          const firstDay = new Date(year, month - 1, 1);
          const lastDay = new Date(year, month, 0);
          fromDate = firstDay.toISOString().split('T')[0];
          toDate = lastDay.toISOString().split('T')[0];
        } else if (selectedYear) {
          // Si solo se seleccionó año
          const year = parseInt(selectedYear);
          fromDate = `${year}-01-01`;
          toDate = `${year}-12-31`;
        } else if (dateFrom && dateTo) {
          // Si se configuraron fechas manuales
          fromDate = dateFrom;
          toDate = dateTo;
        } else {
          // Por defecto, mes actual
          const today = new Date();
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          fromDate = firstDayOfMonth.toISOString().split('T')[0];
          toDate = lastDayOfMonth.toISOString().split('T')[0];
        }
        
        const params = new URLSearchParams({
          date_from: fromDate,
          date_to: toDate
        });

        // Agregar filtros adicionales
        if (selectedUser) params.append('user_id', selectedUser);
        if (selectedRoom) params.append('room_id', selectedRoom);
        if (showAll) params.append('show_all', 'true');

        const response = await apiClient.get(`/api/rooms/reports/turn-comparison/?${params.toString()}`) as TurnComparisonResponse;
        
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
        
        setData([]);
        setSummary({
          on_time: 0,
          early: 0,
          late: 0,
          no_registration: 0
        });
      } finally {
        setIsUpdating(false);
      }
    };

    // Ejecutar siempre que haya algún cambio en los filtros
    loadDataWithFilters();
  }, [selectedUser, selectedRoom, selectedYear, selectedMonth, showAll, dateFrom, dateTo]);

  // Actualizaciones pasivas inteligentes
  usePassiveUpdates({
    minUpdateInterval: 120000, // 2 minutos mínimo entre actualizaciones
    inactivityThreshold: 20000, // 20 segundos de inactividad
    enableVisibilityUpdates: true,
    enableFocusUpdates: false,
    onUpdate: loadComparisonData
  });

  // Actualizaciones en tiempo real (solo eventos críticos)
  useEffect(() => {
    const reloadData = async () => {
      try {
        // Calcular fechas basadas en filtros de año y mes
        let fromDate, toDate;
        
        if (selectedYear && selectedMonth) {
          // Si se seleccionó año y mes específicos
          const year = parseInt(selectedYear);
          const month = parseInt(selectedMonth);
          const firstDay = new Date(year, month - 1, 1);
          const lastDay = new Date(year, month, 0);
          fromDate = firstDay.toISOString().split('T')[0];
          toDate = lastDay.toISOString().split('T')[0];
        } else if (selectedYear) {
          // Si solo se seleccionó año
          const year = parseInt(selectedYear);
          fromDate = `${year}-01-01`;
          toDate = `${year}-12-31`;
        } else if (dateFrom && dateTo) {
          // Si se configuraron fechas manuales
          fromDate = dateFrom;
          toDate = dateTo;
        } else {
          // Por defecto, mes actual
          const today = new Date();
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          fromDate = firstDayOfMonth.toISOString().split('T')[0];
          toDate = lastDayOfMonth.toISOString().split('T')[0];
        }
        
        const params = new URLSearchParams({
          date_from: fromDate,
          date_to: toDate
        });

        if (selectedUser) params.append('user_id', selectedUser);
        if (selectedRoom) params.append('room_id', selectedRoom);
        if (showAll) params.append('show_all', 'true');

        const response = await apiClient.get(`/api/rooms/reports/turn-comparison/?${params.toString()}`) as TurnComparisonResponse;
        setData(response.comparaciones || []);
        
        const comparaciones = response.comparaciones || [];
        const summary = {
          on_time: comparaciones.filter(c => c.estado === 'A_TIEMPO').length,
          early: comparaciones.filter(c => c.estado === 'SOBRE_LA_HORA').length,
          late: comparaciones.filter(c => c.estado === 'TARDE').length,
          no_registration: comparaciones.filter(c => c.estado === 'SIN_REGISTRO').length
        };
        setSummary(summary);
      } catch {
        // Error reloading data
      }
    };

    const handleScheduleUpdate = () => {
      reloadData();
    };

    const handleRoomEntryUpdate = () => {
      reloadData();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'schedule-event' || e.key === 'room-entry-updated' || e.key === 'turn-comparison-updated') {
        reloadData();
      }
    };

    // Solo listeners para eventos críticos
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    window.addEventListener('room-entry-updated', handleRoomEntryUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('schedule-updated', handleScheduleUpdate);
      window.removeEventListener('room-entry-updated', handleRoomEntryUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadComparisonData, dateFrom, dateTo, selectedUser, selectedRoom, selectedYear, selectedMonth, showAll]);


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

  const clearAllFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedUser('');
    setSelectedRoom('');
    setSelectedYear('');
    setSelectedMonth('');
    setShowAll(false);
    setShowAllRecords(false);
    
    // Recargar datos del mes actual después de limpiar filtros
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const loadCurrentMonthData = async () => {
      setLoading(true);
      setError(null);

      try {
        const fromDate = firstDayOfMonth.toISOString().split('T')[0];
        const toDate = lastDayOfMonth.toISOString().split('T')[0];
        
        const params = new URLSearchParams({
          date_from: fromDate,
          date_to: toDate
        });

        const response = await apiClient.get(`/api/rooms/reports/turn-comparison/?${params.toString()}`) as TurnComparisonResponse;
        
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
        
        setData([]);
        setSummary({
          on_time: 0,
          early: 0,
          late: 0,
          no_registration: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadCurrentMonthData();
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
      </div>
      
      {/* Filtros de Comparación */}
      <div className="turn-comparison-filters-container">
        <div className="turn-comparison-filters">
          <div className="turn-comparison-filters-row">
            <div className="turn-comparison-filter-group">
              <label className="turn-comparison-filter-label">Desde:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="turn-comparison-input"
              />
            </div>
            <div className="turn-comparison-filter-group">
              <label className="turn-comparison-filter-label">Hasta:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="turn-comparison-input"
              />
            </div>
            <div className="turn-comparison-filter-group">
              <label className="turn-comparison-filter-label">Sala:</label>
              <CustomSelect<string>
                value={selectedRoom ?? ''}
                placeholder="Todas las salas"
                options={rooms.map(r => ({ value: String(r.id), label: r.name }))}
                onChange={(val) => setSelectedRoom(val ?? '')}
              />
            </div>
          </div>
          
          <div className="turn-comparison-filters-row">
            <div className="turn-comparison-filter-group">
              <label className="turn-comparison-filter-label">Año:</label>
              <CustomSelect<string>
                value={selectedYear ?? ''}
                placeholder="Todos los años"
                options={years.map(y => ({ value: String(y), label: String(y) }))}
                onChange={(val) => { setSelectedYear(val ?? ''); setSelectedMonth(''); }}
              />
            </div>
            <div className="turn-comparison-filter-group">
              <label className="turn-comparison-filter-label">Mes:</label>
              <CustomSelect<string>
                value={selectedMonth ?? ''}
                placeholder="Todos los meses"
                options={months.map(m => ({ value: String(m.value), label: m.label }))}
                onChange={(val) => setSelectedMonth(val ?? '')}
                className={!selectedYear ? 'cs-disabled' : ''}
              />
            </div>
            <div className="turn-comparison-filter-group">
              <label className="turn-comparison-filter-label">Usuario:</label>
              <CustomSelect<string>
                value={selectedUser ?? ''}
                placeholder="Todos los usuarios"
                options={users.map(u => ({ value: String(u.id), label: `${u.full_name} (${u.username})` }))}
                onChange={(val) => setSelectedUser(val ?? '')}
              />
            </div>
          </div>
          
          <div className="turn-comparison-filters-row">
            <div className="turn-comparison-filter-group">
              <label className="turn-comparison-filter-label">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="turn-comparison-checkbox"
                  id="showAllCheckbox"
                />
                <span className="turn-comparison-checkbox-label">
                  Mostrar todos los registros
                </span>
              </label>
            </div>
          </div>
          
          <div className="turn-comparison-actions">
            <button
              onClick={clearAllFilters}
              className="turn-comparison-btn turn-comparison-btn--clear"
              type="button"
            >
              🗑️ Borrar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Información sobre filtros */}
      {data.length === 0 && !loading && !error && (
        <div className="turn-comparison-warning-top">
          💡 <strong>Consejo:</strong> Si no ves datos, intenta:
          <br />• Usar el botón "📊 Cargar Todos los Datos" para ver todos los registros
          <br />• Ajustar los filtros de fecha (año/mes) o usar fechas específicas
          <br />• Verificar que existan turnos y registros en el sistema
        </div>
      )}

      {/* Botón para mostrar todos los registros */}
      {data.length > 20 && (
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          {!showAllRecords && (
            <button 
              onClick={() => setShowAllRecords(true)}
              className="turn-comparison-btn turn-comparison-btn--primary"
            >
              📋 Mostrar todos los registros ({data.length} total)
            </button>
          )}
          {showAllRecords && (
            <button 
              onClick={() => setShowAllRecords(false)}
              className="turn-comparison-btn turn-comparison-btn--secondary"
            >
              📋 Mostrar solo 20 registros
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
          <table className="turn-comparison-table">
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
                (showAllRecords ? data : data.slice(0, 20)).map((item, index) => (
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
                          +{item.diferencia} min 
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
