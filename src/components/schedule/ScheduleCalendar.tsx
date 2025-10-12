import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import scheduleService, { type Schedule, type CreateScheduleData, type UpdateScheduleData } from '../../services/scheduleService';
import ScheduleDetailsModal from './ScheduleDetailsModal';
import roomService from '../../services/roomService';
import userManagementService from '../../services/userManagementService';
import { useAuth } from '../../hooks/useAuth';
import { useSecurity } from '../../hooks/useSecurity';
import { ApiErrorHandler } from '../../utils/errorHandler';
import '../../styles/ScheduleCalendar.css';

interface Room {
  id: number;
  name: string;
}

interface MonitorUser {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'monitor';
  is_verified: boolean;
}

const ScheduleCalendar: React.FC = () => {
  const { user } = useAuth();
  const { canEdit, canDelete, canCreate, isAdmin } = useSecurity();
  
  // Funciones silenciosas para renderizado (no generan errores de consola)
  const canEditSilent = () => canEdit(true);
  const canDeleteSilent = () => canDelete(true);
  const canCreateSilent = () => canCreate(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [monitors, setMonitors] = useState<MonitorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<number | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showSchedulesModal, setShowSchedulesModal] = useState(false);
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<Schedule[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  
  // Estados para eliminación masiva
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<number | null>(null);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  
  const [newSchedule, setNewSchedule] = useState<CreateScheduleData>({
    user: 0,
    room: 0,
    start_datetime: '',
    end_datetime: '',
    status: 'active',
    recurring: false,
    notes: ''
  });

  // Estados para el modo rango
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState('');
  const [rangeEndDate, setRangeEndDate] = useState('');
  
  const [editSchedule, setEditSchedule] = useState<UpdateScheduleData>({
    user: 0,
    room: 0,
    start_datetime: '',
    end_datetime: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const horas = Array.from({ length: 18 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

  // Limpiar errores cuando el usuario cambia los valores
  const handleFieldChange = (field: string, value: string | number | boolean) => {
    const updatedSchedule = {...newSchedule, [field]: value};
    setNewSchedule(updatedSchedule);
    
    // Limpiar error del campo específico
    if (formErrors[field]) {
      const newErrors = {...formErrors};
      delete newErrors[field];
      setFormErrors(newErrors);
    }
    
    // Validar el formulario con el nuevo valor
    setTimeout(() => {
      const errors: {[key: string]: string} = {};
      
      if (field === 'user') {
        if (!value || value === 0) {
          errors.user = 'Debes seleccionar un monitor';
        }
      }
      if (field === 'room') {
        if (!value || value === 0) {
          errors.room = 'Debes seleccionar una sala';
        }
      }
      if (field === 'start_datetime') {
        if (!value) {
          errors.start_datetime = 'Debes seleccionar una fecha y hora de inicio';
        } else if (typeof value === 'string' || typeof value === 'number') {
          const startDate = new Date(value);
          const now = getBogotaDate();
          if (startDate < now) {
            errors.start_datetime = 'No se pueden crear turnos en fechas pasadas';
          }
        }
      }
      if (field === 'end_datetime') {
        if (!value) {
          errors.end_datetime = 'Debes seleccionar una fecha y hora de fin';
        } else if (updatedSchedule.start_datetime && (typeof value === 'string' || typeof value === 'number')) {
          const startDate = new Date(updatedSchedule.start_datetime);
          const endDate = new Date(value);
          if (endDate <= startDate) {
            errors.end_datetime = 'La fecha de fin debe ser posterior a la fecha de inicio';
          }
        }
      }
      
      setFormErrors(prevErrors => ({...prevErrors, ...errors}));
    }, 100);
  };

  // Manejar cambios en campos de rango
  const handleRangeFieldChange = (field: 'rangeStartDate' | 'rangeEndDate', value: string) => {
    if (field === 'rangeStartDate') {
      setRangeStartDate(value);
    } else {
      setRangeEndDate(value);
    }
    
    // Limpiar errores específicos del campo
    if (formErrors[field]) {
      const newErrors = {...formErrors};
      delete newErrors[field];
      setFormErrors(newErrors);
    }
    
    // Validar el campo específico después de un breve delay
    setTimeout(() => {
      const errors: {[key: string]: string} = {};
      
      if (field === 'rangeStartDate') {
        if (!value) {
          errors.rangeStartDate = 'Fecha de inicio del rango requerida';
        }
      }
      if (field === 'rangeEndDate') {
        if (!value) {
          errors.rangeEndDate = 'Fecha de fin del rango requerida';
        } else if (rangeStartDate) {
          const rangeStart = new Date(rangeStartDate);
          const rangeEnd = new Date(value);
          if (rangeEnd <= rangeStart) {
            errors.rangeEndDate = 'La fecha de fin del rango debe ser posterior a la fecha de inicio';
          }
        }
      }
      
      setFormErrors(prevErrors => ({...prevErrors, ...errors}));
    }, 100);
  };

  // Obtener fecha actual en zona horaria de Bogotá
  const getBogotaDate = () => {
    const now = new Date();
    // Obtener la fecha actual en zona horaria de Bogotá
    const bogotaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    return bogotaTime;
  };

  // Generar color único para cada monitor
  const getMonitorColor = (userId: number) => {
    const colors = [
      '#dc2626', // Rojo
      '#2563eb', // Azul
      '#16a34a', // Verde
      '#ca8a04', // Amarillo
      '#9333ea', // Púrpura
      '#f97316', // Naranja
      '#0891b2', // Cian
      '#be123c', // Rosa
      '#059669', // Esmeralda
      '#7c3aed', // Violeta
      '#ea580c', // Naranja oscuro
      '#0d9488', // Teal
    ];
    
    // Usar el ID del usuario para seleccionar un color consistente
    return colors[userId % colors.length];
  };

  // Generar turnos recurrentes basados en el día de la semana
  const generateRecurringSchedules = (baseSchedule: CreateScheduleData, startDate: string, endDate: string) => {
    const schedules: CreateScheduleData[] = [];
    const baseStartDate = new Date(baseSchedule.start_datetime);
    const baseEndDate = new Date(baseSchedule.end_datetime);
    
    // Extraer solo la hora del turno base (ignorar la fecha)
    const baseStartHour = baseStartDate.getHours();
    const baseStartMinute = baseStartDate.getMinutes();
    const baseStartSecond = baseStartDate.getSeconds();
    
    const baseEndHour = baseEndDate.getHours();
    const baseEndMinute = baseEndDate.getMinutes();
    const baseEndSecond = baseEndDate.getSeconds();
    
    // Obtener el día de la semana del turno base
    const baseDayOfWeek = baseStartDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Iterar por cada día en el rango
    for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      // Si el día de la semana coincide con el turno base
      if (currentDate.getDay() === baseDayOfWeek) {
        // Crear las nuevas fechas con la hora del turno base pero la fecha del rango
        const newStartDateTime = new Date(currentDate);
        newStartDateTime.setHours(baseStartHour, baseStartMinute, baseStartSecond);
        
        const newEndDateTime = new Date(currentDate);
        newEndDateTime.setHours(baseEndHour, baseEndMinute, baseEndSecond);
        
        schedules.push({
          ...baseSchedule,
          start_datetime: newStartDateTime.toISOString(),
          end_datetime: newEndDateTime.toISOString(),
          recurring: true
        });
      }
    }
    
    return schedules;
  };

  // Formatear fecha para input datetime-local en zona horaria de Bogotá
  const formatDateForInput = (date: Date) => {
    const bogotaDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    const year = bogotaDate.getFullYear();
    const month = String(bogotaDate.getMonth() + 1).padStart(2, '0');
    const day = String(bogotaDate.getDate()).padStart(2, '0');
    const hours = String(bogotaDate.getHours()).padStart(2, '0');
    const minutes = String(bogotaDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Validar formulario en tiempo real
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newSchedule.user || newSchedule.user === 0) {
      errors.user = 'Debes seleccionar un monitor';
    } else {
      // Verificar que el monitor seleccionado existe en la lista
      const selectedMonitor = monitors.find(m => m.id === newSchedule.user);
      if (!selectedMonitor) {
        errors.user = 'El monitor seleccionado no es válido';
      } else if (!selectedMonitor.is_verified) {
        errors.user = 'El monitor seleccionado no está verificado. Solo se pueden asignar turnos a usuarios verificados.';
      }
    }
    
    if (!newSchedule.room || newSchedule.room === 0) {
      errors.room = 'Debes seleccionar una sala';
    }
    
    if (!newSchedule.start_datetime) {
      errors.start_datetime = 'Debes seleccionar una fecha y hora de inicio';
    } else {
      const startDate = new Date(newSchedule.start_datetime);
      const now = getBogotaDate();
      if (startDate < now) {
        errors.start_datetime = 'No se pueden crear turnos en fechas pasadas';
      }
    }
    
    if (!newSchedule.end_datetime) {
      errors.end_datetime = 'Debes seleccionar una fecha y hora de fin';
    } else if (newSchedule.start_datetime) {
      const startDate = new Date(newSchedule.start_datetime);
      const endDate = new Date(newSchedule.end_datetime);
      if (endDate <= startDate) {
        errors.end_datetime = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }
    
    // Validaciones específicas para modo rango
    if (isRangeMode) {
      if (!rangeStartDate) {
        errors.rangeStartDate = 'Fecha de inicio del rango requerida';
      }
      
      if (!rangeEndDate) {
        errors.rangeEndDate = 'Fecha de fin del rango requerida';
      }
      
      if (rangeStartDate && rangeEndDate) {
        const rangeStart = new Date(rangeStartDate);
        const rangeEnd = new Date(rangeEndDate);
        
        if (rangeEnd <= rangeStart) {
          errors.rangeEndDate = 'La fecha de fin del rango debe ser posterior a la fecha de inicio';
        }
        
        // Validar que el rango no sea muy largo (máximo 1 año)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        
        if (rangeEnd > oneYearFromNow) {
          errors.rangeEndDate = 'El rango no puede exceder 1 año';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para disparar eventos de actualización
  const notifyScheduleUpdate = useCallback(() => {
    // Disparar evento personalizado para notificar cambios
    window.dispatchEvent(new CustomEvent('schedule-updated'));
    
    // Disparar evento de localStorage para otras pestañas
    localStorage.setItem('schedule-event', Date.now().toString());
    localStorage.removeItem('schedule-event');
  }, []);

  // Cargar datos
  const loadData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsUpdating(true);
      }
      setError(null);
      
      let startDate: Date;
      let endDate: Date;
      
      if (view === 'week') {
        // Para vista semanal, cargar turnos de la semana actual
        const today = new Date(currentDate);
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        startDate = startOfWeek;
        endDate = endOfWeek;
      } else {
        // Para vista mensual, cargar turnos del mes actual
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      }
      
      const filters = {
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
        // Para administradores: usar filtro seleccionado, para monitores: usar su propio ID
        user: user?.role === 'admin' ? (selectedMonitor || undefined) : user?.id
      };
      
      const schedulesData = await scheduleService.getSchedules(filters);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      
      // Cargar monitores solo para administradores
      if (user?.role === 'admin') {
        try {
          // Primero intentar con filtro de rol
          let usersData = await userManagementService.getUsers({ role: 'monitor' });
          
          // Si no hay datos o el filtro no funcionó, cargar todos los usuarios
          if (!Array.isArray(usersData) || usersData.length === 0) {
            usersData = await userManagementService.getUsers();
          }
          
          // Verificar que los datos son válidos
          if (Array.isArray(usersData) && usersData.length > 0) {
            // Filtrar solo usuarios con rol 'monitor', activos y verificados
            const validMonitors = usersData.filter(user => 
              user.role === 'monitor' && 
              user.is_active === true &&
              user.is_verified === true &&
              user.id && 
              user.full_name
            );
            setMonitors(validMonitors);
          } else {
            setMonitors([]);
          }
        } catch (error) {
          setMonitors([]);
        }
      } else {
        // Para monitores, no cargar lista de monitores
        setMonitors([]);
      }
      
      // Cargar salas reales
      try {
        const roomsData = await roomService.getRooms();
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      } catch (error) {
        setRooms([]);
      }
      
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Error al cargar los datos');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsUpdating(false);
      }
    }
  }, [currentDate, selectedMonitor, user?.role, view, user?.id]);

  useEffect(() => {
    loadData(true); // Carga inicial
  }, [loadData]);

  // Actualizaciones en tiempo real
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    const handleWindowFocus = () => loadData();

    const handleScheduleUpdate = () => {
      loadData();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'schedule-event') {
        // Evento disparado desde otras pestañas/ventanas
        loadData();
      }
    };

    // Listeners para actualizaciones automáticas
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('schedule-updated', handleScheduleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadData]);

  // Obtener días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Obtener días de la semana
  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date);
    sunday.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  };

  // Navegación
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const changeWeek = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (delta * 7));
    setCurrentDate(newDate);
  };

  // Obtener turnos para un día
  const getSchedulesForDay = (date: Date | null) => {
    if (!date) return [];
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start_datetime).toDateString();
      const dateMatch = scheduleDate === date.toDateString();
      
      // Aplicar filtro de monitor si está seleccionado
      if (selectedMonitor) {
        // Buscar el monitor por ID en la lista de monitores
        const monitor = monitors.find(m => m.id === selectedMonitor);
        if (monitor) {
          return dateMatch && schedule.user_full_name === monitor.full_name;
        }
        return dateMatch && schedule.user === selectedMonitor;
      }
      
      return dateMatch;
    });
  };

  // Obtener turnos para una hora específica
  const getSchedulesForHour = (date: Date, hour: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const hourNum = parseInt(hour.split(':')[0]);
    
    return schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.start_datetime);
      const scheduleDate = scheduleStart.toISOString().split('T')[0];
      
      if (scheduleDate !== dateStr) return false;
      
      const scheduleStartHour = scheduleStart.getHours();
      
      // Solo mostrar el turno en la hora de inicio, no en todas las horas que abarca
      const timeMatch = scheduleStartHour === hourNum;
      
      // Aplicar filtro de monitor si está seleccionado
      if (selectedMonitor) {
        // Buscar el monitor por ID en la lista de monitores
        const monitor = monitors.find(m => m.id === selectedMonitor);
        if (monitor) {
          return timeMatch && schedule.user_full_name === monitor.full_name;
        }
        return timeMatch && schedule.user === selectedMonitor;
      }
      
      return timeMatch;
    });
  };

  // Abrir modal
  const openModal = (date: Date, hour: string | null = null) => {
    // Validación de seguridad: solo administradores pueden abrir el modal
    if (!canCreateSilent()) {
      return;
    }
    
    setShowModal(true);
    
    // Establecer valores por defecto usando zona horaria de Bogotá
    const now = getBogotaDate();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (hour) {
      const hourNum = parseInt(hour.split(':')[0]);
      const startTime = `${date.toISOString().split('T')[0]}T${hour.padStart(5, '0')}:00`;
      const endTime = `${date.toISOString().split('T')[0]}T${(hourNum + 1).toString().padStart(2, '0')}:00:00`;
      
      setNewSchedule({
        user: 0,
        room: 0,
        start_datetime: startTime,
        end_datetime: endTime,
        status: 'active',
        recurring: false,
        notes: ''
      });
    } else {
      // Si no se especifica hora, usar mañana a las 9 AM en zona horaria de Bogotá
      const tomorrowBogota = new Date(tomorrow);
      tomorrowBogota.setHours(9, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(10, 0, 0, 0);
      
      setNewSchedule({
        user: 0,
        room: 0,
        start_datetime: formatDateForInput(tomorrowBogota),
        end_datetime: formatDateForInput(tomorrowEnd),
        status: 'active',
        recurring: false,
        notes: ''
      });
    }
  };

  // Guardar turno
  const saveSchedule = async () => {
    // Validación de seguridad: verificar permisos
    if (!canCreate()) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isRangeMode && rangeStartDate && rangeEndDate) {
        // Modo rango: generar turnos recurrentes
        const recurringSchedules = generateRecurringSchedules(newSchedule, rangeStartDate, rangeEndDate);
        
        // Crear todos los turnos del rango
        for (const schedule of recurringSchedules) {
          await scheduleService.createSchedule(schedule);
        }
        
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: `${recurringSchedules.length} turnos creados exitosamente`, type: 'success' }
        }));
        
        // Notificar actualización en tiempo real
        notifyScheduleUpdate();
      } else {
        // Modo normal: crear un solo turno
        const scheduleData: CreateScheduleData = {
          user: newSchedule.user,
          room: newSchedule.room,
          start_datetime: newSchedule.start_datetime,
          end_datetime: newSchedule.end_datetime,
          notes: newSchedule.notes || undefined
        };

        await scheduleService.createSchedule(scheduleData);
        
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: 'Turno creado exitosamente', type: 'success' }
        }));
        
        // Notificar actualización en tiempo real
        notifyScheduleUpdate();
      }
      
      setShowModal(false);
      setNewSchedule({
        user: 0,
        room: 0,
        start_datetime: '',
        end_datetime: '',
        status: 'active',
        recurring: false,
        notes: ''
      });
      setIsRangeMode(false);
      setRangeStartDate('');
      setRangeEndDate('');
      loadData();
    } catch (error: unknown) {
      
      // Usar el nuevo sistema de manejo de errores
      const errorMessage = ApiErrorHandler.handleError(error);
      
      // Mostrar error como notificación toast
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: errorMessage, 
          type: 'error',
          title: 'Error al crear turno'
        }
      }));
      
      // Verificar si debe desloguear
      if (ApiErrorHandler.shouldLogout(error)) {
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 3000);
      }
  };
  };

  // Eliminar turno
  const deleteSchedule = async (id: number) => {
    // Validación de seguridad: verificar permisos
    if (!canDelete()) {
      return;
    }
    
    // Usar el sistema de confirmación personalizado de la aplicación
    window.dispatchEvent(new CustomEvent('app-confirm', {
      detail: {
        title: 'Eliminar Turno',
        message: '¿Estás seguro de que quieres eliminar este turno?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          try {
            await scheduleService.deleteSchedule(id);
            loadData();
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { message: 'Turno eliminado exitosamente', type: 'success' }
            }));
            
            // Notificar actualización en tiempo real
            notifyScheduleUpdate();
          } catch (error) {
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { message: 'Error al eliminar el turno', type: 'error' }
            }));
          }
        },
        onCancel: () => {
          // Eliminación cancelada
        }
      }
    }));
  };

  // Eliminar todos los turnos de un usuario
  const deleteSchedulesByUser = async () => {
    // Validación de seguridad: verificar permisos
    if (!canDelete()) {
      return;
    }
    
    if (!selectedUserForDelete) return;

    try {
      setBulkDeleteLoading(true);
      const result = await scheduleService.deleteSchedulesByUser(selectedUserForDelete);
      
      // Mostrar mensaje de éxito
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: `TODOS los turnos (${result.deleted_count}) han sido eliminados exitosamente`, 
          type: 'success' 
        }
      }));
      
      // Cerrar modal y recargar datos
      setShowBulkDeleteModal(false);
      setSelectedUserForDelete(null);
      loadData();
      
      // Notificar actualización en tiempo real
      notifyScheduleUpdate();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: 'Error al eliminar todos los turnos', 
          type: 'error' 
        }
      }));
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Abrir modal de edición
  const openEditModal = async (schedule: Schedule) => {
    // Validación de seguridad: verificar permisos
    if (!canEdit(true)) {
      return;
    }
    
    setSelectedSchedule(schedule);
    
    try {
      // Obtener datos completos del turno usando el endpoint específico
      const fullSchedule = await scheduleService.getScheduleById(schedule.id);
      
      // Formatear fechas para inputs datetime-local
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        // Ajustar a zona horaria de Bogotá (UTC-5)
        const bogotaDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
        return bogotaDate.toISOString().slice(0, 16);
      };
      
      // Usar los datos del endpoint detallado
      const editData = {
        user: fullSchedule.user_details?.id || fullSchedule.user || 0,
        room: fullSchedule.room_details?.id || fullSchedule.room || 0,
        start_datetime: formatDateForInput(fullSchedule.start_datetime),
        end_datetime: formatDateForInput(fullSchedule.end_datetime),
        notes: fullSchedule.notes || ''
      };
      
      setEditSchedule(editData);
      setFormErrors({});
      setShowEditModal(true);
    } catch (error) {
      // Fallback a los datos básicos si falla la carga detallada
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        const bogotaDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
        return bogotaDate.toISOString().slice(0, 16);
      };
      
      const editData = {
        user: schedule.user || 0,
        room: schedule.room || 0,
        start_datetime: formatDateForInput(schedule.start_datetime),
        end_datetime: formatDateForInput(schedule.end_datetime),
        notes: schedule.notes || ''
      };
      
      setEditSchedule(editData);
      setFormErrors({});
      setShowEditModal(true);
    }
  };

  // Cerrar modal de edición
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedSchedule(null);
    setEditSchedule({
      user: 0,
      room: 0,
      start_datetime: '',
      end_datetime: '',
      notes: ''
    });
    setFormErrors({});
  };

  // Guardar cambios del turno editado
  const saveEditSchedule = async () => {
    // Validación de seguridad: verificar permisos
    if (!canEdit(true)) {
      return;
    }
    
    if (!selectedSchedule) return;

    try {
      // Formatear fechas para envío al backend (ISO 8601 UTC)
      const formatDateForAPI = (dateString: string) => {
        const date = new Date(dateString);
        // Convertir de zona horaria local a UTC
        return date.toISOString();
      };

      const scheduleData = {
        ...editSchedule,
        start_datetime: editSchedule.start_datetime ? formatDateForAPI(editSchedule.start_datetime) : '',
        end_datetime: editSchedule.end_datetime ? formatDateForAPI(editSchedule.end_datetime) : ''
      };

      await scheduleService.updateSchedule(selectedSchedule.id, scheduleData);
      closeEditModal();
      loadData();
      
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Turno actualizado correctamente', type: 'success' }
      }));
      
      // Notificar actualización en tiempo real
      notifyScheduleUpdate();
    } catch (error: unknown) {
      
      // Usar el nuevo sistema de manejo de errores
      const errorMessage = ApiErrorHandler.handleError(error);
      
      // Mostrar notificación al usuario
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: errorMessage, 
          type: ApiErrorHandler.shouldLogout(error) ? 'error' : 'warning',
          title: ApiErrorHandler.shouldLogout(error) ? 'Sesión Expirada' : 'Error de Validación'
        }
      }));
      
      // Solo desloguear si es un error crítico de token
      if (ApiErrorHandler.shouldLogout(error)) {
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 3000);
      }
    }
  };

  // Abrir modal de turnos del día
  const openSchedulesModal = (schedules: Schedule[], date: Date) => {
    setSelectedDaySchedules(schedules);
    setSelectedDayDate(date);
    setShowSchedulesModal(true);
  };

  // Cerrar modal de turnos del día
  const closeSchedulesModal = () => {
    setShowSchedulesModal(false);
    setSelectedDaySchedules([]);
    setSelectedDayDate(null);
  };

  // Verificar si es hoy
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Formatear hora
  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="schedule-calendar-container">
        <div className="loading">Cargando calendario...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-calendar-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className={`schedule-calendar-container ${isUpdating ? 'updating' : ''}`}>
      {/* Overlay de actualización */}
      {isUpdating && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Actualizando calendario...</span>
        </div>
      )}
      
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-title">
          <Calendar className="calendar-icon" />
          <h2>Calendario de Turnos</h2>
          <div className="calendar-month-year">
            {view === 'month' 
              ? `${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Semana del ${getWeekDays(currentDate)[0].getDate()} ${meses[getWeekDays(currentDate)[0].getMonth()]}`
            }
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="calendar-toggle-btn"
            title={isExpanded ? "Contraer calendario" : "Expandir calendario"}
          >
            {isExpanded ? <ChevronUp className="toggle-icon" /> : <ChevronDown className="toggle-icon" />}
          </button>
        </div>

        <div className="calendar-controls">
          {/* Filtros para admins */}
          {isAdmin && (
            <select
              value={selectedMonitor || ''}
              onChange={(e) => setSelectedMonitor(e.target.value ? parseInt(e.target.value) : null)}
              className="filter-select"
            >
              <option value="">Todos los monitores</option>
              {monitors.map(monitor => (
                <option key={monitor.id} value={monitor.id}>
                  {monitor.full_name}
                </option>
              ))}
            </select>
          )}

          {/* Navegación del calendario */}
          <button
            onClick={() => view === 'month' ? changeMonth(-1) : changeWeek(-1)}
            className="btn-nav-prev"
          >
            <ChevronLeft className="nav-icon" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-nav-today"
          >
            Hoy
          </button>
          
          <button
            onClick={() => view === 'month' ? changeMonth(1) : changeWeek(1)}
            className="btn-nav-next"
          >
            <ChevronRight className="nav-icon" />
          </button>

          {/* Botones de vista */}
          <div className="calendar-view-toggle">
            <button
              onClick={() => setView('month')}
              className={`btn-view-month ${view === 'month' ? 'active' : ''}`}
            >
              Mes
            </button>
            <button
              onClick={() => setView('week')}
              className={`btn-view-week ${view === 'week' ? 'active' : ''}`}
            >
              Semana
            </button>
          </div>

          {/* Botones de administración */}
          {canCreateSilent() && (
            <button
              onClick={() => openModal(new Date())}
              className="btn-create-schedule"
            >
              <Plus className="btn-icon" />
              Nuevo Turno
            </button>
          )}

          {canDeleteSilent() && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="btn-bulk-delete"
              >
                <Trash2 className="btn-icon" />
                Eliminar
              </button>
          )}
        </div>
      </div>

      {/* Contenido del calendario (desplegable) */}
      <div className={`calendar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Vista Mensual */}
        {view === 'month' && (
        <div className="calendar-grid month-view">
          <div className="calendar-weekdays">
            {diasSemana.map(dia => (
              <div key={dia} className="weekday">{dia}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {getDaysInMonth(currentDate).map((date, idx) => {
              const daySchedules = getSchedulesForDay(date);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (date) {
                      setCurrentDate(new Date(date));
                      setView('week');
                    }
                  }}
                  className={`calendar-day ${!date ? 'other-month' : ''} ${isToday(date) ? 'today' : ''}`}
                >
                  {date && (
                    <>
                      <div className="calendar-day-number">
                        {date.getDate()}
                      </div>
                      
                      <div className="day-schedules">
                        {daySchedules.length > 0 ? (
                          <div
                            className="schedule-item clickable"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSchedulesModal(daySchedules, date);
                            }}
                            title="Haz clic para ver detalles de los turnos"
                          >
                            <div className="schedule-time">
                              Ver turnos agendados
                            </div>
                            <div className="schedule-info">
                              <div className="schedule-user">
                                {daySchedules.length} turno{daySchedules.length > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Semanal */}
      {view === 'week' && (
        <div className="calendar-grid week-view">
          {/* Header con días de la semana */}
          <div className="week-header">
            <div className="time-column-header">Hora</div>
            {getWeekDays(currentDate).map((date, index) => (
              <div key={index} className={`week-day-header ${isToday(date) ? 'today' : ''}`}>
                <div className="day-name">
                  {diasSemana[date.getDay()]}
                </div>
                <div className="day-number">{date.getDate()}</div>
              </div>
            ))}
          </div>
          
          {/* Grilla de horas y días */}
          <div className="week-grid">
            <div className="time-column">
              {horas.map(hour => (
                <div key={hour} className="time-slot">
                  {hour}
                </div>
              ))}
            </div>
            
            {getWeekDays(currentDate).map((date, dayIndex) => (
              <div key={dayIndex} className="day-column">
                {horas.map(hour => {
                  const hourSchedules = getSchedulesForHour(date, hour);
                  
                  return (
                    <div
                      key={hour}
                      className={`hour-cell ${!canCreateSilent() ? 'disabled' : ''}`}
                      onClick={() => {
                        if (canCreateSilent()) {
                          openModal(date, hour);
                        }
                      }}
                    >
                      {hourSchedules.map((schedule, scheduleIndex) => {
                        // Calcular la duración del turno en horas
                        const scheduleStart = new Date(schedule.start_datetime);
                        const scheduleEnd = new Date(schedule.end_datetime);
                        const durationHours = (scheduleEnd.getTime() - scheduleStart.getTime()) / (1000 * 60 * 60);
                        
                        // Calcular posición y ancho para evitar superposición
                        const totalSchedules = hourSchedules.length;
                        const scheduleWidth = totalSchedules > 1 ? `${100 / totalSchedules}%` : '100%';
                        const scheduleLeft = totalSchedules > 1 ? `${(scheduleIndex * 100) / totalSchedules}%` : '0%';
                        
                        return (
                          <div
                            key={schedule.id}
                            className={`week-schedule-item ${schedule.status} clickable ${totalSchedules > 1 ? 'overlapping' : ''}`}
                            title={`${schedule.user_full_name || `Monitor ${schedule.user}`} - ${schedule.room_name || `Sala ${schedule.room}`} (${formatTime(schedule.start_datetime)} - ${formatTime(schedule.end_datetime)})${canEdit(true) ? ' - Haz clic para editar' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Abrir modal de detalles
                              setSelectedSchedule(schedule);
                              setShowDetailsModal(true);
                            }}
                            style={{
                              height: `${Math.max(durationHours * 4, 4)}rem`, // 4rem por hora, mínimo 4rem
                              width: scheduleWidth,
                              left: scheduleLeft,
                              zIndex: 10 + scheduleIndex, // Z-index basado en el índice
                              borderColor: getMonitorColor(schedule.user), // Solo el borde cambia de color por monitor
                              position: 'absolute'
                            }}
                          >
                            <div className="schedule-title">
                              {schedule.user_full_name || `Monitor ${schedule.user}`}
                              {totalSchedules > 1 && (
                                <span className="schedule-count-badge">
                                  {scheduleIndex + 1}/{totalSchedules}
                                </span>
                              )}
                            </div>
                            <div className="schedule-time">
                              {formatTime(schedule.start_datetime)} - {formatTime(schedule.end_datetime)}
                            </div>
                            <div className="schedule-room">
                              {schedule.room_name || `Sala ${schedule.room}`}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSchedule(schedule.id);
                              }}
                              className="schedule-delete-btn"
                            >
                              <X className="delete-icon" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para crear turno */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Plus className="modal-icon" />
                Nuevo Turno
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Monitor *</label>
                <select
                  value={newSchedule.user}
                  onChange={(e) => handleFieldChange('user', parseInt(e.target.value))}
                  className={`form-input ${formErrors.user ? 'error' : ''}`}
                >
                  <option value={0}>Seleccionar monitor</option>
                  {monitors.map(monitor => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.full_name}
                    </option>
                  ))}
                </select>
                {formErrors.user && (
                  <span className="error-message">{formErrors.user}</span>
                )}
              </div>

              <div className="form-group">
                <label>Sala *</label>
                <select
                  value={newSchedule.room}
                  onChange={(e) => handleFieldChange('room', parseInt(e.target.value))}
                  className={`form-input ${formErrors.room ? 'error' : ''}`}
                >
                  <option value={0}>Seleccionar sala</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                {formErrors.room && (
                  <span className="error-message">{formErrors.room}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha y hora inicio *</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.start_datetime}
                    onChange={(e) => handleFieldChange('start_datetime', e.target.value)}
                    className={`form-input ${formErrors.start_datetime ? 'error' : ''}`}
                  />
                  {formErrors.start_datetime && (
                    <span className="error-message">{formErrors.start_datetime}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Fecha y hora fin *</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.end_datetime}
                    onChange={(e) => handleFieldChange('end_datetime', e.target.value)}
                    className={`form-input ${formErrors.end_datetime ? 'error' : ''}`}
                  />
                  {formErrors.end_datetime && (
                    <span className="error-message">{formErrors.end_datetime}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({...newSchedule, notes: e.target.value})}
                  className="form-input"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Modo rango */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isRangeMode}
                    onChange={(e) => setIsRangeMode(e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Crear turnos recurrentes por rango de fechas</span>
                </label>
                <p className="form-help">
                  Si está marcado, se crearán turnos automáticamente para el mismo día de la semana en el rango especificado.
                </p>
              </div>

              {isRangeMode && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha inicio del rango *</label>
                    <input
                      type="date"
                      value={rangeStartDate}
                      onChange={(e) => handleRangeFieldChange('rangeStartDate', e.target.value)}
                      className={`form-input ${formErrors.rangeStartDate ? 'error' : ''}`}
                    />
                    {formErrors.rangeStartDate && (
                      <span className="error-message">{formErrors.rangeStartDate}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Fecha fin del rango *</label>
                    <input
                      type="date"
                      value={rangeEndDate}
                      onChange={(e) => handleRangeFieldChange('rangeEndDate', e.target.value)}
                      className={`form-input ${formErrors.rangeEndDate ? 'error' : ''}`}
                    />
                    {formErrors.rangeEndDate && (
                      <span className="error-message">{formErrors.rangeEndDate}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowModal(false)}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={saveSchedule}
                className="btn-save"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar turno */}
      {showEditModal && selectedSchedule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit className="modal-icon" />
                Editar Turno
              </h3>
              <button
                onClick={closeEditModal}
                className="modal-close"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Monitor *</label>
                <select
                  value={editSchedule.user}
                  onChange={(e) => setEditSchedule({...editSchedule, user: parseInt(e.target.value)})}
                  className="form-input"
                >
                  <option value={0}>Seleccionar monitor</option>
                  {monitors.map(monitor => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Sala *</label>
                <select
                  value={editSchedule.room}
                  onChange={(e) => setEditSchedule({...editSchedule, room: parseInt(e.target.value)})}
                  className="form-input"
                >
                  <option value={0}>Seleccionar sala</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha y hora inicio *</label>
                  <input
                    type="datetime-local"
                    value={editSchedule.start_datetime}
                    onChange={(e) => setEditSchedule({...editSchedule, start_datetime: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Fecha y hora fin *</label>
                  <input
                    type="datetime-local"
                    value={editSchedule.end_datetime}
                    onChange={(e) => setEditSchedule({...editSchedule, end_datetime: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={editSchedule.notes || ''}
                  onChange={(e) => setEditSchedule({...editSchedule, notes: e.target.value})}
                  className="form-textarea"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={closeEditModal}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditSchedule}
                className="btn-save"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para mostrar turnos del día */}
      {showSchedulesModal && selectedDayDate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Calendar className="modal-icon" />
                Turnos del {selectedDayDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={closeSchedulesModal}
                className="modal-close"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              {selectedDaySchedules.length > 0 ? (
                <div className="schedules-list">
                  {selectedDaySchedules.map(schedule => (
                     <div 
                       key={schedule.id} 
                       className="schedule-detail-item"
                       style={{
                         borderLeftColor: getMonitorColor(schedule.user),
                         borderLeftWidth: '4px',
                         borderLeftStyle: 'solid'
                       }}
                     >
                      <div className="schedule-detail-time">
                        <Clock className="schedule-detail-icon" />
                        {formatTime(schedule.start_datetime)} - {formatTime(schedule.end_datetime)}
                      </div>
                      <div className="schedule-detail-info">
                        <div className="schedule-detail-user">
                          <User className="schedule-detail-icon" />
                          {schedule.user_full_name || `Monitor ${schedule.user}`}
                        </div>
                        <div className="schedule-detail-room">
                          <MapPin className="schedule-detail-icon" />
                          {schedule.room_name || `Sala ${schedule.room}`}
                        </div>
                        {schedule.notes && (
                          <div className="schedule-detail-notes">
                            <strong>Notas:</strong> {schedule.notes}
                          </div>
                        )}
                      </div>
                      <div className="schedule-detail-actions">
                        {canEditSilent() && (
                          <button
                            onClick={() => {
                              closeSchedulesModal();
                              openEditModal(schedule);
                            }}
                            className="btn-edit-schedule"
                            title="Editar turno"
                          >
                            <Edit className="btn-icon" />
                          </button>
                        )}
                        {canDeleteSilent() && (
                          <button
                            onClick={() => {
                              // Usar el sistema de confirmación personalizado de la aplicación
                              window.dispatchEvent(new CustomEvent('app-confirm', {
                                detail: {
                                  title: 'Eliminar Turno',
                                  message: '¿Estás seguro de que quieres eliminar este turno?',
                                  confirmText: 'Eliminar',
                                  cancelText: 'Cancelar',
                                  onConfirm: async () => {
                                    try {
                                      await scheduleService.deleteSchedule(schedule.id);
                                      closeSchedulesModal();
                                      loadData();
                                      window.dispatchEvent(new CustomEvent('app-toast', {
                                        detail: { message: 'Turno eliminado exitosamente', type: 'success' }
                                      }));
                                      
                                      // Notificar actualización en tiempo real
                                      notifyScheduleUpdate();
                                    } catch (error) {
                                      window.dispatchEvent(new CustomEvent('app-toast', {
                                        detail: { message: 'Error al eliminar el turno', type: 'error' }
                                      }));
                                    }
                                  },
                                  onCancel: () => {
                                    // Eliminación cancelada
                                  }
                                }
                              }));
                            }}
                            className="btn-delete-schedule"
                            title="Eliminar turno"
                          >
                            <X className="btn-icon" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-schedules">
                  <p>No hay turnos programados para este día.</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={closeSchedulesModal}
                className="btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para eliminación masiva de todos los turnos */}
      {showBulkDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Trash2 className="modal-icon" />
                Eliminar TODOS los Turnos
              </h3>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="modal-close"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-message">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <strong>ADVERTENCIA CRÍTICA:</strong> Esta acción eliminará permanentemente TODOS los turnos del sistema. 
                  Esta acción no se puede deshacer y afectará a todos los usuarios.
                </div>
              </div>

              <div className="form-group">
                <div className="alert alert-danger">
                  <strong>⚠️ Acción Destructiva:</strong>
                  <ul>
                    <li>Se eliminarán TODOS los turnos del sistema</li>
                    <li>Se perderán todos los horarios programados</li>
                    <li>Los monitores no podrán acceder a las salas</li>
                    <li>Esta acción NO se puede deshacer</li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    id="confirmDeleteAll"
                    checked={selectedUserForDelete === -1}
                    onChange={(e) => setSelectedUserForDelete(e.target.checked ? -1 : null)}
                  />
                  <span style={{marginLeft: '8px'}}>
                    <strong>Confirmo que entiendo las consecuencias y deseo eliminar TODOS los turnos</strong>
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="btn-cancel"
                disabled={bulkDeleteLoading}
              >
                Cancelar
              </button>
              <button
                onClick={deleteSchedulesByUser}
                className="btn-danger"
                disabled={selectedUserForDelete !== -1 || bulkDeleteLoading}
              >
                {bulkDeleteLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Eliminando TODOS los turnos...
                  </>
                ) : (
                  <>
                    <Trash2 className="btn-icon" />
                    Eliminar TODOS los Turnos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Turno */}
      <ScheduleDetailsModal
        schedule={selectedSchedule}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedSchedule(null);
        }}
        onEdit={(schedule) => {
          setShowDetailsModal(false);
          // Usar setTimeout para asegurar que el modal de detalles se cierre primero
          setTimeout(() => {
            openEditModal(schedule);
          }, 100);
        }}
        onDelete={(scheduleId) => {
          deleteSchedule(scheduleId);
        }}
        canEdit={canEditSilent()}
        canDelete={canDeleteSilent()}
      />
      </div>
    </div>
  );
};

export default ScheduleCalendar;