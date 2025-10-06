import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { fetchRooms, type Room } from '../../services/roomService';
import { getMyEntries, getAllEntries, type RoomEntryUI } from '../../services/roomEntryService';
import { useAuth } from '../../hooks/useAuth';

type Props = { reloadKey?: number };
type DateISO = string;

const RoomHistory: React.FC<Props> = ({ reloadKey }) => {
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

  // Debug: Log cuando cambie isRefreshing
  useEffect(() => {
    console.log('🎬 RoomHistory: isRefreshing cambió:', isRefreshing);
  }, [isRefreshing]);

  const parseErr = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : 'Error al cargar historial');

  const clearFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterRoomId('');
    setFilterUser('');
    setFilterDocument('');
  };


  // Función para cargar datos básicos (sin filtros)
  const load = useCallback(async (showRefreshAnimation = false) => {
    console.log('🔄 RoomHistory: Cargando datos...', { showRefreshAnimation });
    if (showRefreshAnimation) {
      console.log('🎬 RoomHistory: Activando animación de actualización');
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [roomsData, entriesData] = await Promise.all([
        fetchRooms(),
        user?.role === 'admin' 
          ? getAllEntries()  // Admin ve todos sin filtros
          : getMyEntries()    // Monitor ve solo los suyos
      ]);
      
      console.log('📊 RoomHistory: Datos cargados:', { 
        rooms: roomsData.length, 
        entries: entriesData.length 
      });
      
      setRooms(roomsData);
      setEntries(entriesData);
    } catch (err) {
      setError(parseErr(err));
    } finally {
      setLoading(false);
      if (showRefreshAnimation) {
        console.log('🎬 RoomHistory: Desactivando animación en 1 segundo');
        // Mantener la animación por un momento para que se vea
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    }
  }, [user?.role]);

  // Función para cargar con filtros (solo para admin)
  const loadWithFilters = useCallback(async () => {
    if (user?.role !== 'admin') return;
    
    setLoading(true);
    setError(null);
    try {
      // Formatear fechas para el backend con zona horaria UTC
      let fromFormatted: string | undefined = undefined;
      let toFormatted: string | undefined = undefined;
      
      if (filterFrom) {
        const [year, month, day] = filterFrom.split('-').map(Number);
        const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        fromFormatted = fromDate.toISOString();
      }
      
      if (filterTo) {
        const [year, month, day] = filterTo.split('-').map(Number);
        const toDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        toFormatted = toDate.toISOString();
      }
      
      const [roomsData, entriesData] = await Promise.all([
        fetchRooms(),
        getAllEntries({
          // No enviar filtro de usuario al backend, se maneja en frontend
          room: filterRoomId || undefined,
          from: fromFormatted,
          to: toFormatted,
          document: filterDocument || undefined
        })
      ]);
      
      setRooms(roomsData);
      setEntries(entriesData);
    } catch (err) {
      setError(parseErr(err));
    } finally {
      setLoading(false);
    }
  }, [user?.role, filterRoomId, filterFrom, filterTo, filterDocument]);

  useEffect(() => { 
    if (user) {  // Solo cargar si hay usuario autenticado
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
    // Registrar listeners de eventos de sala
    
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
    
    // Listeners registrados
    
    return () => {
      window.removeEventListener('room-entry-added', handleRoomEntry);
      window.removeEventListener('room-entry-exited', handleRoomExit);
    };
  }, [load]);

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
    if (user?.role === 'admin') {
      loadWithFilters();
    }
  }, [filterRoomId, filterFrom, filterTo, filterDocument, loadWithFilters, user?.role]);

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
      const t = setTimeout(() => setHighlightedEntryId(null), 1200);
      return () => clearTimeout(t);
    }
  }, [highlightedEntryId]);

  // Filtro local para todos los usuarios (backend + frontend para mejor compatibilidad)
  const filtered = useMemo(() => {
    let filteredEntries = entries;
    
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
    
    // Aplicar filtros de fecha
    if (filterFrom || filterTo) {
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
          // La entrada debe empezar antes del final del rango Y terminar después del inicio del rango
          return startDate <= to && (endDate >= from || !e.endedAt);
        } else if (from) {
          // La entrada debe terminar después del inicio del rango (o estar activa)
          return endDate >= from || !e.endedAt;
        } else if (to) {
          // La entrada debe empezar antes del final del rango
          return startDate <= to;
        }
        return true;
      });
    }
    
    return filteredEntries;
  }, [entries, filterFrom, filterTo, filterRoomId, filterUser, filterDocument]);

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
        <button className="primary-btn" onClick={clearFilters}>Borrar filtros</button>
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

      <div className="panel-table">
        <div className="table-scroll">
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