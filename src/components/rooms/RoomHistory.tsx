import React, { useEffect, useMemo, useState, useCallback } from 'react';
import roomService, { type Room } from '../../services/roomService';
import { getMyEntries, getAllEntriesUnpaginated, type RoomEntryUI } from '../../services/roomEntryService';
import { useAuth } from '../../hooks/useAuth';

type Props = { reloadKey?: number };
type DateISO = string;

const RoomHistory: React.FC<Props> = ({ reloadKey }) => {
  // Constantes para duraciones de animación
  const REFRESH_ANIMATION_DURATION = 1000; // ms - Duración de animación de actualización
  const HIGHLIGHT_DURATION = 1200; // ms - Duración del highlight de entrada

  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [entries, setEntries] = useState<RoomEntryUI[]>([]);
  const [filterFrom, setFilterFrom] = useState<DateISO>('');
  const [filterTo, setFilterTo] = useState<DateISO>('');
  const [filterRoomId, setFilterRoomId] = useState<number | ''>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterDocument, setFilterDocument] = useState<string>('');
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedEntryId, setHighlightedEntryId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAll, setShowAll] = useState<boolean>(false); // Nuevo estado para mostrar todo
  const [backendFiltered, setBackendFiltered] = useState<boolean>(false); // Indica si se aplicaron filtros en backend

  const parseErr = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : 'Error al cargar historial');

  const clearFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterRoomId('');
    setFilterUser('');
    setFilterDocument('');
    setShowAll(false);
    setBackendFiltered(false);
  };

  // Función para cargar con rango por defecto (todo el año actual)
  const loadWithDefaultRange = useCallback(async () => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
    
    // Usar formato local sin conversión UTC
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const fromFormatted = formatDate(firstDayOfYear);
    const toFormatted = formatDate(lastDayOfYear);
    
    return getAllEntriesUnpaginated({
      from: fromFormatted,
      to: toFormatted
    });
  }, []);

  // Función para cargar datos básicos (con rango por defecto para admin)
  const load = useCallback(async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [roomsData, entriesData] = await Promise.all([
        roomService.getRooms(),
        user?.role === 'admin' 
          ? loadWithDefaultRange()  // Admin con rango por defecto (todo el mes actual)
          : getMyEntries()          // Monitor ve solo los suyos
      ]);
      
      setRooms(roomsData);
      setEntries(entriesData);
      setBackendFiltered(false); // No se aplicaron filtros en backend
    } catch (err) {
      setError(parseErr(err));
    } finally {
      setLoading(false);
      if (showRefreshAnimation) {
        // Mantener la animación por un momento para que se vea
        setTimeout(() => setIsRefreshing(false), REFRESH_ANIMATION_DURATION);
      }
    }
  }, [user?.role, loadWithDefaultRange]);


  // Cargar todo el historial ignorando rango por defecto (útil para "Mostrar todo")
  const loadAllHistorical = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsData, entriesData] = await Promise.all([
        roomService.getRooms(),
        user?.role === 'admin' ? getAllEntriesUnpaginated({}) : getMyEntries()
      ]);
      setRooms(roomsData);
      setEntries(entriesData);
      setBackendFiltered(false);
    } catch (err) {
      setError(parseErr(err));
    } finally {
      setLoading(false);
    }
  }, [user?.role]);


  // Función para cargar con filtros (solo para admin)
  const loadWithFilters = useCallback(async () => {
    if (user?.role !== 'admin') return;
    
    setLoading(true);
    setError(null);
    try {
      // Usar formato simple YYYY-MM-DD como recomienda la nueva lógica
      const [roomsData, entriesData] = await Promise.all([
        roomService.getRooms(),
        getAllEntriesUnpaginated({
          // Usar formato simple YYYY-MM-DD
          from: filterFrom || undefined,
          to: filterTo || undefined,
          room: filterRoomId || undefined,
          document: filterDocument || undefined
        })
      ]);
      
      setRooms(roomsData);
      setEntries(entriesData);
      setShowAll(false); // Marcar que no estamos mostrando todo
      setBackendFiltered(true); // Marcar que se aplicaron filtros en backend
    } catch (err) {
      setError(parseErr(err));
    } finally {
      setLoading(false);
    }
  }, [user?.role, filterRoomId, filterFrom, filterTo, filterDocument]);


  useEffect(() => { 
    if (user) {  // Solo cargar si hay usuario autenticado
      // Limpiar filtros por defecto en primer render para evitar estados residuales
      setFilterFrom('');
      setFilterTo('');
      setFilterRoomId('');
      setFilterUser('');
      setFilterDocument('');
      setShowAll(false);
      setBackendFiltered(false);

      // Si es una actualización por reloadKey (admin), mostrar animación
      if (reloadKey && reloadKey > 0) {
        load(true); // true = mostrar animación de actualización
      } else {
        load(); // Carga inicial sin animación
      }
    }
  }, [reloadKey, load, user]); // Solo recargar cuando cambie el reloadKey o el usuario

  // Escuchar eventos de entrada/salida de salas para actualizar automáticamente (TODOS los usuarios)
  useEffect(() => {
    const handleRoomEntry = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { roomName, userName } = customEvent.detail || {};
      if (roomName && userName) {
        load(true); // true = mostrar animación de actualización
      }
    };

    const handleRoomExit = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { roomName, userName } = customEvent.detail || {};
      if (roomName && userName) {
        load(true); // true = mostrar animación de actualización
      }
    };

    window.addEventListener('room-entry-added', handleRoomEntry);
    window.addEventListener('room-entry-exited', handleRoomExit);
    
    return () => {
      window.removeEventListener('room-entry-added', handleRoomEntry);
      window.removeEventListener('room-entry-exited', handleRoomExit);
    };
  }, [load]);

  // Cuando el usuario selecciona "Mostrar todo", cargar todo el historial desde backend
  useEffect(() => {
    if (showAll) {
      loadAllHistorical();
    }
  }, [showAll, loadAllHistorical]);

  // Actualizaciones reactivas sin polling molesto
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        load(true);
      }
    };

    const handleWindowFocus = () => load(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'room-event') {
        // Evento disparado desde otras pestañas/ventanas
        load(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [load]);

  // Recargar cuando cambien los filtros (solo para admin)
  useEffect(() => {
    if (user?.role === 'admin' && !showAll) {
      const hasAnyFilter = Boolean(filterRoomId || filterFrom || filterTo || filterDocument);
      // Solo aplicar filtros si hay al menos un filtro activo; de lo contrario
      // mantener la carga por defecto (mes actual) y el límite local.
      if (hasAnyFilter) {
        loadWithFilters();
      } else {
        setBackendFiltered(false);
      }
    }
  }, [filterRoomId, filterFrom, filterTo, filterDocument, loadWithFilters, user?.role, showAll]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail || {};
      if (typeof id === 'number') setHighlightedEntryId(id);
    };
    window.addEventListener('room-entry-added', handler as EventListener);
    return () => window.removeEventListener('room-entry-added', handler as EventListener);
  }, []);

  // Quitar highlight después de animación
  useEffect(() => {
    if (highlightedEntryId !== null) {
      const t = setTimeout(() => setHighlightedEntryId(null), HIGHLIGHT_DURATION);
      return () => clearTimeout(t);
    }
  }, [highlightedEntryId]);

  // Límite por defecto para filas del historial
  const DEFAULT_HISTORY_LIMIT = 20;

  // Filtro local para todos los usuarios (backend + frontend para mejor compatibilidad)
  const filtered = useMemo(() => {
    let filteredEntries = entries;
    
    // Ordenar por fecha de inicio descendente para tomar los "últimos" registros
    filteredEntries = [...filteredEntries].sort((a, b) => {
      const ad = new Date(a.startedAt).getTime();
      const bd = new Date(b.startedAt).getTime();
      return bd - ad;
    });

    // Limitar a DEFAULT_HISTORY_LIMIT registros por defecto si no se está mostrando todo
    if (!showAll && !backendFiltered) {
      filteredEntries = filteredEntries.slice(0, DEFAULT_HISTORY_LIMIT);
    }
    
    // Aplicar filtro de sala
    if (filterRoomId) {
      filteredEntries = filteredEntries.filter(e => e.roomId === filterRoomId);
    }
    
    // Aplicar filtro de usuario (frontend para mejor compatibilidad con nombres completos)
    if (filterUser) {
      filteredEntries = filteredEntries.filter(e => {
        const userName = e.userName || e.userUsername || '';
        const searchTerm = filterUser.toLowerCase().trim();
        return userName.toLowerCase().includes(searchTerm);
      });
    }
    
    // Aplicar filtro de documento
    if (filterDocument) {
      filteredEntries = filteredEntries.filter(e => {
        const userDocument = e.userDocument || '';
        // Buscar que el documento del usuario contenga el filtro desde el inicio
        return userDocument.startsWith(filterDocument);
      });
    }
    
    // NOTA: Los filtros de fecha se aplican en el backend cuando se usa loadWithFilters()
    // Solo aplicar filtros de fecha en frontend cuando NO se han aplicado en el backend
    // (es decir, cuando se usa load() o loadAllEntries())
    if (!backendFiltered && (filterFrom || filterTo)) {
      let from: Date | null = null, to: Date | null = null;
      
      if (filterFrom) { 
        const [year, month, day] = filterFrom.split('-').map(Number);
        from = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      if (filterTo) { 
        const [year, month, day] = filterTo.split('-').map(Number);
        to = new Date(year, month - 1, day, 23, 59, 59, 999);
      }
      
      filteredEntries = filteredEntries.filter(e => {
        const startDate = new Date(e.startedAt);
        const endDate = e.endedAt ? new Date(e.endedAt) : new Date();
        
        if (from && to) {
          // La entrada debe tener alguna actividad dentro del rango
          return (startDate >= from && startDate <= to) || 
                 (endDate >= from && endDate <= to) || 
                 (startDate <= from && endDate >= to);
        } else if (from) {
          return endDate >= from || !e.endedAt;
        } else if (to) {
          return startDate <= to;
        }
        return true;
      });
    }
    
    return filteredEntries;
  }, [entries, filterFrom, filterTo, filterRoomId, filterUser, filterDocument, backendFiltered, showAll]);

  return (
    <div className="room-panel">
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="panel-header">
        <h3 className="panel-title">
          Historial de entradas y salidas
          {isRefreshing && (
            <span 
              className="refresh-indicator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginLeft: '1rem',
                fontSize: '0.875rem',
                color: '#ff0000',
                fontWeight: 'bold',
                background: '#fff3cd',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #ffc107'
              }}
            >
              <span 
                className="refresh-spinner"
                style={{
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite',
                  fontSize: '1rem'
                }}
              >
                ⟳
              </span>
              ACTUALIZANDO...
            </span>
          )}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="primary-btn" onClick={clearFilters}>Borrar filtros</button>
          {!showAll && (
            <button 
              className="secondary-btn" 
              onClick={() => setShowAll(true)}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              📋 Mostrar todo el historial
            </button>
          )}
          {showAll && (
            <button 
              className="secondary-btn" 
              onClick={() => setShowAll(false)}
              style={{
                background: '#ff9800',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              📋 Mostrar solo 20 registros
            </button>
          )}
        </div>
      </div>


      <div className="panel-filters">
        <label className="field">
          <span>Desde</span>
          <input type="date" className="input" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>Hasta</span>
          <input type="date" className="input" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </label>
        <label className="field">
          <span>Sala</span>
          <select
            className="select"
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Todas</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        {user?.role === 'admin' && (
          <>
            <label className="field">
              <span>Usuario</span>
              <input 
                type="text" 
                className="input" 
                placeholder="Nombre de usuario"
                value={filterUser} 
                onChange={(e) => setFilterUser(e.target.value)} 
              />
            </label>
            <label className="field">
              <span>Documento</span>
              <input 
                type="text" 
                className="input" 
                placeholder="Número de documento"
                value={filterDocument} 
                onChange={(e) => {
                  // Solo permitir números
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFilterDocument(value);
                }} 
              />
            </label>
          </>
        )}
      </div>

      {/* Indicador del rango de fechas mostrado */}
      {user?.role === 'admin' && (
        <div className="date-range-indicator" style={{
          padding: '0.5rem 1rem',
          background: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#2e7d32',
          fontWeight: '500'
        }}>
          {showAll ? (
            '📅 Mostrando TODOS los registros históricos'
          ) : filterFrom && filterTo ? (
            `📅 Mostrando registros del ${filterFrom} al ${filterTo}`
          ) : filterFrom ? (
            `📅 Mostrando registros desde el ${filterFrom}`
          ) : filterTo ? (
            `📅 Mostrando registros hasta el ${filterTo}`
          ) : (
            `📅 Mostrando registros del mes actual (${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})`
          )}
        </div>
      )}

      <div className="panel-table">
        <div 
          className="table-scroll"
          style={{
            maxHeight: showAll ? 'none' : '400px',
            overflowY: showAll ? 'visible' : 'auto'
          }}
        >
        <table className="table">
          <thead>
            <tr>
              {user?.role === 'admin' && (
                <>
                  <th>Monitor</th>
                  <th>Documento</th>
                </>
              )}
              <th>Fecha inicio</th>
              <th>Hora de ingreso</th>
              <th>Fecha fin</th>
              <th>Hora de salida</th>
              <th>Sala</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={user?.role === 'admin' ? 7 : 5} style={{ textAlign: 'center' }}>Sin registros</td></tr>
            ) : filtered.map(e => {
              const si = new Date(e.startedAt);
              const sf = e.endedAt ? new Date(e.endedAt) : null;
              return (
                <tr
                    key={e.id}
                    data-entry-id={e.id}
                    className={e.id === highlightedEntryId ? 'row-highlight' : undefined}
>
                  {user?.role === 'admin' && (
                    <>
                      <td>{e.userName ?? e.userUsername ?? '-'}</td>
                      <td>{e.userDocument ?? '-'}</td>
                    </>
                  )}
                  <td>{si.toLocaleDateString('es-ES')}</td>
                  <td>{si.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{sf ? sf.toLocaleDateString('es-ES') : '-'}</td>
                  <td>{sf ? sf.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td>{rooms.find(r => r.id === e.roomId)?.name ?? e.roomName ?? e.roomId}</td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomHistory;