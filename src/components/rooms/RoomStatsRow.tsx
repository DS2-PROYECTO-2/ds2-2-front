import React, { useEffect, useState } from 'react';
import { getMyEntries, type RoomEntryUI } from '../../services/roomEntryService';
import { apiClient } from '../../utils/api';

const getWeekRange = (d = new Date()) => {
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
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

// Reemplaza sumHours por estas dos funciones:
const sumMinutes = (entries: { startedAt: string; endedAt?: string | null }[], rangeStart: Date, rangeEnd: Date) => {
    let ms = 0; const now = new Date();
    for (const e of entries) {
      const s = new Date(e.startedAt);
      const rawEnd = e.endedAt ? new Date(e.endedAt) : now;
      const start = s < rangeStart ? rangeStart : s;
      const end = rawEnd > rangeEnd ? rangeEnd : rawEnd;
      if (end > start) ms += (end.getTime() - start.getTime());
    }
    return Math.round(ms / 60000); // minutos
  };
  
  const formatHM = (totalMin: number) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h} h ${String(m).padStart(2, '0')} min`;
  };

const RoomStatsRow: React.FC = () => {
  const [monthly, setMonthly] = useState<string>('0 h 00 min');
  const [weekly, setWeekly]   = useState<string>('0 h 00 min');
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [lateMonth, setLateMonth] = useState<number>(0);

  const recalc = async () => {
    try {
      const all: RoomEntryUI[] = await getMyEntries();
      const { start: weekStart, end: weekEnd } = getWeekRange();
      const { start: monthStart, end: monthEnd } = getMonthRange();

      const week = all.filter(e => {
        const s = new Date(e.startedAt);
        return s >= weekStart && s <= weekEnd;
      });
      const month = all.filter(e => {
        const s = new Date(e.startedAt);
        return s >= monthStart && s <= monthEnd;
      });

      const weekMin = sumMinutes(week, weekStart, weekEnd);
      const monthMin = sumMinutes(month, monthStart, monthEnd);

      setWeekly(formatHM(weekMin));
      setMonthly(formatHM(monthMin));
      setWeeklyCount(week.length);

      // Obtener llegadas tarde del endpoint del backend
      let lateCount = 0;
      try {
        console.log('🔍 DEBUG CARD LLEGADAS TARDE:');
        console.log('Month range:', monthStart.toISOString().split('T')[0], 'to', monthEnd.toISOString().split('T')[0]);
        
        // Usar el endpoint específico para llegadas tarde
        const params = new URLSearchParams();
        params.append('date_from', monthStart.toISOString().split('T')[0]);
        params.append('date_to', monthEnd.toISOString().split('T')[0]);
        
        const response = await apiClient.get(`/api/rooms/monitor/late-arrivals/?${params.toString()}`);
        lateCount = response.late_arrivals_count || 0;
        
        console.log(`Total late arrivals this month: ${lateCount}`);
      } catch (error) {
        console.error('Error fetching late arrivals:', error);
        // mantener lateCount=0 en caso de error
      }
      console.log('Setting lateMonth to:', lateCount);
      setLateMonth(lateCount);
      console.log('lateMonth state should be:', lateCount);
    } catch {
      // Valores seguros si falla el backend
      setWeekly('0 h 00 min');
      setMonthly('0 h 00 min');
      setWeeklyCount(0);
    }
  };

  useEffect(() => { recalc(); }, []);

  useEffect(() => {
    const handler = () => {
      recalc();
    };
    window.addEventListener('room-stats-reload', handler);
    window.addEventListener('room-entry-added', handler);      // Nueva entrada registrada
    window.addEventListener('room-entry-exited', handler);     // Salida registrada
    window.addEventListener('schedule-updated', handler);      // Turnos actualizados
    return () => {
      window.removeEventListener('room-stats-reload', handler);
      window.removeEventListener('room-entry-added', handler);
      window.removeEventListener('room-entry-exited', handler);
      window.removeEventListener('schedule-updated', handler);
    };
  }, []);


  return (
    <div className="stats-row">
      <div className="content-panel mini mini--monthly">
        <div className="mini-card__title">Horas mensuales</div>
        <div className="mini-card__value">{monthly}</div>
        <div className="mini-card__hint">Acumuladas este mes</div>
      </div>
      <div className="content-panel mini mini--weekly">
        <div className="mini-card__title">Horas semanales</div>
        <div className="mini-card__value" style={{ color: '#059669' }}>{weekly}</div>
        <div className="mini-card__hint">Semana actual</div>
      </div>
      <div className="content-panel mini mini--count">
        <div className="mini-card__title">Registros esta semana</div>
        <div className="mini-card__value" style={{ color: '#DC2626' }}>{weeklyCount}</div>
        <div className="mini-card__hint">Entradas creadas</div>
      </div>
      <div className="content-panel mini mini--late">
        <div className="mini-watermark">⏰</div>
        <div className="mini-card__title">Llegadas tarde (mes)</div>
        <div className="mini-card__value mini-card__value--late">{lateMonth}</div>
        <div className="mini-card__hint">Turnos con retraso ≥5m</div>
      </div>
    </div>
  );
};

export default RoomStatsRow;