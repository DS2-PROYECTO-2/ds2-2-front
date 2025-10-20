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

  // Función para cargar con rango por defecto (últimos 3 meses para tener más datos)
  const loadWithDefaultRange = useCallback(async () => {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Usar formato local sin conversión UTC
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const fromFormatted = formatDate(threeMonthsAgo);
    const toFormatted = formatDate(lastDayOfMonth);
    
    // Obtener todos los registros y limitar en el frontend a 20
    const allEntries = await getAllEntriesUnpaginated({
      from: fromFormatted,
      to: toFormatted
    });
    
    // Limitar a los primeros 20 registros
    return allEntries.slice(0, 20);
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
      let entriesData;
      
      if (user?.role === 'admin') {
        // Admin con rango por defecto limitado a 20
        entriesData = await loadWithDefaultRange();
      } else {
        // Monitor: obtener sus entradas y limitar a 20
        const allMyEntries = await getMyEntries();
        entriesData = allMyEntries.slice(0, 20);
      }
      
      const roomsData = await roomService.getRooms();
      
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
      // Solo aplicar filtros si NO estamos en modo "mostrar todo"
      loadWithFilters();
    }
  }, [filterRoomId, filterFrom, filterTo, filterDocument, loadWithFilters, user?.role, showAll]);

  // Manejar cuando se activa "mostrar todo"
  useEffect(() => {
    if (showAll) {
      setLoading(true);
      setError(null);
      const loadAllEntries = async () => {
        try {
          let entriesData;
          
          if (user?.role === 'admin') {
            // Admin: mostrar todos los registros con filtros
            entriesData = await getAllEntriesUnpaginated({
              from: filterFrom || undefined,
              to: filterTo || undefined,
              room: filterRoomId || undefined,
              document: filterDocument || undefined
            });
          } else {
            // Monitor: mostrar todas sus entradas
            entriesData = await getMyEntries();
          }
          
          const roomsData = await roomService.getRooms();
          
          setRooms(roomsData);
          setEntries(entriesData);
          setBackendFiltered(true);
        } catch (err) {
          setError(parseErr(err));
        } finally {
          setLoading(false);
        }
      };
      
      loadAllEntries();
    }
  }, [user?.role, showAll, filterFrom, filterTo, filterRoomId, filterDocument]);

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
  }, [entries, filterFrom, filterTo, filterRoomId, filterUser, filterDocument, backendFiltered]);

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
              📋 Mostrar solo 10 registros
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
            `📅 Mostrando registros de los últimos 3 meses (${entries.length} total, ${filtered.length} filtrados)`
          )}
        </div>
      )}

      {/* Mensaje de diagnóstico cuando no hay registros */}
      {filtered.length === 0 && entries.length > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          ⚠️ <strong>Diagnóstico:</strong> Hay {entries.length} registros cargados, pero los filtros no muestran resultados.
          <br />• Verifica que los filtros de fecha, sala, usuario o documento sean correctos
          <br />• Intenta limpiar los filtros con el botón "Limpiar filtros"
        </div>
      )}

      <div className="panel-table">
        <div 
          className="table-scroll"
          style={{
            maxHeight: showAll ? '400px' : 'none',
            overflowY: showAll ? 'auto' : 'visible'
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

      {/* Mostrar información del total de registros */}
      {filtered.length > 0 && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div style={{
            background: '#f0f9ff',
            color: '#0369a1',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #bae6fd',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            📊 Mostrando {filtered.length} registros de entrada y salida
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomHistory;