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
  X,
  BookOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { usePassiveUpdates } from '../../hooks/usePassiveUpdates';
import scheduleService, { type Schedule, type CreateScheduleData, type UpdateScheduleData } from '../../services/scheduleService';
import courseService, { type Course, type CreateCourseData, type UpdateCourseData } from '../../services/courseService';
import ScheduleDetailsModal from './ScheduleDetailsModal';
import roomService from '../../services/roomService';
import userManagementService from '../../services/userManagementService';
import { useAuth } from '../../hooks/useAuth';
import { useSecurity } from '../../hooks/useSecurity';
import { ApiErrorHandler } from '../../utils/errorHandler';
import '../../styles/ScheduleCalendar.css';
import CustomSelect from '../reports/CustomSelect';
import '../../styles/CourseCalendar.css';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [monitors, setMonitors] = useState<MonitorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Estados para vista combinada
  const [showSchedules, setShowSchedules] = useState(true);
  const [showCourses, setShowCourses] = useState(true);
  
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<number | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showSchedulesModal, setShowSchedulesModal] = useState(false);
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<Schedule[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  
  // Estados para modales de cursos
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDayCourses, setSelectedDayCourses] = useState<Course[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleInfo, setSelectedScheduleInfo] = useState<Schedule | null>(null);
  
  // Estados para modal de selección de actividad
  const [showActivitySelectionModal, setShowActivitySelectionModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  
  // Estados para acordeones de actividades
  const [schedulesExpanded, setSchedulesExpanded] = useState(true);
  const [coursesExpanded, setCoursesExpanded] = useState(true);
  
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

  // Estados para formulario de curso
  const [newCourse, setNewCourse] = useState<CreateCourseData>({
    name: '',
    description: '',
    room: 0,
    schedule: 0,
    start_datetime: '',
    end_datetime: '',
    status: 'scheduled'
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

  // Estados para edición de curso
  const [editCourse, setEditCourse] = useState<UpdateCourseData>({
    name: '',
    description: '',
    room: 0,
    schedule: 0,
    start_datetime: '',
    end_datetime: '',
    status: 'scheduled'
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

  // Validar formulario de curso
  const validateCourseForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newCourse.name || newCourse.name.trim() === '') {
      errors.name = 'El nombre del curso es requerido';
    }
    
    if (!newCourse.description || newCourse.description.trim() === '') {
      errors.description = 'La descripción del curso es requerida';
    }
    
    if (!newCourse.room || newCourse.room === 0) {
      errors.room = 'Debes seleccionar una sala';
    }
    
    if (!newCourse.schedule || newCourse.schedule === 0) {
      errors.schedule = 'Debes seleccionar un turno';
    }
    
    if (!newCourse.start_datetime) {
      errors.start_datetime = 'Debes seleccionar una fecha y hora de inicio';
    } else {
      const startDate = new Date(newCourse.start_datetime);
      const now = getBogotaDate();
      if (startDate < now) {
        errors.start_datetime = 'No se pueden crear cursos en fechas pasadas';
      }
    }
    
    if (!newCourse.end_datetime) {
      errors.end_datetime = 'Debes seleccionar una fecha y hora de fin';
    } else if (newCourse.start_datetime) {
      const startDate = new Date(newCourse.start_datetime);
      const endDate = new Date(newCourse.end_datetime);
      if (endDate <= startDate) {
        errors.end_datetime = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      
      // Validar que el curso esté dentro del rango del turno
      if (selectedScheduleInfo && newCourse.start_datetime && newCourse.end_datetime) {
        const scheduleStart = new Date(selectedScheduleInfo.start_datetime);
        const scheduleEnd = new Date(selectedScheduleInfo.end_datetime);
        
        // Comparar solo las fechas (sin hora) para evitar problemas de zona horaria
        const courseStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const courseEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const scheduleStartDate = new Date(scheduleStart.getFullYear(), scheduleStart.getMonth(), scheduleStart.getDate());
        const scheduleEndDate = new Date(scheduleEnd.getFullYear(), scheduleEnd.getMonth(), scheduleEnd.getDate());
        
        // Debug logs
        console.log('=== VALIDACIÓN DE FECHAS ===');
        console.log('Curso inicio:', newCourse.start_datetime, '→ Fecha:', courseStartDate.toISOString().split('T')[0]);
        console.log('Curso fin:', newCourse.end_datetime, '→ Fecha:', courseEndDate.toISOString().split('T')[0]);
        console.log('Turno inicio:', selectedScheduleInfo.start_datetime, '→ Fecha:', scheduleStartDate.toISOString().split('T')[0]);
        console.log('Turno fin:', selectedScheduleInfo.end_datetime, '→ Fecha:', scheduleEndDate.toISOString().split('T')[0]);
        console.log('Comparación inicio:', courseStartDate.getTime(), 'vs', scheduleStartDate.getTime(), 'vs', scheduleEndDate.getTime());
        console.log('Comparación fin:', courseEndDate.getTime(), 'vs', scheduleStartDate.getTime(), 'vs', scheduleEndDate.getTime());
        
        if (courseStartDate < scheduleStartDate || courseStartDate > scheduleEndDate) {
          errors.start_datetime = `El curso debe estar en la fecha del turno (${scheduleStartDate.toLocaleDateString()})`;
        }
        
        if (courseEndDate < scheduleStartDate || courseEndDate > scheduleEndDate) {
          errors.end_datetime = `El curso debe estar en la fecha del turno (${scheduleEndDate.toLocaleDateString()})`;
        }
        
        // Validar horas solo si las fechas coinciden
        if (courseStartDate.getTime() === scheduleStartDate.getTime()) {
          const startTime = startDate.getHours() * 60 + startDate.getMinutes();
          // Calcular la hora de inicio del turno en minutos
          const scheduleStartTime = scheduleStart.getHours() * 60 + scheduleStart.getMinutes();
          
          if (startTime < scheduleStartTime) {
            errors.start_datetime = `El curso no puede iniciar antes del turno (${scheduleStart.toLocaleTimeString()})`;
          }
        }
        
        if (courseEndDate.getTime() === scheduleEndDate.getTime()) {
          const endTime = endDate.getHours() * 60 + endDate.getMinutes();
          const scheduleEndTime = scheduleEnd.getHours() * 60 + scheduleEnd.getMinutes();
          
          if (endTime > scheduleEndTime) {
            errors.end_datetime = `El curso no puede terminar después del turno (${scheduleEnd.toLocaleTimeString()})`;
          }
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Debounce para validaciones
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Validar formulario de curso con debounce
  const validateCourseFormWithDebounce = () => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    const timeout = setTimeout(() => {
      validateCourseForm();
    }, 500); // 500ms de delay
    
    setValidationTimeout(timeout);
  };

  // Validar formulario en tiempo real con debounce
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
      
      const [schedulesData, coursesData] = await Promise.all([
        scheduleService.getSchedules(filters),
        courseService.getCourses(filters)
      ]);
      
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      
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
          console.error('Error loading monitors:', error);
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
        console.error('Error loading rooms:', error);
        setRooms([]);
      }
      
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Error al cargar los datos');
      console.error('Error loading data:', err);
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

  // Actualizaciones pasivas inteligentes
  usePassiveUpdates({
    minUpdateInterval: 60000, // 1 minuto mínimo entre actualizaciones
    inactivityThreshold: 15000, // 15 segundos de inactividad
    enableVisibilityUpdates: true,
    enableFocusUpdates: false, // Deshabilitar actualizaciones por foco
    shouldUpdate: () => {
      // Solo actualizar si hay cambios reales en los datos
      return true; // Por ahora permitir todas las actualizaciones
    },
    onUpdate: loadData
  });

  // Actualizaciones en tiempo real (solo eventos importantes)
  useEffect(() => {
    const handleScheduleUpdate = () => {
      loadData();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'schedule-event') {
        // Evento disparado desde otras pestañas/ventanas
        loadData();
      }
    };

    // Solo listeners para eventos importantes
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
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
      // Usar comparación de fechas en zona horaria de Bogotá para evitar problemas de UTC
      const scheduleDate = new Date(schedule.start_datetime);
      const scheduleDateBogota = new Date(scheduleDate.toLocaleString("en-US", {timeZone: "America/Bogota"}));
      const dateBogota = new Date(date.toLocaleString("en-US", {timeZone: "America/Bogota"}));
      
      // Comparar solo la fecha (sin hora) para evitar problemas de zona horaria
      const scheduleDateOnly = new Date(scheduleDateBogota.getFullYear(), scheduleDateBogota.getMonth(), scheduleDateBogota.getDate());
      const dateOnly = new Date(dateBogota.getFullYear(), dateBogota.getMonth(), dateBogota.getDate());
      const dateMatch = scheduleDateOnly.getTime() === dateOnly.getTime();
      
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

  // Obtener cursos para un día
  const getCoursesForDay = (date: Date | null) => {
    if (!date) return [];
    return courses.filter(course => {
      // Usar comparación de fechas en zona horaria de Bogotá para evitar problemas de UTC
      const courseDate = new Date(course.start_datetime);
      const courseDateBogota = new Date(courseDate.toLocaleString("en-US", {timeZone: "America/Bogota"}));
      const dateBogota = new Date(date.toLocaleString("en-US", {timeZone: "America/Bogota"}));
      
      // Comparar solo la fecha (sin hora) para evitar problemas de zona horaria
      const courseDateOnly = new Date(courseDateBogota.getFullYear(), courseDateBogota.getMonth(), courseDateBogota.getDate());
      const dateOnly = new Date(dateBogota.getFullYear(), dateBogota.getMonth(), dateBogota.getDate());
      const dateMatch = courseDateOnly.getTime() === dateOnly.getTime();
      
      // Aplicar filtro de monitor si está seleccionado
      if (selectedMonitor) {
        // Buscar el monitor por ID en la lista de monitores
        const monitor = monitors.find(m => m.id === selectedMonitor);
        if (monitor) {
          return dateMatch && course.monitor_name === monitor.full_name;
        }
        return dateMatch && course.monitor_name === monitor?.full_name;
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

  // Obtener cursos para una hora específica
  const getCoursesForHour = (date: Date, hour: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const hourNum = parseInt(hour.split(':')[0]);
    
    return courses.filter(course => {
      const courseStart = new Date(course.start_datetime);
      const courseDate = courseStart.toISOString().split('T')[0];
      
      if (courseDate !== dateStr) return false;
      
      const courseStartHour = courseStart.getHours();
      
      // Solo mostrar el curso en la hora de inicio, no en todas las horas que abarca
      const timeMatch = courseStartHour === hourNum;
      
      // Aplicar filtro de monitor si está seleccionado
      if (selectedMonitor) {
        // Buscar el monitor por ID en la lista de monitores
        const monitor = monitors.find(m => m.id === selectedMonitor);
        if (monitor) {
          return timeMatch && course.monitor_name === monitor.full_name;
        }
        return timeMatch && course.monitor_name === monitor?.full_name;
      }
      
      return timeMatch;
    });
  };

  // Abrir modal de selección de actividad
  const openActivitySelectionModal = (date: Date, hour: string | null = null) => {
    setSelectedDayDate(date);
    setSelectedHour(hour);
    setShowActivitySelectionModal(true);
  };

  // Cerrar modal de selección de actividad
  const closeActivitySelectionModal = () => {
    setShowActivitySelectionModal(false);
    setSelectedDayDate(null);
    setSelectedHour(null);
  };

  // Abrir modal de curso
  const openCourseModal = (date: Date, hour: string | null = null) => {
    // Validación de seguridad: solo administradores pueden abrir el modal
    if (!canCreateSilent()) {
      return;
    }
    
    // Reiniciar estados del modal
    setFormErrors({});
    setFilteredSchedules([]);
    setSelectedScheduleInfo(null);
    setShowCourseModal(true);
    
    // Establecer valores por defecto usando zona horaria de Bogotá
    const now = getBogotaDate();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (hour) {
      const hourNum = parseInt(hour.split(':')[0]);
      const startTime = `${date.toISOString().split('T')[0]}T${hour.padStart(5, '0')}:00`;
      const endTime = `${date.toISOString().split('T')[0]}T${(hourNum + 1).toString().padStart(2, '0')}:00:00`;
      
      setNewCourse({
        name: '',
        description: '',
        room: 0,
        schedule: 0,
        start_datetime: startTime,
        end_datetime: endTime,
        status: 'scheduled'
      });
    } else {
      // Si no se especifica hora, usar mañana a las 9 AM en zona horaria de Bogotá
      const tomorrowBogota = new Date(tomorrow);
      tomorrowBogota.setHours(9, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(10, 0, 0, 0);
      
      setNewCourse({
        name: '',
        description: '',
        room: 0,
        schedule: 0,
        start_datetime: formatDateForInput(tomorrowBogota),
        end_datetime: formatDateForInput(tomorrowEnd),
        status: 'scheduled'
      });
    }
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

  // Guardar curso
  const saveCourse = async () => {
    // Validación de seguridad: verificar permisos
    if (!canCreate()) {
      return;
    }
    
    if (!validateCourseForm()) {
      return;
    }

    try {
      // Convertir fechas a zona horaria de Bogotá para evitar problemas de UTC
      const startDate = new Date(newCourse.start_datetime);
      const endDate = new Date(newCourse.end_datetime);
      
      // Crear fechas en zona horaria local de Bogotá
      const bogotaStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 
                                  startDate.getHours(), startDate.getMinutes(), 0);
      const bogotaEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 
                                endDate.getHours(), endDate.getMinutes(), 0);
      
      // Formatear para envío al backend
      const formatForBackend = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:00`;
      };
      
      const courseData: CreateCourseData = {
        name: newCourse.name,
        description: newCourse.description,
        room: newCourse.room,
        schedule: newCourse.schedule,
        start_datetime: formatForBackend(bogotaStart),
        end_datetime: formatForBackend(bogotaEnd),
        status: newCourse.status
      };
      
      console.log('Datos del curso a enviar:', courseData);

      await courseService.createCourse(courseData);
      
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Curso creado exitosamente', type: 'success' }
      }));
      
      // Notificar actualización en tiempo real
      notifyScheduleUpdate();
      
      setShowCourseModal(false);
      setNewCourse({
        name: '',
        description: '',
        room: 0,
        schedule: 0,
        start_datetime: '',
        end_datetime: '',
        status: 'scheduled'
      });
      loadData();
    } catch (error: unknown) {
      console.error('Error creating course:', error);
      
      // Usar el nuevo sistema de manejo de errores
      const errorMessage = ApiErrorHandler.handleError(error);
      
      // Mostrar error como notificación toast
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: errorMessage, 
          type: 'error',
          title: 'Error al crear curso'
        }
      }));
      
      // Verificar si debe desloguear
      if (ApiErrorHandler.shouldLogout(error)) {
        console.warn('Deslogueando por error crítico de token');
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 3000);
      }
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
      console.error('Error creating schedule:', error);
      
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
        console.warn('Deslogueando por error crítico de token');
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 3000);
      }
  };
  };

  // Eliminar curso
  const deleteCourse = async (id: number) => {
    // Validación de seguridad: verificar permisos
    if (!canDelete()) {
      return;
    }
    
    // Usar el sistema de confirmación personalizado de la aplicación
    window.dispatchEvent(new CustomEvent('app-confirm', {
      detail: {
        title: 'Eliminar Curso',
        message: '¿Estás seguro de que quieres eliminar este curso?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          try {
            await courseService.deleteCourse(id);
            loadData();
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { message: 'Curso eliminado exitosamente', type: 'success' }
            }));
            
            // Notificar actualización en tiempo real
            notifyScheduleUpdate();
          } catch (error) {
            console.error('Error deleting course:', error);
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { message: 'Error al eliminar el curso', type: 'error' }
            }));
          }
        },
        onCancel: () => {
          console.log('Eliminación cancelada');
        }
      }
    }));
  };

  // Actualizar curso
  const updateCourse = async () => {
    if (!canEdit()) {
      return;
    }

    if (!selectedCourse) return;

    try {
      await courseService.updateCourse(selectedCourse.id, editCourse);
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Curso actualizado exitosamente', type: 'success' }
      }));
      setShowEditCourseModal(false);
      setEditCourse({});
      loadData();
      
      // Notificar actualización en tiempo real
      notifyScheduleUpdate();
    } catch (error) {
      console.error('Error updating course:', error);
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Error al actualizar el curso', type: 'error' }
      }));
    }
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
            console.error('Error deleting schedule:', error);
            window.dispatchEvent(new CustomEvent('app-toast', {
              detail: { message: 'Error al eliminar el turno', type: 'error' }
            }));
          }
        },
        onCancel: () => {
          console.log('Eliminación cancelada');
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
      console.error('Error deleting all schedules:', error);
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
      console.error('Error loading schedule details:', error);
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
      console.error('Error updating schedule:', error);
      
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
        console.warn('Deslogueando por error crítico de token');
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 3000);
      } else {
        console.warn('Error no crítico, manteniendo sesión:', error instanceof Error ? error.message : String(error));
      }
    }
  };

  // Abrir modal de turnos del día
  const openSchedulesModal = (schedules: Schedule[], date: Date) => {
    // Obtener cursos del día
    const dayCourses = getCoursesForDay(date);
    
    setSelectedDaySchedules(schedules);
    setSelectedDayCourses(dayCourses);
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

  // Obtener turnos activos para selección en cursos
  const getActiveSchedules = () => {
    const now = new Date();
    console.log('getActiveSchedules - Total schedules:', schedules.length);
    console.log('getActiveSchedules - Current time:', now);
    
    const activeSchedules = schedules.filter(schedule => {
      const endDate = new Date(schedule.end_datetime);
      const isActive = schedule.status === 'active';
      const isFuture = endDate > now;
      
      console.log(`Schedule ${schedule.id}: status=${schedule.status}, isActive=${isActive}, endDate=${endDate}, isFuture=${isFuture}`);
      
      return isActive && isFuture;
    });
    
    console.log('getActiveSchedules - Active schedules found:', activeSchedules.length);
    return activeSchedules;
  };

  // Manejar cambio de sala en el formulario de curso
  const handleRoomChange = (roomId: number) => {
    setNewCourse({...newCourse, room: roomId, schedule: 0});
    
    if (roomId === 0) {
      setFilteredSchedules([]);
      setSelectedScheduleInfo(null);
      return;
    }

    // Encontrar la sala seleccionada para obtener su nombre
    const selectedRoom = rooms.find(room => room.id === roomId);
    const selectedRoomName = selectedRoom?.name || selectedRoom?.room_name || '';

    // Verificar que tenemos datos de turnos
    if (!schedules || schedules.length === 0) {
      setFilteredSchedules([]);
      setSelectedScheduleInfo(null);
      return;
    }

    // Filtrar turnos por sala seleccionada
    const activeSchedules = getActiveSchedules();
    const schedulesForRoom = activeSchedules.filter(schedule => {
      // Usar room_name para comparar con el nombre de la sala seleccionada
      const scheduleRoomName = schedule.room_name;
      return scheduleRoomName === selectedRoomName;
    });
    
    setFilteredSchedules(schedulesForRoom);
    setSelectedScheduleInfo(null);
  };

  // Manejar cambio de turno en el formulario de curso
  const handleScheduleChange = (scheduleId: number) => {
    setNewCourse({...newCourse, schedule: scheduleId});
    
    if (scheduleId === 0) {
      setSelectedScheduleInfo(null);
      return;
    }

    // Obtener información del turno seleccionado
    const selectedSchedule = filteredSchedules.find(schedule => schedule.id === scheduleId);
    setSelectedScheduleInfo(selectedSchedule || null);
    
    if (selectedSchedule) {
      // Usar la fecha del turno para evitar problemas de zona horaria
      const scheduleStart = new Date(selectedSchedule.start_datetime);
      const scheduleEnd = new Date(selectedSchedule.end_datetime);
      
      // Crear fechas en zona horaria local para evitar conversiones
      const startDate = new Date(scheduleStart.getFullYear(), scheduleStart.getMonth(), scheduleStart.getDate());
      const endDate = new Date(scheduleEnd.getFullYear(), scheduleEnd.getMonth(), scheduleEnd.getDate());
      
      // Formatear para datetime-local (YYYY-MM-DDTHH:MM)
      const formatDateTime = (date: Date, time: string) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T${time}`;
      };
      
      // Extraer solo la hora del turno
      const startTime = selectedSchedule.start_datetime.split('T')[1].substring(0, 5);
      const endTime = selectedSchedule.end_datetime.split('T')[1].substring(0, 5);
      
      setNewCourse({
        ...newCourse,
        schedule: scheduleId,
        start_datetime: formatDateTime(startDate, startTime),
        end_datetime: formatDateTime(endDate, endTime)
      });
    }
  };

  // Obtener nombre del día de la semana
  const getDayName = (dateString: string) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Obtener color del curso según su estado
  const getCourseColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#10b981'; // Verde
      case 'in_progress':
        return '#f59e0b'; // Naranja
      case 'completed':
        return '#6366f1'; // Azul
      case 'cancelled':
        return '#ef4444'; // Rojo
      default:
        return '#6b7280'; // Gris
    }
  };

  // Verificar si un turno ya tiene cursos asignados
  const getCoursesForSchedule = (scheduleId: number) => {
    // Buscar el turno específico para obtener sus fechas y horas
    const targetSchedule = schedules.find(s => s.id === scheduleId);
    if (!targetSchedule) {
      return [];
    }
    
    // Filtrar cursos que coincidan con la fecha, hora y sala del turno
    const scheduleCourses = courses.filter(course => {
      const courseStart = new Date(course.start_datetime);
      const courseEnd = new Date(course.end_datetime);
      const scheduleStart = new Date(targetSchedule.start_datetime);
      const scheduleEnd = new Date(targetSchedule.end_datetime);
      
      // Verificar que el curso esté en la misma fecha y sala
      const sameDate = courseStart.toDateString() === scheduleStart.toDateString();
      const sameRoom = course.room_name === targetSchedule.room_name;
      
      // Verificar que el curso esté dentro del horario del turno
      const withinSchedule = courseStart >= scheduleStart && courseEnd <= scheduleEnd;
      
      return sameDate && sameRoom && withinSchedule;
    });
    
    return scheduleCourses;
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
            <CustomSelect
              value={selectedMonitor ?? ''}
              placeholder="Todos los monitores"
              options={monitors.map(m => ({ value: m.id, label: m.full_name }))}
              onChange={(val) => setSelectedMonitor((val as number) ?? null)}
            />
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

          {/* Controles de vista combinada */}
          <div className="calendar-view-toggle">
            <button
              onClick={() => {
                setShowSchedules(!showSchedules);
                if (!showSchedules && !showCourses) setShowCourses(true);
              }}
              className={`view-toggle-btn ${showSchedules ? 'active' : ''}`}
              title={showSchedules ? 'Ocultar turnos' : 'Mostrar turnos'}
            >
              {showSchedules ? <Eye className="btn-icon" /> : <EyeOff className="btn-icon" />}
              Turnos
            </button>
            <button
              onClick={() => {
                setShowCourses(!showCourses);
                if (!showSchedules && !showCourses) setShowSchedules(true);
              }}
              className={`view-toggle-btn ${showCourses ? 'active' : ''}`}
              title={showCourses ? 'Ocultar cursos' : 'Mostrar cursos'}
            >
              {showCourses ? <Eye className="btn-icon" /> : <EyeOff className="btn-icon" />}
              Cursos
            </button>
          </div>

          {/* Botones de administración */}
          {canCreateSilent() && (
            <>
            <button
              onClick={() => openModal(new Date())}
              className="btn-create-schedule"
            >
              <Plus className="btn-icon" />
              Nuevo Turno
            </button>
              <button
                onClick={() => openCourseModal(new Date())}
                className="btn-course"
              >
                <BookOpen className="btn-icon" />
                Nuevo Curso
              </button>
            </>
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
                  const hourSchedules = showSchedules ? getSchedulesForHour(date, hour) : [];
                  const hourCourses = showCourses ? getCoursesForHour(date, hour) : [];
                  
                  return (
                    <div
                      key={hour}
                      className={`hour-cell ${!canCreateSilent() ? 'disabled' : ''}`}
                      onClick={() => {
                        if (canCreateSilent()) {
                          openActivitySelectionModal(date, hour);
                        }
                      }}
                    >
                      {/* Mostrar turnos */}
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
                      
                      {/* Mostrar cursos */}
                      {hourCourses.map((course, courseIndex) => {
                        // Calcular la duración del curso en horas
                        const courseStart = new Date(course.start_datetime);
                        const courseEnd = new Date(course.end_datetime);
                        const durationHours = (courseEnd.getTime() - courseStart.getTime()) / (1000 * 60 * 60);
                        
                        // Calcular posición y ancho para evitar superposición
                        const totalItems = hourSchedules.length + hourCourses.length;
                        const itemWidth = totalItems > 1 ? `${100 / totalItems}%` : '100%';
                        const itemLeft = totalItems > 1 ? `${((hourSchedules.length + courseIndex) * 100) / totalItems}%` : '0%';
                        
                        return (
                          <div
                            key={`course-${course.id}`}
                            className={`course-item ${course.status} clickable ${totalItems > 1 ? 'overlapping' : ''}`}
                            title={`${course.name} - ${course.monitor_name} - ${course.room_name} (${formatTime(course.start_datetime)} - ${formatTime(course.end_datetime)})${canEdit(true) ? ' - Haz clic para editar' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canEditSilent()) {
                                // Abrir modal de edición del curso
                                setSelectedCourse(course);
                                setShowEditCourseModal(true);
                              } else {
                                // Si no puede editar, mostrar detalles
                                setSelectedCourse(course);
                                setShowCourseDetailsModal(true);
                              }
                            }}
                            style={{
                              height: `${Math.max(durationHours * 4, 4)}rem`, // 4rem por hora, mínimo 4rem
                              width: itemWidth,
                              left: itemLeft,
                              zIndex: 10 + hourSchedules.length + courseIndex, // Z-index basado en el índice
                              position: 'absolute'
                            }}
                          >
                            <div className="course-status-indicator scheduled"></div>
                            <div className="schedule-title">
                              <BookOpen className="course-icon" size={12} />
                              {course.name}
                              {totalItems > 1 && (
                                <span className="schedule-count-badge">
                                  {hourSchedules.length + courseIndex + 1}/{totalItems}
                                </span>
                              )}
                            </div>
                            <div className="schedule-time">
                              {formatTime(course.start_datetime)} - {formatTime(course.end_datetime)}
                            </div>
                            <div className="schedule-room">
                              {course.room_name}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCourse(course.id);
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
                Actividades del {selectedDayDate.toLocaleDateString('es-ES', { 
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
              <div className="activities-container">
                {/* Acordeón de Turnos */}
                <div className="activities-column">
                  <div 
                    className={`activities-title ${schedulesExpanded ? 'active' : ''}`}
                    onClick={() => setSchedulesExpanded(!schedulesExpanded)}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Clock className="activities-icon" />
                      Turnos ({selectedDaySchedules.length})
                    </div>
                    <div className="activities-toggle">
                      {schedulesExpanded ? 'Ocultar' : 'Mostrar'}
                      <ChevronDown className={`activities-expand-icon ${schedulesExpanded ? 'expanded' : ''}`} />
                    </div>
                  </div>
                  <div className={`activities-content ${schedulesExpanded ? 'expanded' : ''}`}>
                    <div className="activities-content-inner">
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
                                      console.error('Error deleting schedule:', error);
                                      window.dispatchEvent(new CustomEvent('app-toast', {
                                        detail: { message: 'Error al eliminar el turno', type: 'error' }
                                      }));
                                    }
                                  },
                                  onCancel: () => {
                                    console.log('Eliminación cancelada');
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
                  </div>
                </div>

                {/* Acordeón de Cursos */}
                <div className="activities-column">
                  <div 
                    className={`activities-title ${coursesExpanded ? 'active' : ''}`}
                    onClick={() => setCoursesExpanded(!coursesExpanded)}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <BookOpen className="activities-icon" />
                      Cursos ({selectedDayCourses.length})
                    </div>
                    <div className="activities-toggle">
                      {coursesExpanded ? 'Ocultar' : 'Mostrar'}
                      <ChevronDown className={`activities-expand-icon ${coursesExpanded ? 'expanded' : ''}`} />
                    </div>
                  </div>
                  <div className={`activities-content ${coursesExpanded ? 'expanded' : ''}`}>
                    <div className="activities-content-inner">
                      {selectedDayCourses.length > 0 ? (
                        <div className="courses-list">
                      {selectedDayCourses.map(course => (
                        <div 
                          key={course.id} 
                          className="course-detail-item"
                          style={{
                            borderLeftColor: getCourseColor(course.status),
                            borderLeftWidth: '4px',
                            borderLeftStyle: 'solid'
                          }}
                        >
                          <div className="course-detail-time">
                            <Clock className="course-detail-icon" />
                            {formatTime(course.start_datetime)} - {formatTime(course.end_datetime)}
                          </div>
                          <div className="course-detail-info">
                            <div className="course-detail-name">
                              <BookOpen className="course-detail-icon" />
                              {course.name}
                            </div>
                            <div className="course-detail-description">
                              {course.description}
                            </div>
                            <div className="course-detail-monitor">
                              <User className="course-detail-icon" />
                              {course.monitor_name}
                            </div>
                            <div className="course-detail-room">
                              <MapPin className="course-detail-icon" />
                              {course.room_name}
                            </div>
                            <div className="course-detail-status">
                              <span className={`status-badge ${course.status}`}>
                                {course.status === 'scheduled' ? 'Programado' :
                                 course.status === 'in_progress' ? 'En Progreso' :
                                 course.status === 'completed' ? 'Completado' : 'Cancelado'}
                              </span>
                            </div>
                          </div>
                          <div className="course-detail-actions">
                            {canEditSilent() && (
                              <button
                                onClick={() => {
                                  closeSchedulesModal();
                                  // TODO: Implementar edición de curso
                                }}
                                className="btn-edit-course"
                                title="Editar curso"
                              >
                                <Edit className="btn-icon" />
                              </button>
                            )}
                            {canDeleteSilent() && (
                              <button
                                onClick={() => {
                                  // TODO: Implementar eliminación de curso
                                }}
                                className="btn-delete-course"
                                title="Eliminar curso"
                              >
                                <X className="btn-icon" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                        </div>
                      ) : (
                        <div className="no-courses">
                          <p>No hay cursos programados para este día.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Modal para crear curso */}
      {showCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content course-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <BookOpen className="modal-icon" />
                Nuevo Curso
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="modal-close"
              >
                <X className="close-icon" />
              </button>
      </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nombre del Curso *</label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Ej: Curso de Programación"
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label>Descripción *</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  className={`form-input ${formErrors.description ? 'error' : ''}`}
                  rows={3}
                  placeholder="Descripción del curso..."
                />
                {formErrors.description && (
                  <span className="error-message">{formErrors.description}</span>
                )}
              </div>

              <div className="form-group">
                <label>Sala *</label>
                <select
                  value={newCourse.room}
                  onChange={(e) => handleRoomChange(parseInt(e.target.value))}
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

              <div className="form-group">
                <label>Turno *</label>
                <select
                  value={newCourse.schedule}
                  onChange={(e) => handleScheduleChange(parseInt(e.target.value))}
                  className={`form-input ${formErrors.schedule ? 'error' : ''}`}
                  disabled={filteredSchedules.length === 0}
                >
                  <option value={0}>
                    {filteredSchedules.length === 0 ? 'Primero selecciona una sala' : 'Seleccionar turno'}
                  </option>
                  {filteredSchedules.map(schedule => {
                    const existingCourses = getCoursesForSchedule(schedule.id);
                    return (
                      <option key={schedule.id} value={schedule.id}>
                        {getDayName(schedule.start_datetime)} - {schedule.user_full_name} ({formatTime(schedule.start_datetime)} - {formatTime(schedule.end_datetime)}) {existingCourses.length > 0 ? `[${existingCourses.length} curso(s)]` : ''}
                      </option>
                    );
                  })}
                </select>
                {formErrors.schedule && (
                  <span className="error-message">{formErrors.schedule}</span>
                )}
                
                {/* Información del turno seleccionado */}
                {selectedScheduleInfo && (
                  <div style={{marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '0.375rem'}}>
                    <div style={{fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem'}}>
                      Información del Turno
                    </div>
                    <div style={{fontSize: '0.8rem', color: '#6b7280', lineHeight: '1.4'}}>
                      <div><strong>Monitor:</strong> {selectedScheduleInfo.user_full_name}</div>
                      <div><strong>Día:</strong> {getDayName(selectedScheduleInfo.start_datetime)}</div>
                      <div><strong>Horario:</strong> {formatTime(selectedScheduleInfo.start_datetime)} - {formatTime(selectedScheduleInfo.end_datetime)}</div>
                      <div><strong>Cursos existentes:</strong> {getCoursesForSchedule(selectedScheduleInfo.id).length}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora de inicio *</label>
                  <input
                    type="time"
                    value={selectedScheduleInfo ? newCourse.start_datetime.split('T')[1] : ''}
                    onChange={(e) => {
                      if (selectedScheduleInfo) {
                        const dateStr = newCourse.start_datetime.split('T')[0];
                        setNewCourse({...newCourse, start_datetime: `${dateStr}T${e.target.value}`});
                        validateCourseFormWithDebounce();
                      }
                    }}
                    className={`form-input ${formErrors.start_datetime ? 'error' : ''}`}
                    disabled={!selectedScheduleInfo}
                    min={selectedScheduleInfo ? selectedScheduleInfo.start_datetime.split('T')[1].substring(0, 5) : ''}
                    max={selectedScheduleInfo ? selectedScheduleInfo.end_datetime.split('T')[1].substring(0, 5) : ''}
                  />
                  {formErrors.start_datetime && (
                    <span className="error-message">{formErrors.start_datetime}</span>
                  )}
                  {selectedScheduleInfo && (
                    <div className="helper-text">
                      Horario disponible: {formatTime(selectedScheduleInfo.start_datetime)} - {formatTime(selectedScheduleInfo.end_datetime)}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Hora de fin *</label>
                  <input
                    type="time"
                    value={selectedScheduleInfo ? newCourse.end_datetime.split('T')[1] : ''}
                    onChange={(e) => {
                      if (selectedScheduleInfo) {
                        const dateStr = newCourse.end_datetime.split('T')[0];
                        setNewCourse({...newCourse, end_datetime: `${dateStr}T${e.target.value}`});
                        validateCourseFormWithDebounce();
                      }
                    }}
                    className={`form-input ${formErrors.end_datetime ? 'error' : ''}`}
                    disabled={!selectedScheduleInfo}
                    min={selectedScheduleInfo ? selectedScheduleInfo.start_datetime.split('T')[1].substring(0, 5) : ''}
                    max={selectedScheduleInfo ? selectedScheduleInfo.end_datetime.split('T')[1].substring(0, 5) : ''}
                  />
                  {formErrors.end_datetime && (
                    <span className="error-message">{formErrors.end_datetime}</span>
                  )}
                  {selectedScheduleInfo && (
                    <div className="helper-text">
                      Debe estar dentro del horario del turno
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  value={newCourse.status}
                  onChange={(e) => setNewCourse({...newCourse, status: e.target.value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'})}
                  className="form-input"
                >
                  <option value="scheduled">Programado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowCourseModal(false)}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={saveCourse}
                className="btn-save"
              >
                Guardar Curso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de curso */}
      {showEditCourseModal && selectedCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <BookOpen className="modal-icon" />
                Editar Curso
              </h3>
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="modal-close"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nombre del Curso *</label>
                <input
                  type="text"
                  value={editCourse.name || selectedCourse.name}
                  onChange={(e) => setEditCourse({...editCourse, name: e.target.value})}
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Ingresa el nombre del curso"
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label>Descripción *</label>
                <textarea
                  value={editCourse.description || selectedCourse.description}
                  onChange={(e) => setEditCourse({...editCourse, description: e.target.value})}
                  className={`form-input ${formErrors.description ? 'error' : ''}`}
                  placeholder="Describe el contenido del curso"
                  rows={3}
                />
                {formErrors.description && (
                  <span className="error-message">{formErrors.description}</span>
                )}
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  value={editCourse.status || selectedCourse.status}
                  onChange={(e) => setEditCourse({...editCourse, status: e.target.value as 'active' | 'inactive'})}
                  className="form-input"
                >
                  <option value="scheduled">Programado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={updateCourse}
                className="btn-save"
              >
                Actualizar Curso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de actividad */}
      {showActivitySelectionModal && selectedDayDate && (
        <div className="modal-overlay">
          <div className="modal-content activity-selection-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <Calendar className="modal-icon" />
                Crear Nueva Actividad
              </h3>
              <button
                onClick={closeActivitySelectionModal}
                className="modal-close"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <p className="activity-selection-text">
                ¿Qué tipo de actividad quieres crear para el {selectedDayDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} {selectedHour ? `a las ${selectedHour}` : ''}?
              </p>
              
              <div className="activity-options">
                <button
                  onClick={() => {
                    closeActivitySelectionModal();
                    openModal(selectedDayDate, selectedHour);
                  }}
                  className="activity-option-btn schedule-option"
                >
                  <Clock className="activity-option-icon" />
                  <div className="activity-option-content">
                    <h4>Nuevo Turno</h4>
                    <p>Asignar un monitor a una sala en un horario específico</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    closeActivitySelectionModal();
                    openCourseModal(selectedDayDate, selectedHour);
                  }}
                  className="activity-option-btn course-option"
                >
                  <BookOpen className="activity-option-icon" />
                  <div className="activity-option-content">
                    <h4>Nuevo Curso</h4>
                    <p>Crear un curso dentro de un turno existente</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={closeActivitySelectionModal}
                className="btn-cancel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ScheduleCalendar;