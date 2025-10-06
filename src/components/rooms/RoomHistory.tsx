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

  const parseErr = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : 'Error al cargar historial');

  const clearFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterRoomId('');
    setFilterUser('');
    setFilterDocument('');
  };


  // src/components/rooms/RoomHistory.tsx - MODIFICAR la función load()
const load = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const [roomsData, entriesData] = await Promise.all([
      fetchRooms(),
      user?.role === 'admin' 
        ? getAllEntries()  // Admin ve todos sin filtros del backend
        : getMyEntries()    // Monitor ve solo los suyos
    ]);
    
    setRooms(roomsData);
    setEntries(entriesData);
  } catch (err) {
    setError(parseErr(err));
  } finally {
    setLoading(false);
  }
  }, [user?.role]);

  useEffect(() => { 
    if (user) {  // Solo cargar si hay usuario autenticado
      load(); 
    }
  }, [reloadKey, user, load]); // Solo recargar cuando cambie el reloadKey o el usuario

  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail || {};
      if (typeof id === 'number') setHighlightedEntryId(id);
    };
    window.addEventListener('room-entry-added', handler as EventListener);
    return () => window.removeEventListener('room-entry-added', handler as EventListener);
  }, [user?.role]);

  const filtered = useMemo(() => {
    let from: Date | null = null, to: Date | null = null;
    if (filterFrom) { 
      // Crear fecha en zona horaria local para evitar problemas de UTC
      const [year, month, day] = filterFrom.split('-').map(Number);
      from = new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    if (filterTo) { 
      // Crear fecha en zona horaria local para evitar problemas de UTC
      const [year, month, day] = filterTo.split('-').map(Number);
      to = new Date(year, month - 1, day, 23, 59, 59, 999);
    }

    return entries.filter(e => {
      const startDate = new Date(e.startedAt);
      const endDate = e.endedAt ? new Date(e.endedAt) : null;
      
      
      // Una entrada está en el rango si:
      // 1. Comenzó dentro del rango, O
      // 2. Terminó dentro del rango, O  
      // 3. Abarca todo el rango (comenzó antes y terminó después)
      let inRange = false;
      
      if (!from && !to) {
        // Sin filtros de fecha
        inRange = true;
      } else {
        // Verificar si la entrada intersecta con el rango de fechas
        const entryStart = startDate;
        const entryEnd = endDate || new Date(); // Si no hay fecha de fin, usar fecha actual
        
        if (from && to) {
          // Rango completo: la entrada debe intersectar con [from, to]
          inRange = (entryStart <= to && entryEnd >= from);
        } else if (from) {
          // Solo fecha desde: la entrada debe terminar después de 'from'
          inRange = entryEnd >= from;
        } else if (to) {
          // Solo fecha hasta: la entrada debe comenzar antes de 'to'
          inRange = entryStart <= to;
        }
      }
      
      const roomOk = filterRoomId === '' ? true : e.roomId === filterRoomId;
      
      // Filtros adicionales para admin
      const userOk = !filterUser || 
        (e.userName && e.userName.toLowerCase().includes(filterUser.toLowerCase())) ||
        (e.userUsername && e.userUsername.toLowerCase().includes(filterUser.toLowerCase()));
      
      const documentOk = !filterDocument || 
        (e.userDocument && e.userDocument.includes(filterDocument));
      
      return inRange && roomOk && userOk && documentOk;
    });
  }, [entries, filterFrom, filterTo, filterRoomId, filterUser, filterDocument]);

  return (
    <div className="room-panel">
      {error && <div className="alert error" role="alert">{error}</div>}
      <h3 className="panel-title">Historial de entradas y salidas</h3>

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
                type="number" 
                className="input" 
                placeholder="Número de documento"
                value={filterDocument} 
                onChange={(e) => setFilterDocument(e.target.value)} 
              />
            </label>
          </>
        )}
        <button className="primary-btn" onClick={clearFilters}>Borrar filtros</button>
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
                  <td>{si.toLocaleDateString()}</td>
                  <td>{si.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{sf ? sf.toLocaleDateString() : '-'}</td>
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