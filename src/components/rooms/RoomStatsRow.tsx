import React, { useEffect, useState } from 'react';
import { getMyEntries, type RoomEntryUI } from '../../services/roomEntryService';
import scheduleService from '../../services/scheduleService';
import { toBogotaTime, isLateArrival } from '../../utils/timeHelpers';

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

      // Calcular llegadas tarde del mes cruzando schedules + entries (regla: entry > start + 5m)
      let lateCount = 0;
      try {
        console.log('🔍 DEBUG CARD LLEGADAS TARDE:');
        console.log('Month range:', monthStart.toISOString().split('T')[0], 'to', monthEnd.toISOString().split('T')[0]);
        console.log('Total entries in month:', month.length);
        
        // Usar rango amplio para capturar turnos que cruzan meses
        const extendedStart = new Date(monthStart);
        extendedStart.setDate(extendedStart.getDate() - 7); // 7 días antes
        const extendedEnd = new Date(monthEnd);
        extendedEnd.setDate(extendedEnd.getDate() + 7); // 7 días después
        
        // Obtener datos de turnos
        let data;
        try {
          data = await scheduleService.getMySchedules();
        } catch {
          // Fallback con filtros
          data = await scheduleService.getMySchedules({
            date_from: extendedStart.toISOString().split('T')[0],
            date_to: extendedEnd.toISOString().split('T')[0],
            status: 'all'
          });
        }
        
        const schedules = [
          ...(data.current || []),
          ...(data.upcoming || []),
          ...(data.past || [])
        ];
        
        console.log('Total schedules found:', schedules.length);
        console.log('Current:', data.current?.length || 0);
        console.log('Upcoming:', data.upcoming?.length || 0);
        console.log('Past:', data.past?.length || 0);
        

        // Conjunto para evitar contar la misma entrada múltiples veces
        const processedEntries = new Set<number>();
        
        // Para cada turno, verificar si tiene llegada tarde
        for (const sch of schedules) {
          const start = new Date(sch.start_datetime);
          const end = new Date(sch.end_datetime);
          
          // Solo contar turnos que se solapan con el mes
          const scheduleStartBogota = toBogotaTime(start);
          const scheduleEndBogota = toBogotaTime(end);
          const monthStartBogota = toBogotaTime(monthStart);
          const monthEndBogota = toBogotaTime(monthEnd);
          
          // Verificar si el turno se solapa con el mes
          if (scheduleEndBogota < monthStartBogota || scheduleStartBogota > monthEndBogota) {
            console.log(`Schedule ${sch.id} outside month range, skipping`);
            continue;
          }
          
          console.log(`Checking schedule ${sch.id}:`, {
            start: scheduleStartBogota,
            end: scheduleEndBogota,
            room: sch.room,
            user: sch.user
          });
          
          
          // Ventana amplia para buscar entradas: 2 horas antes del inicio hasta 2 horas después del fin
          const windowStart = new Date(start.getTime() - 2 * 60 * 60 * 1000);
          const windowEnd = new Date(end.getTime() + 2 * 60 * 60 * 1000);
          
          // Buscar entradas del mes que caigan en la ventana Y sean del monitor específico del turno
          const relevantEntries = month.filter(e => {
            const entryTime = new Date(e.startedAt);
            return entryTime >= windowStart && 
                   entryTime <= windowEnd &&
                   e.userId === sch.user && // Filtrar por monitor específico del turno
                   e.roomId === sch.room;   // También filtrar por sala específica del turno
          });
          
          console.log(`Found ${relevantEntries.length} entries in window for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room})`);
          
          if (relevantEntries.length === 0) {
            console.log(`No entries found for schedule ${sch.id} - this is non-compliance (handled by backend)`);
            continue; // Sin entrada → incumplimiento (lo maneja backend)
          }
          
          // Filtrar entradas que estén DESPUÉS del inicio del turno (no antes)
          const entriesAfterStart = relevantEntries.filter(e => {
            const entryTime = new Date(e.startedAt);
            return entryTime >= start; // Solo entradas después del inicio del turno
          });
          
          if (entriesAfterStart.length === 0) {
            console.log(`No entries found after schedule start for schedule ${sch.id} - using first entry in window`);
            // Si no hay entradas después del inicio, usar la primera entrada en la ventana
            const firstEntry = relevantEntries
              .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())[0];
            const entryTime = new Date(firstEntry.startedAt);
            console.log(`Using first entry in window for schedule ${sch.id}:`, entryTime);
            
            // Verificar si es llegada tarde
            if (isLateArrival(entryTime, start, 5)) {
              if (!processedEntries.has(firstEntry.id)) {
                lateCount++;
                processedEntries.add(firstEntry.id);
                console.log(`🚨 LATE ARRIVAL COUNTED for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room}) - Entry ID: ${firstEntry.id}:`, {
                  scheduleStart: scheduleStartBogota,
                  entryTime: toBogotaTime(entryTime),
                  late: true
                });
              } else {
                console.log(`⚠️ ENTRY ALREADY PROCESSED for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room}) - Entry ID: ${firstEntry.id}`);
              }
            } else {
              console.log(`✅ ON TIME for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room})`);
            }
            continue;
          }
          
          // Usar la primera entrada DESPUÉS del inicio del turno
          const firstEntry = entriesAfterStart
            .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())[0];
          
          const entryTime = new Date(firstEntry.startedAt);
          console.log(`First entry AFTER schedule start for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room}):`, entryTime);
          
          // Usar la función de zona horaria para verificar llegada tarde
          if (isLateArrival(entryTime, start, 5)) {
            // Verificar si esta entrada ya fue procesada para evitar duplicados
            if (!processedEntries.has(firstEntry.id)) {
              lateCount++;
              processedEntries.add(firstEntry.id);
              console.log(`🚨 LATE ARRIVAL COUNTED for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room}) - Entry ID: ${firstEntry.id}:`, {
                scheduleStart: scheduleStartBogota,
                entryTime: toBogotaTime(entryTime),
                late: true
              });
            } else {
              console.log(`⚠️ ENTRY ALREADY PROCESSED for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room}) - Entry ID: ${firstEntry.id}`);
            }
          } else {
            console.log(`✅ ON TIME for schedule ${sch.id} (monitor: ${sch.user}, room: ${sch.room})`);
          }
        }
        
        console.log(`Total late arrivals this month: ${lateCount}`);
      } catch (error) {
        console.error('Error calculating late arrivals:', error);
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