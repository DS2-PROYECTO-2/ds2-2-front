import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchRooms, type Room } from '../../services/roomService';
import { createEntry, exitEntry, getMyActiveEntry } from '../../services/roomEntryService';
import { getMyEntries, type RoomEntryUI } from '../../services/roomEntryService';
// import { notificationService } from '../../services/notificationService'; // Removido para evitar notificaciones duplicadas

type Props = { onChanged?: () => void };

const RoomPanel: React.FC<Props> = ({ onChanged }) => {
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEntryRoomId, setActiveEntryRoomId] = useState<number | null>(null);
  const [activeEntryRoomName, setActiveEntryRoomName] = useState<string | null>(null);
  const mustSelectActiveRoom = !!activeEntryId && activeEntryRoomId !== null && selectedRoomId !== '' && Number(selectedRoomId) !== Number(activeEntryRoomId);
  
  // Debug: Log del estado del botón
  // Debug removido para consola limpia
  const [, setMonthlyHours] = useState<number>(0);
  const [, setWeeklyHours] = useState<number>(0);
  const [, setWeeklyCount] = useState<number>(0);

  // helpers de fecha
  const getWeekRange = (d = new Date()) => {
    const day = d.getDay(); // 0=Dom...6=Sab
    const diffToMonday = (day + 6) % 7; // lunes como inicio
    const start = new Date(d);
    start.setHours(0,0,0,0);
    start.setDate(start.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    return { start, end };
  };

  const getMonthRange = (d = new Date()) => {
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23,59,59,999);
    return { start, end };
  };

  // acumula horas en milisegundos, usando "ahora" si no hay endedAt
  const sumHours = (entries: { startedAt: string; endedAt?: string | null }[], rangeStart: Date, rangeEnd: Date) => {
    let ms = 0;
    const now = new Date();
    for (const e of entries) {
      const s = new Date(e.startedAt);
      const rawEnd = e.endedAt ? new Date(e.endedAt) : now;
      // recorta al rango [rangeStart, rangeEnd]
      const start = s < rangeStart ? rangeStart : s;
      const end = rawEnd > rangeEnd ? rangeEnd : rawEnd;
      if (end > start) ms += (end.getTime() - start.getTime());
    }
    return ms / 36e5; // a horas
  };

  const recalcStats = useCallback(async () => {
    try {
      const all: RoomEntryUI[] = await getMyEntries();
  
      const { start: weekStart, end: weekEnd } = getWeekRange();
      const { start: monthStart, end: monthEnd } = getMonthRange();
  
      const weekEntries = all.filter(e => {
        const s = new Date(e.startedAt);
        return s >= weekStart && s <= weekEnd;
      });
      setWeeklyHours(Number(sumHours(weekEntries, weekStart, weekEnd).toFixed(2)));
      setWeeklyCount(weekEntries.length);
  
      const monthEntries = all.filter(e => {
        const s = new Date(e.startedAt);
        return s >= monthStart && s <= monthEnd;
      });
      setMonthlyHours(Number(sumHours(monthEntries, monthStart, monthEnd).toFixed(2)));
    } catch {
      setMonthlyHours(0);
      setWeeklyHours(0);
      setWeeklyCount(0);
    }
  }, []);


  const onChangeRoom = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setSelectedRoomId(value);
    if (activeEntryId && activeEntryRoomId !== null && value !== activeEntryRoomId) {
      setError(`Salida pendiente en ${activeEntryRoomName ?? `Sala ${activeEntryRoomId}`}. Selecciónala para registrar la salida.`);
    } else {
      setError(null);
    }
  };

  const parseErrorMessage = (e: unknown) => {
    if (!e) return 'Error desconocido';
    if (typeof e === 'string') return e;
    if (e instanceof Error && e.message) return e.message;
    const anyErr = e as { message?: string; data?: unknown; status?: number };
    if (anyErr?.message) return anyErr.message;
    if (anyErr?.data) {
      const d = anyErr.data as Record<string, unknown>;
      if (typeof d.detail === 'string') return d.detail;
      if (Array.isArray(d.non_field_errors)) return d.non_field_errors.join(', ');
      const firstField = Object.keys(d)[0];
      const val = d[firstField];
      if (Array.isArray(val)) return `${firstField}: ${val.join(', ')}`;
      if (typeof val === 'string') return `${firstField}: ${val}`;
    }
    return 'Ocurrió un error procesando la solicitud';
  };

  // Verificar si el monitor ha excedido 8 horas hoy
  const checkHoursLimit = async () => {
    try {
      const entries = await getMyEntries();
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      // Filtrar entradas de hoy
      const todayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.startedAt);
        return entryDate >= todayStart && entryDate <= todayEnd;
      });
      
      // Calcular horas trabajadas hoy (variable local no usada a futuro)
      let totalHours = 0;
      const now = new Date();
      
      for (const entry of todayEntries) {
        const startTime = new Date(entry.startedAt);
        const endTime = entry.endedAt ? new Date(entry.endedAt) : now;
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      // Si excede 8 horas, enviar notificación (comentado para evitar duplicados)
      // if (totalHours >= 8) {
      //   await notificationService.notifyHoursExceeded({
      //     monitor_id: user?.id || 0,
      //     monitor_name: user?.username || 'Monitor',
      //     hours_worked: Math.round(totalHours * 100) / 100,
      //     date: today.toISOString().split('T')[0]
      //   });
      // }
    } catch {
      // Error silencioso para no ensuciar consola en producción
    }
  };

  const reloadActive = async () => {
    try {
      const res = await getMyActiveEntry();
      if (res.has_active_entry && res.active_entry) {
        setActiveEntryId(res.active_entry.id);
        setActiveEntryRoomId(res.active_entry.roomId ?? null);
        setActiveEntryRoomName(res.active_entry.roomName ?? null);
      } else {
        setActiveEntryId(null);
        setActiveEntryRoomId(null);
        setActiveEntryRoomName(null);
      }
    } catch {
      // En error, limpiar a estado seguro
      setActiveEntryId(null);
      setActiveEntryRoomId(null);
      setActiveEntryRoomName(null);
    }
  };

  const loadRooms = async () => {
    setError(null);
    const list = await fetchRooms();
    setRooms(list);
    setSelectedRoomId(list[0]?.id ?? '');
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadRooms();
        await reloadActive();
        await recalcStats();
      } catch (e) {
        if (!mounted) return;
        setError(parseErrorMessage(e));
      }
    })();
    return () => { mounted = false; };
  }, [recalcStats]);

  const onRegister = async () => {
    if (!selectedRoomId || loading) {
      return;
    }
    setLoading(true); setError(null);
    try {
      const created = await createEntry(selectedRoomId); // { message, entry }
      
      // Usar la información de la entrada creada directamente
      if (created && (created as { entry?: { id: number; room: number } }).entry) {
        const entry = (created as { entry: { id: number; room: number } }).entry;
        setActiveEntryId(entry.id);
        setActiveEntryRoomId(entry.room);
        setActiveEntryRoomName(rooms.find(r => r.id === entry.room)?.name || `Sala ${entry.room}`);
      } else {
        // Fallback: intentar recargar desde el backend
        await reloadActive();
      }
      
      // Verificar límite de horas después del registro
      await checkHoursLimit();
      
      onChanged?.();
      
      const newId = (created as { entry?: { id: number }; id?: number })?.entry?.id ?? (created as { id?: number })?.id ?? null;
      if (newId != null) {
        // Obtener información de la sala y el usuario para la notificación
        const roomName = rooms.find(r => r.id === selectedRoomId)?.name || `Sala ${selectedRoomId}`;
        const userName = user?.username || 'Monitor';
        
        const evtDetail = { id: Number(newId), roomName, userName };
        window.dispatchEvent(new CustomEvent('room-entry-added', { detail: evtDetail }));
        try {
          localStorage.setItem('room-event', JSON.stringify({ type: 'entry', ...evtDetail, ts: Date.now() }));
        } catch {
          // Ignorar errores de almacenamiento (modo privado, sin cuota, etc.)
        }
      }
    } catch (e) {
      setError(parseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onExit = async () => {
    if (!activeEntryId || loading) return;
  
    // Bloquea si la sala seleccionada no coincide con la sala de la entrada activa
    const hasActive = activeEntryId !== null;
    const hasSelectedRoom = typeof selectedRoomId === 'number';
    const mustSelectActiveRoom =
      hasActive &&
      activeEntryRoomId !== null &&
      hasSelectedRoom &&
      selectedRoomId !== activeEntryRoomId;
  
    if (mustSelectActiveRoom) {
      setError(`Debes seleccionar la sala ${activeEntryRoomName ?? activeEntryRoomId} para registrar la salida.`);
      return;
    }
  
    setLoading(true); setError(null);
    try {
      await exitEntry(activeEntryId);
      await reloadActive();
      await recalcStats();
      onChanged?.();
      window.dispatchEvent(new CustomEvent('room-stats-reload'));
      
      // Obtener información de la sala y el usuario para la notificación
      const roomName = rooms.find(r => r.id === activeEntryRoomId)?.name || `Sala ${activeEntryRoomId}`;
      const userName = user?.username || 'Monitor';
      
      const exitDetail = { id: activeEntryId, roomName, userName };
      window.dispatchEvent(new CustomEvent('room-entry-exited', { detail: exitDetail }));
      try {
        localStorage.setItem('room-event', JSON.stringify({ type: 'exit', ...exitDetail, ts: Date.now() }));
      } catch {
        // Ignorar errores de almacenamiento (modo privado, sin cuota, etc.)
      }
    } catch (e) {
      setError(parseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="room-panel">
      {error && <div className="alert error" role="alert" aria-live="polite">{error}</div>}

      <h2 className="panel-title">
        ¡Bienvenido, {user?.username ?? 'usuario'}! Selecciona una sala y registra tu entrada.
      </h2>
      
      <div className="panel-actions">
        <label className="field">
          <span>Sala</span>
          <select
            className="select"
            value={selectedRoomId}
            onChange={onChangeRoom}
            disabled={rooms.length === 0}
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>

        {activeEntryId ? (
          <button className="primary-btn danger" onClick={onExit} disabled={loading}>
            Registrar salida
          </button>
        ) : (
          <button className="primary-btn" onClick={onRegister} disabled={loading || mustSelectActiveRoom}>
            Registrarse
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomPanel;