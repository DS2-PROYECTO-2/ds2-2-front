import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  Users, 
  Clock, 
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSecurity } from '../../hooks/useSecurity';
import { apiClient } from '../../utils/api';
import scheduleService from '../../services/scheduleService';
import { getAllEntriesUnpaginated } from '../../services/roomEntryService';
import roomService from '../../services/roomService';
import userManagementService from '../../services/userManagementService';
import monitorReportsService from '../../services/monitorReportsService';
import '../../styles/ReportsView.css';
import CustomSelect from './CustomSelect';
import '../../styles/MonitorReports.css';
import '../../styles/ExportFilters.css';
import '../../styles/ChartsFilters.css';

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

  interface ReportData {
    schedules: unknown[];
    entries: unknown[];
    lateArrivals: number;        // Card 1: Llegadas Tarde
    assignedHours: number;       // Card 2: Horas Asignadas
    workedHours: number;         // Card 3: Horas Trabajadas
    remainingHours: number;      // Card 4: Horas Faltantes
    
    // ✅ DATOS ESPECÍFICOS PARA GRÁFICOS CON SUPERPOSICIÓN
    workedHoursDetails?: unknown;    // Detalles de superposiciones
    overlapsFound?: Array<{
      entry_id: number;
      schedule_id: number;
      user: string;
      overlap_hours: number;
      entry_period: string;
      schedule_period: string;
    }>;
    userHours?: Record<string, number>; // Horas por usuario
    scheduleHours?: Record<string, number>; // Horas por turno
  }

const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useSecurity();
  
  // Determinar si el usuario es monitor (solo puede ver sus propios datos)
  const isMonitor = user?.role === 'monitor';
  
  // Estados para datos
  const [reportData, setReportData] = useState<ReportData>({
    schedules: [],
    entries: [],
    lateArrivals: 0,
    assignedHours: 0,
    workedHours: 0,
    remainingHours: 0
  });
  
  // Estados para filtros
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<number | null>(null);
  
  // Estados para selección de fechas específicas
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState<string>(''); // ✅ VACÍO INICIAL
  
  // Estados para opciones
  const [rooms, setRooms] = useState<Room[]>([]);
  const [monitors, setMonitors] = useState<MonitorUser[]>([]);
  
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para exportación de monitores
  const [exportFormat, setExportFormat] = useState<'pdf'>('pdf');
  const [exportTitle, setExportTitle] = useState('');
  const [selectedMonitorsForExport, setSelectedMonitorsForExport] = useState<number[]>([]);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [, setExportJobId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [showMonitorList, setShowMonitorList] = useState(false);
  const [exportCheckCount, setExportCheckCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Función para descargar archivo directamente (exportación síncrona)
  const downloadExportFile = async (blob: Blob, title: string) => {
    try {
      console.log('Descargando archivo directamente...');
      console.log('Tamaño del blob:', blob.size, 'bytes');
      console.log('Tipo del blob:', blob.type);
      
      // Validar que el blob no esté vacío
      if (blob.size === 0) {
        throw new Error('El archivo está vacío. No se pudo generar correctamente.');
      }
      
      // Determinar el Content-Type correcto si no está definido
      if (!blob.type) {
        const contentType = 'application/pdf';
        
        // Recrear el blob con el Content-Type correcto
        const newBlob = new Blob([blob], { type: contentType });
        blob = newBlob;
      }
      
      // Validación para archivos PDF
      console.log('Validando archivo PDF...');
      console.log('Tamaño del archivo:', blob.size, 'bytes');
      
      // Verificar tamaño mínimo para PDF
      if (blob.size < 1000) {
        throw new Error('El archivo PDF es demasiado pequeño y puede estar corrupto');
      }
      
      console.log('Validación PDF completada:', {
        tamaño: blob.size,
        tipo: 'PDF'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${title || 'export_monitores'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Archivo descargado exitosamente:', fileName);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      
      let errorMessage = `Error al descargar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      
      // Mensaje específico para archivos PDF dañados
      if (error instanceof Error && 
          (error.message.includes('corrupto') || error.message.includes('vacío') || error.message.includes('pequeño'))) {
        errorMessage = `❌ El archivo PDF está dañado o incompleto.\n\n💡 Soluciones:\n• Verifica que el backend esté funcionando correctamente\n• Contacta al administrador del sistema`;
      }
      
      setError(errorMessage + '. Por favor intente nuevamente.');
    }
  };

  // Función para iniciar exportación de monitores
  const handleExportMonitors = async () => {
    if (!exportTitle.trim()) {
      alert('Por favor ingrese un título para el reporte');
      return;
    }

    setIsExporting(true);
    setExportStatus('processing');
    setError(null);
    setExportCheckCount(0);
    setShowRetryButton(false);
    setRetryCountdown(0);

    try {
      const exportData = {
        format: exportFormat,
        title: exportTitle,
        // Si no se seleccionaron monitores específicos, exportar TODOS con datos completos
        include_all_data: selectedMonitorsForExport.length === 0,
        ...(selectedMonitorsForExport.length > 0 && { monitor_ids: selectedMonitorsForExport }),
        ...(exportStartDate && { start_date: exportStartDate }),
        ...(exportEndDate && { end_date: exportEndDate })
      };

      const response = await apiClient.post('/api/export/monitors/export/', exportData) as {
        export_job_id?: string;
        job_id?: string;
        id?: string;
        data?: {
          export_job_id?: string;
          job_id?: string;
          id?: string;
          job?: string;
        } | string | Blob;
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
      };
      
      console.log('Respuesta completa del backend:', response);
      console.log('Datos de la respuesta:', response.data);
      
      // Intentar diferentes formatos de respuesta
      let jobId = null;
      
      // Primero verificar si la respuesta está en el objeto raíz
      if (response.export_job_id) {
        jobId = response.export_job_id;
      }
      else if (response.job_id) {
        jobId = response.job_id;
      }
      else if (response.id) {
        jobId = response.id;
      }
      else if (typeof response === 'string') {
        jobId = response;
      }
      // Luego verificar en response.data
      else if (response.data) {
        // Formato 1: response.data.export_job_id
        if (response.data.export_job_id) {
          jobId = response.data.export_job_id;
        }
        // Formato 2: response.data.job_id
        else if (response.data.job_id) {
          jobId = response.data.job_id;
        }
        // Formato 3: response.data.id
        else if (response.data.id) {
          jobId = response.data.id;
        }
        // Formato 4: response.data directamente
        else if (typeof response.data === 'string') {
          jobId = response.data;
        }
        // Formato 5: response.data.job
        else if (response.data.job) {
          jobId = response.data.job;
        }
      }
      
      if (jobId) {
        console.log('Job ID encontrado:', jobId);
        setExportJobId(jobId);
        checkExportStatus(jobId);
      } else {
        // Verificar si la respuesta contiene directamente el archivo (exportación síncrona)
        if (response.data && (response.data instanceof Blob || response.data.type)) {
          console.log('Exportación síncrona detectada, descargando archivo directamente');
          downloadExportFile(response.data, exportTitle);
          setExportStatus('completed');
          setIsExporting(false);
        } else {
          console.error('No se encontró job_id en la respuesta:', response);
          console.error('Estructura de la respuesta:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
          });
          throw new Error(`No se recibió ID de trabajo de exportación. Respuesta recibida: ${JSON.stringify(response.data)}`);
        }
      }
    } catch (error) {
      console.error('Error al iniciar exportación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al iniciar la exportación: ${errorMessage}. Por favor verifique que el backend esté funcionando correctamente.`);
      setExportStatus('error');
      setIsExporting(false);
    }
  };

  // Función para verificar el estado de la exportación
  const checkExportStatus = async (jobId: string) => {
    try {
      const response = await apiClient.get(`/api/export/jobs/${jobId}/status/`) as {
        status?: string;
        data?: {
          status?: string;
        } | string;
        error_message?: string;
      };
      
      console.log('Respuesta de verificación de estado:', response);
      console.log('Datos de verificación:', response.data);
      
      // Intentar diferentes formatos de respuesta para el status
      let status = null;
      
      // Primero verificar en el objeto raíz
      if (response.status) {
        status = response.status;
      }
      // Luego verificar en response.data
      else if (response.data && response.data.status) {
        status = response.data.status;
      }
      // También verificar si response.data es directamente el status
      else if (response.data && typeof response.data === 'string') {
        status = response.data;
      }
      
      console.log('Status encontrado:', status);
      
      if (status === 'completed') {
        setExportStatus('completed');
        setIsExporting(false);
        downloadExport(jobId);
      } else if (status === 'failed' || status === 'error') {
        setExportStatus('error');
        setIsExporting(false);
        
        // Intentar obtener el mensaje de error específico del backend
        let errorMessage = 'Error al procesar la exportación';
        let shouldShowRetry = false;
        
        if (response.error_message) {
          const backendError = response.error_message;
          errorMessage = `Error del servidor: ${backendError}`;
          
          // Detectar errores específicos que pueden resolverse con reintentos
          if (backendError.includes('WinError 32') || 
              backendError.includes('está siendo utilizado por otro proceso') ||
              backendError.includes('PermissionError') ||
              backendError.includes('acceso al archivo')) {
            errorMessage = `⚠️ Error de permisos de archivo: ${backendError}\n\n💡 Soluciones:\n• Espera 30 segundos y reintenta (el antivirus puede estar escaneando)\n• Ejecuta el backend como administrador\n• Desactiva temporalmente Windows Defender\n• Cierra cualquier programa que pueda estar usando archivos PDF/Excel\n• Intenta exportar nuevamente`;
            shouldShowRetry = true;
          }
        } else if (response.data && response.data.error_message) {
          const backendError = response.data.error_message;
          errorMessage = `Error del servidor: ${backendError}`;
          
          if (backendError.includes('WinError 32') || 
              backendError.includes('está siendo utilizado por otro proceso') ||
              backendError.includes('PermissionError') ||
              backendError.includes('acceso al archivo')) {
            errorMessage = `⚠️ Error de permisos de archivo: ${backendError}\n\n💡 Soluciones:\n• Espera 30 segundos y reintenta (el antivirus puede estar escaneando)\n• Ejecuta el backend como administrador\n• Desactiva temporalmente Windows Defender\n• Cierra cualquier programa que pueda estar usando archivos PDF/Excel\n• Intenta exportar nuevamente`;
            shouldShowRetry = true;
          }
        }
        
        setError(errorMessage);
        console.error('Error específico del backend:', response.error_message || response.data?.error_message);
        
        // Si es un error de permisos, mostrar el botón de reintento después de un delay
        if (shouldShowRetry) {
          setRetryCountdown(30); // 30 segundos de countdown
          const countdownInterval = setInterval(() => {
            setRetryCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                setShowRetryButton(true);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        // Verificar si hemos excedido el límite de verificaciones (máximo 30 intentos = 1 minuto)
        if (exportCheckCount >= 30) {
          console.log('Timeout: Se excedió el tiempo máximo de espera para la exportación');
          setExportStatus('error');
          setIsExporting(false);
          setError('Timeout: La exportación está tomando demasiado tiempo. Por favor intente nuevamente.');
          setExportCheckCount(0);
        } else {
          // Seguir verificando cada 2 segundos
          console.log(`Status en progreso, verificando nuevamente en 2 segundos... (intento ${exportCheckCount + 1}/30)`);
          setExportCheckCount(prev => prev + 1);
          setTimeout(() => checkExportStatus(jobId), 2000);
        }
      }
    } catch (error) {
      console.error('Error al verificar estado de exportación:', error);
      setExportStatus('error');
      setIsExporting(false);
      setError('Error al verificar el estado de la exportación');
    }
  };

  // Función para descargar el archivo exportado
  const downloadExport = async (jobId: string) => {
    try {
      console.log('Iniciando descarga del archivo...');
      const response = await apiClient.get(`/api/export/jobs/${jobId}/download/`) as {
        data?: string | Blob | ArrayBuffer;
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
      };
      
      console.log('Respuesta de descarga recibida:', response);
      console.log('Tipo de respuesta:', typeof response);
      console.log('Tipo de response.data:', typeof response.data);
      console.log('Tamaño de response.data:', response.data?.length || response.data?.size || 'desconocido');
      
      // El backend está devolviendo el contenido del PDF directamente en response (no en response.data)
      let fileData = response;
      
      // Si response es un string (contenido del PDF), usarlo directamente
      if (typeof fileData === 'string') {
        console.log('PDF recibido como string, procesando...');
        console.log('Tamaño del string PDF:', fileData.length, 'caracteres');
      } else if (response.data) {
        console.log('PDF recibido en response.data, procesando...');
        fileData = response.data;
      } else {
        console.log('Estructura de respuesta inesperada:', Object.keys(response));
        throw new Error('No se pudo encontrar el contenido del archivo en la respuesta');
      }
      
      // Si response.data es un string (contenido del PDF), convertirlo a Uint8Array
      if (typeof fileData === 'string') {
        console.log('Convirtiendo string a Uint8Array...');
        const encoder = new TextEncoder();
        fileData = encoder.encode(fileData);
      }
      
      // Validar que hay datos
      if (!fileData || fileData.length === 0) {
        throw new Error('El archivo está vacío o no se pudo generar correctamente');
      }
      
      console.log('Datos del archivo procesados, tamaño:', fileData.length, 'bytes');
      
      // Content-Type para PDF
      const contentType = 'application/pdf';
      
      // Crear blob con el Content-Type correcto
      const blob = new Blob([fileData], { type: contentType });
      
      // Validar que el blob se creó correctamente
      if (blob.size === 0) {
        throw new Error('No se pudo crear el archivo. El contenido está vacío');
      }
      
      console.log('Blob creado exitosamente, tamaño:', blob.size, 'bytes');
      
      // Validación para archivos PDF
      console.log('Validación PDF:', {
        tamaño: fileData.length,
        tipo: 'PDF'
      });
      
      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre de archivo para PDF
      const fileName = `${exportTitle || 'export_monitores'}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = fileName;
      
      // Agregar al DOM y hacer click
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Archivo descargado exitosamente:', fileName);
      
      // Resetear estado
      setExportJobId(null);
      setExportStatus('idle');
      setExportTitle('');
      setSelectedMonitorsForExport([]);
      setExportStartDate('');
      setExportEndDate('');
      
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      setError(`Error al descargar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor intente nuevamente.`);
      setExportStatus('error');
    }
  };

  // ✅ Función para manejar cambios de período
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'all') => {
    setSelectedPeriod(newPeriod);
    
    // Limpiar datos cuando se cambia de período
    setReportData({
      schedules: [],
      entries: [],
      lateArrivals: 0,
      assignedHours: 0,
        workedHours: 0,
      remainingHours: 0
    });
    
    // Si se cambia a semana, limpiar semana seleccionada
    if (newPeriod === 'week') {
      setSelectedWeek('');
    }
    
    setLoading(false); // ✅ CORRECCIÓN: Establecer loading en false
  };

  // ✅ Función para manejar cambios de semana
  const handleWeekChange = (newWeek: string) => {
    setSelectedWeek(newWeek);
    
    // Limpiar datos cuando se cambia de semana
    setReportData({
      schedules: [],
      entries: [],
      lateArrivals: 0,
      assignedHours: 0,
        workedHours: 0,
      remainingHours: 0
    });
    
    setLoading(false); // ✅ CORRECCIÓN: Establecer loading en false
  };

  // Función para convertir formato de semana (YYYY-WXX) a fechas
  const getWeekDates = (weekString: string) => {
    // Formato: "2025-W40" -> extraer año y semana
    const [year, week] = weekString.split('-W').map(Number);
    
    
    // Usar el algoritmo ISO 8601 para calcular la semana
    // La semana 1 es la primera semana que contiene al menos 4 días del año
    const jan4 = new Date(year, 0, 4); // 4 de enero
    const jan4DayOfWeek = jan4.getDay(); // 0 = domingo, 1 = lunes, etc.
    const daysToMonday = (jan4DayOfWeek + 6) % 7; // Días hasta el lunes
    
    // Calcular el lunes de la semana 1
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - daysToMonday);
    
    // Calcular el lunes de la semana seleccionada
    const weekStart = new Date(week1Monday);
    weekStart.setDate(week1Monday.getDate() + (week - 1) * 7);
    
    // Calcular el domingo de la semana seleccionada
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Formatear fechas
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const result = {
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
      weekStart,
      weekEnd
    };
    
    
    return result;
  };


  // ✅ ELIMINADAS: Funciones de cálculo locales (ahora se usa endpoint del backend)

  // ✅ RESTAURADA: Cargar datos usando endpoints existentes
  const loadReportData = useCallback(async (isFilterChange = false) => {
    try {
      if (isFilterChange) {
        setIsFiltering(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let dateFrom: string | undefined;
      let dateTo: string | undefined;

      // 🔍 LÓGICA DE FILTRADO POR PERÍODO
      if (selectedPeriod === 'week') {
        if (selectedWeek) {
          const weekDates = getWeekDates(selectedWeek);
          dateFrom = weekDates.start;
          dateTo = weekDates.end;
          
        } else {
          setReportData({
            schedules: [],
            entries: [],
            lateArrivals: 0,
            assignedHours: 0,
            workedHours: 0,
            remainingHours: 0
          });
          setLoading(false);
          return;
        }
      } else if (selectedPeriod === 'month') {
        const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0);
        
        dateFrom = `${firstDayOfMonth.getFullYear()}-${String(firstDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfMonth.getDate()).padStart(2, '0')}`;
        dateTo = `${lastDayOfMonth.getFullYear()}-${String(lastDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;
        
      }
      // Para 'all' no se establecen fechas (cargar todo)



      // 📡 LLAMAR AL ENDPOINT DE ESTADÍSTICAS DEL BACKEND
      const params = new URLSearchParams();
      if (dateFrom) params.append('from_date', dateFrom);
      if (dateTo) params.append('to_date', dateTo);
      
      // 🔒 FILTRADO AUTOMÁTICO POR ROL
      if (isMonitor) {
        // Los monitores solo ven sus propios datos
        params.append('user_id', user?.id.toString() || '');
      } else {
        // Los administradores pueden filtrar por monitor específico
        if (selectedMonitor) params.append('user_id', selectedMonitor.toString());
      }
      
      if (selectedRoom) params.append('room_id', selectedRoom.toString());



      // 📡 CARGAR DATOS CON MANEJO DE PERMISOS POR ROL
      let statsData, workedHoursData, schedulesData, entriesData;

      if (isMonitor) {
        // 🔒 SERVICIO ESPECÍFICO PARA MONITORES CON FALLBACKS
        [statsData, workedHoursData, schedulesData, entriesData] = await Promise.all([
          // 1. Estadísticas del monitor con fallback
          monitorReportsService.getMonitorStats(params),
          // 2. Horas trabajadas del monitor con fallback
          monitorReportsService.getMonitorWorkedHours(params),
          // 3. Schedules del monitor
          monitorReportsService.getMonitorSchedules(params, user?.id || 0),
          // 4. Entries del monitor con filtros
          monitorReportsService.getMonitorEntries(params)
        ]);
      } else {
        // 🔓 ENDPOINTS COMPLETOS PARA ADMINISTRADORES
        [statsData, workedHoursData, schedulesData, entriesData] = await Promise.all([
          // 1. Estadísticas del backend para las cards
          apiClient.get(`/api/rooms/reports/stats/?${params.toString()}`) as Promise<{
            late_arrivals_count: number;
            total_assigned_hours: number;
            total_worked_hours: number;
            remaining_hours: number;
          }>,
          // 2. ✅ HORAS TRABAJADAS CON SUPERPOSICIÓN PARA GRÁFICOS
          apiClient.get(`/api/rooms/reports/worked-hours/?${params.toString()}`) as Promise<{
            total_worked_hours: number;
            total_assigned_hours: number;
            compliance_percentage: number;
            overlaps_found: Array<{
              entry_id: number;
              schedule_id: number;
              user: string;
              overlap_hours: number;
              entry_period: string;
              schedule_period: string;
            }>;
            user_hours: Record<string, number>;
            schedule_hours: Record<string, number>;
          }>,
          // 3. Schedules para los gráficos
          scheduleService.getSchedules({
            date_from: dateFrom,
            date_to: dateTo,
            room: selectedRoom || undefined,
            user: selectedMonitor || undefined
          }),
          // 4. Entries para los gráficos (solo para estructura y fechas)
          getAllEntriesUnpaginated({
            from: dateFrom,
            to: dateTo,
            room: selectedRoom || undefined,
            user_name: selectedMonitor ? monitors.find(m => m.id === selectedMonitor)?.username : undefined,
            active: undefined,
            document: undefined
          })
        ]);
      }
      


      // ✅ USAR DATOS DEL BACKEND PARA CARDS + DATOS PARA GRÁFICOS
      setReportData({
        schedules: schedulesData,  // Para gráficos
        entries: entriesData,       // Para gráficos
        lateArrivals: statsData.late_arrivals_count || 0,      // Card 1: Llegadas Tarde
        assignedHours: statsData.total_assigned_hours || 0,    // Card 2: Horas Asignadas
        workedHours: statsData.total_worked_hours || 0,        // Card 3: Horas Trabajadas ← CORRECTO
        remainingHours: statsData.remaining_hours || 0,        // Card 4: Horas Faltantes
        
        // ✅ DATOS ESPECÍFICOS PARA GRÁFICOS CON SUPERPOSICIÓN
        workedHoursDetails: workedHoursData, // Detalles de superposiciones
        overlapsFound: workedHoursData.overlaps_found || [], // Superposiciones encontradas
        userHours: workedHoursData.user_hours || {}, // Horas por usuario
        scheduleHours: workedHoursData.schedule_hours || {} // Horas por turno
      });

    } catch (err: unknown) {
      const error = err as Error;
      
      // 🔒 MANEJO ESPECÍFICO DE ERRORES DE PERMISOS PARA MONITORES
      if (isMonitor && (error.message.includes('permiso') || error.message.includes('permission') || error.message.includes('403'))) {
        setError('Los reportes detallados no están disponibles para tu rol. Contacta al administrador si necesitas acceso a estadísticas específicas.');
      } else {
        setError(error.message || 'Error al cargar los datos');
      }
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  }, [selectedPeriod, selectedRoom, selectedMonitor, selectedYear, selectedMonth, selectedWeek, user?.id, monitors, isMonitor]);

  // Cargar opciones (salas y monitores)
  const loadOptions = useCallback(async () => {
    try {
      // Cargar salas
      const roomsData = await roomService.getRooms();
      setRooms(Array.isArray(roomsData) ? roomsData : []);

      // 🔒 FILTRADO POR ROL
      if (isMonitor) {
        // Los monitores no necesitan ver otros monitores
        setMonitors([]);
      } else if (isAdmin) {
        // Solo los administradores pueden ver otros monitores
        const usersData = await userManagementService.getUsers({ role: 'monitor' });
        const validMonitors = Array.isArray(usersData) ? 
          usersData.filter(user => 
            user.role === 'monitor' && 
            user.is_active === true &&
            user.is_verified === true
          ) : [];
        setMonitors(validMonitors);
      }
    } catch {
      // Error loading options
    }
  }, [isAdmin, isMonitor]);

  // Efectos
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // ✅ Efecto para cargar datos cuando cambien los filtros
  useEffect(() => {
    // Solo cargar datos si hay filtros válidos
    if (selectedPeriod === 'week' && !selectedWeek) {
      setLoading(false); // ✅ CORRECCIÓN: Establecer loading en false
      return;
    }
    
    if (selectedPeriod === 'month' && (!selectedMonth || !selectedYear)) {
      setLoading(false); // ✅ CORRECCIÓN: Establecer loading en false
      return;
    }
    
    // Cargar datos solo si hay filtros válidos
    loadReportData(true); // true = es un cambio de filtro
  }, [selectedPeriod, selectedWeek, selectedMonth, selectedYear, selectedRoom, selectedMonitor, loadReportData]);

  // ✅ Efecto para limpiar datos cuando se cambia de período
  useEffect(() => {
    if (selectedPeriod === 'week' && !selectedWeek) {
      setReportData({
        schedules: [],
        entries: [],
        lateArrivals: 0,
        assignedHours: 0,
        workedHours: 0,
        remainingHours: 0
      });
      setLoading(false); // ✅ CORRECCIÓN: Establecer loading en false
    }
  }, [selectedPeriod, selectedWeek, isMonitor]);

  // ✅ OPTIMIZADO: Gráfico de entradas y salidas con mejor rendimiento
  const entriesExitsData = useMemo(() => {
    if (!reportData.entries.length) return [];
    
    const dateData = new Map<string, { entradas: number; salidas: number }>();
    
    // ✅ APLICAR FILTROS DE FECHA ADICIONALES SI ES NECESARIO
    const currentDateFrom = selectedPeriod === 'week' && selectedWeek ? 
      getWeekDates(selectedWeek).start : 
      selectedPeriod === 'month' ? 
        `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01` : 
        null;
    
    const currentDateTo = selectedPeriod === 'week' && selectedWeek ? 
      getWeekDates(selectedWeek).end : 
      selectedPeriod === 'month' ? 
        `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}` : 
        null;
    
    // ✅ OPTIMIZACIÓN: Procesar en una sola pasada con cache de fechas
    for (const entry of reportData.entries as Array<{ 
      startedAt?: string; 
      entry_time?: string; 
      created_at?: string;
      endedAt?: string; 
      exit_time?: string;
      room?: number;
      room_id?: number;
      roomName?: string;
      room_name?: string;
      [key: string]: unknown 
    }>) {
      // ✅ MANEJAR DIFERENTES FORMATOS DE FECHA
      const entryTime = entry.startedAt || entry.entry_time || entry.created_at;
      const exitTime = entry.endedAt || entry.exit_time;
      
      if (!entryTime) continue;
      
      // ✅ APLICAR FILTRO POR SALA SI ESTÁ SELECCIONADA
      if (selectedRoom) {
        const entryRoomId = entry.room || entry.room_id;
        if (entryRoomId && entryRoomId !== selectedRoom) {
          continue;
        }
      }
      
      // ✅ APLICAR FILTRO POR MONITOR SI ESTÁ SELECCIONADO
      if (selectedMonitor) {
        const entryUserId = entry.user_id || entry.user || entry.userId;
        if (entryUserId && entryUserId !== selectedMonitor) {
          continue;
        }
      }
      
      // ✅ OPTIMIZACIÓN: Cache de fechas para evitar recálculos
      const date = new Date(entryTime);
      if (isNaN(date.getTime())) continue;
      
      // ✅ APLICAR FILTROS DE FECHA ADICIONALES
      if (currentDateFrom && currentDateTo) {
        const entryDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (entryDateStr < currentDateFrom || entryDateStr > currentDateTo) {
          continue;
        }
      }
      
      const dateKey = `${date.getDate()}/${date.getMonth() + 1}`;
      
      // ✅ OPTIMIZACIÓN: Usar Map para mejor rendimiento
      if (!dateData.has(dateKey)) {
        dateData.set(dateKey, { entradas: 0, salidas: 0 });
      }
      
      const stats = dateData.get(dateKey)!;
      stats.entradas++;
      
      if (exitTime) {
        stats.salidas++;
      }
    }

    // ✅ OPTIMIZACIÓN: Ordenar más eficientemente con cache
    const sortedDates = Array.from(dateData.keys()).sort((a, b) => {
      const [dayA] = a.split('/').map(Number);
      const [dayB] = b.split('/').map(Number);
      return dayA - dayB;
    });

    return sortedDates.map(date => {
      const stats = dateData.get(date)!;
      return {
        dia: date,
        entradas: stats.entradas,
        salidas: stats.salidas
      };
    });
  }, [reportData.entries, selectedPeriod, selectedWeek, selectedYear, selectedMonth, selectedRoom, selectedMonitor]);

  // ✅ OPTIMIZADO: Gráfico de horas por día con datos de superposición
  const hoursData = useMemo(() => {
    // ✅ USAR DATOS DEL ENDPOINT DE SUPERPOSICIÓN
    const overlapsFound = reportData.overlapsFound || [];
    
    const dateHours = new Map<string, number>();
    
    // ✅ APLICAR FILTROS DE FECHA ADICIONALES SI ES NECESARIO
    const currentDateFrom = selectedPeriod === 'week' && selectedWeek ? 
      getWeekDates(selectedWeek).start : 
      selectedPeriod === 'month' ? 
        `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01` : 
        null;
    
    const currentDateTo = selectedPeriod === 'week' && selectedWeek ? 
      getWeekDates(selectedWeek).end : 
      selectedPeriod === 'month' ? 
        `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}` : 
        null;
    
    // ✅ FALLBACK: Si no hay superposiciones, calcular desde entries
    if (!overlapsFound.length) {
      // Calcular horas desde entries para monitores
      for (const entry of reportData.entries as Array<{ 
        startedAt?: string; 
        entry_time?: string; 
        created_at?: string;
        endedAt?: string; 
        exit_time?: string;
        room?: number;
        room_id?: number;
        roomName?: string;
        room_name?: string;
        [key: string]: unknown 
      }>) {
        const entryTime = entry.startedAt || entry.entry_time || entry.created_at;
        const exitTime = entry.endedAt || entry.exit_time;
        
        if (!entryTime || !exitTime) continue;
        
        // ✅ APLICAR FILTRO POR SALA SI ESTÁ SELECCIONADA
        if (selectedRoom) {
          const entryRoomId = entry.room || entry.room_id;
          if (entryRoomId && entryRoomId !== selectedRoom) {
            continue;
          }
        }
        
        // ✅ APLICAR FILTRO POR MONITOR SI ESTÁ SELECCIONADO
        if (selectedMonitor) {
          const entryUserId = entry.user_id || entry.user || entry.userId;
          if (entryUserId && entryUserId !== selectedMonitor) {
            continue;
          }
        }
        
        try {
          const start = new Date(entryTime);
          const end = new Date(exitTime);
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;
          
          // ✅ APLICAR FILTROS DE FECHA ADICIONALES
          if (currentDateFrom && currentDateTo) {
            const entryDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
            if (entryDateStr < currentDateFrom || entryDateStr > currentDateTo) {
              continue;
            }
          }
          
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (hours <= 0) continue;
          
          const dateKey = `${start.getDate()}/${start.getMonth() + 1}`;
          const currentHours = dateHours.get(dateKey) || 0;
          dateHours.set(dateKey, currentHours + hours);
        } catch {
          continue;
        }
      }
      
      // Si aún no hay datos, retornar array vacío
      if (dateHours.size === 0) return [];
    }
    
    // ✅ PROCESAR SOLO SUPERPOSICIONES VÁLIDAS
    for (const overlap of overlapsFound) {
      // ✅ CORRECCIÓN: Extraer fecha correctamente del entry_period
      let entryDate: Date;
      
      try {
        // Intentar parsear como fecha completa primero
        const periodStart = overlap.entry_period.split(' - ')[0];
        
        // Si contiene fecha (formato: YYYY-MM-DD HH:MM)
        if (periodStart.includes('-') && periodStart.includes(' ')) {
          entryDate = new Date(periodStart);
        } else {
          // Si solo tiene hora, usar la fecha de la entrada original
          const entry = reportData.entries.find((e: unknown) => 
            e && typeof e === 'object' && 'id' in e && (e as { id: number }).id === overlap.entry_id
          ) as { startedAt: string } | undefined;
          if (entry) {
            entryDate = new Date(entry.startedAt);
          } else {
            // Fallback: usar fecha actual
            entryDate = new Date();
          }
        }
      } catch {
        // Fallback: usar fecha actual
        entryDate = new Date();
      }
      
      const dateKey = `${entryDate.getDate()}/${entryDate.getMonth() + 1}`;
      
      // ✅ USAR HORAS DE SUPERPOSICIÓN REALES
      const currentHours = dateHours.get(dateKey) || 0;
      dateHours.set(dateKey, currentHours + overlap.overlap_hours);
    }

    // ✅ OPTIMIZACIÓN: Ordenar más eficientemente
    const sortedDates = Array.from(dateHours.keys()).sort((a, b) => {
      const [dayA] = a.split('/').map(Number);
      const [dayB] = b.split('/').map(Number);
      return dayA - dayB;
    });

    return sortedDates.map(date => {
      const hours = dateHours.get(date) || 0;
      return {
      dia: date,
        horas: Math.round(hours * 100) / 100 // ✅ OPTIMIZACIÓN: Redondear solo al final
      };
    });
  }, [reportData.overlapsFound, reportData.entries, selectedPeriod, selectedWeek, selectedYear, selectedMonth, selectedRoom, selectedMonitor]);

  // ✅ OPTIMIZADO: Gráfico de distribución por sala con datos de superposición
  const roomDistributionData = useMemo(() => {
    // ✅ USAR DATOS DEL ENDPOINT DE SUPERPOSICIÓN
    const overlapsFound = reportData.overlapsFound || [];
    
    const roomStats = new Map<string, { totalHours: number; totalEntries: number; activeEntries: number }>();
    
    // ✅ APLICAR FILTROS DE FECHA ADICIONALES SI ES NECESARIO
    const currentDateFrom = selectedPeriod === 'week' && selectedWeek ? 
      getWeekDates(selectedWeek).start : 
      selectedPeriod === 'month' ? 
        `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01` : 
        null;
    
    const currentDateTo = selectedPeriod === 'week' && selectedWeek ? 
      getWeekDates(selectedWeek).end : 
      selectedPeriod === 'month' ? 
        `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}` : 
        null;
    
    // ✅ FALLBACK: Si no hay superposiciones, calcular desde entries
    if (!overlapsFound.length) {
      // Calcular desde entries para monitores
      for (const entry of reportData.entries as Array<{ 
        startedAt?: string; 
        entry_time?: string; 
        created_at?: string;
        endedAt?: string; 
        exit_time?: string;
        roomName?: string;
        room_name?: string;
        room?: string;
        room_id?: number;
        [key: string]: unknown 
      }>) {
        const roomName = entry.roomName || entry.room_name || entry.room || 'Sala Desconocida';
        const entryTime = entry.startedAt || entry.entry_time || entry.created_at;
        const exitTime = entry.endedAt || entry.exit_time;
        
        if (!entryTime) continue;
        
        // ✅ APLICAR FILTRO POR SALA SI ESTÁ SELECCIONADA
        if (selectedRoom) {
          const entryRoomId = entry.room_id || entry.room;
          if (entryRoomId && entryRoomId !== selectedRoom) {
            continue;
          }
        }
        
        // ✅ APLICAR FILTRO POR MONITOR SI ESTÁ SELECCIONADO
        if (selectedMonitor) {
          const entryUserId = entry.user_id || entry.user || entry.userId;
          if (entryUserId && entryUserId !== selectedMonitor) {
            continue;
          }
        }
        
        // ✅ APLICAR FILTROS DE FECHA ADICIONALES
        if (currentDateFrom && currentDateTo) {
          const entryDate = new Date(entryTime);
          if (!isNaN(entryDate.getTime())) {
            const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
            if (entryDateStr < currentDateFrom || entryDateStr > currentDateTo) {
              continue;
            }
          }
        }
        
        if (!roomStats.has(roomName)) {
          roomStats.set(roomName, { totalHours: 0, totalEntries: 0, activeEntries: 0 });
        }
        
        const stats = roomStats.get(roomName)!;
        stats.totalEntries++;
        
        // Calcular horas si hay tiempo de salida
        if (exitTime) {
          try {
            const start = new Date(entryTime);
            const end = new Date(exitTime);
            
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              if (hours > 0) {
                stats.totalHours += hours;
              }
            }
          } catch {
            // Ignorar errores de fecha
          }
        } else {
          // Entrada activa
          stats.activeEntries++;
        }
      }
      
      // Si aún no hay datos, retornar array vacío
      if (roomStats.size === 0) return [];
    }
    
    // ✅ PROCESAR SOLO SUPERPOSICIONES VÁLIDAS
    for (const overlap of overlapsFound) {
      // Obtener información de la sala desde la entrada
      const entry = reportData.entries.find((e: unknown) => 
        e && typeof e === 'object' && 'id' in e && (e as { id: number }).id === overlap.entry_id
      ) as { roomName?: string; roomId?: number; endedAt?: string } | undefined;
      if (!entry) continue;
      
      const roomName = entry.roomName || `Sala ${entry.roomId}`;
      
      // ✅ OPTIMIZACIÓN: Usar Map para mejor rendimiento
      if (!roomStats.has(roomName)) {
        roomStats.set(roomName, { totalHours: 0, totalEntries: 0, activeEntries: 0 });
      }
      
      const stats = roomStats.get(roomName)!;
      
      // ✅ USAR HORAS DE SUPERPOSICIÓN REALES
      stats.totalHours += overlap.overlap_hours;
      stats.totalEntries++;
      
      // Verificar si es entrada activa
      if (!entry.endedAt) {
        stats.activeEntries++;
      }
    }

    // ✅ MEJORADO: Colores más contrastantes y distinguibles
    const colors = [
      '#8B5CF6', // Púrpura
      '#F59E0B', // Naranja
      '#EF4444', // Rojo
      '#06B6D4', // Cian
      '#84CC16', // Verde
      '#EC4899', // Rosa
      '#10B981', // Verde esmeralda
      '#3B82F6', // Azul
      '#F97316', // Naranja brillante
      '#8B5A2B'  // Marrón
    ];
    
    // ✅ CORRECCIÓN: Lógica especial cuando se filtra por sala específica
    if (selectedRoom) {
      // Si se filtra por una sala específica, mostrar solo esa sala como 100%
      const selectedRoomName = rooms.find(r => r.id === selectedRoom)?.name || `Sala ${selectedRoom}`;
      const selectedRoomStats = roomStats.get(selectedRoomName);
      
      if (selectedRoomStats && selectedRoomStats.totalEntries > 0) {
        // ✅ CORRECCIÓN: Mostrar gráfica si hay entradas, aunque las horas sean 0
        // Si las horas son 0, usar un valor mínimo para que se vea en la gráfica
        const displayValue = selectedRoomStats.totalHours > 0 ? 
          Math.round(selectedRoomStats.totalHours * 100) / 100 : 
          0.01; // Valor mínimo para visualización
        
        const result = [{
          name: selectedRoomName,
          value: displayValue,
          fill: colors[0],
          entries: selectedRoomStats.totalEntries,
          active: selectedRoomStats.activeEntries
        }];
        
        return result;
      } else {
        // Si no hay datos para la sala filtrada, mostrar mensaje
        return [];
      }
    }
    
    // ✅ MEJORADO: Mostrar todas las salas individualmente sin agrupar
    const totalHours = Array.from(roomStats.values()).reduce((sum, stats) => sum + stats.totalHours, 0);
    
    const result = Array.from(roomStats.entries())
      .filter(([, stats]) => stats.totalEntries > 0)
      .map(([room, stats], index) => {
        const displayValue = stats.totalHours > 0 ? 
          Math.round(stats.totalHours * 100) / 100 : 
          0.01;
        
        const percentage = totalHours > 0 ? (stats.totalHours / totalHours) * 100 : 0;
        
        return {
          name: room,
          value: displayValue,
          fill: colors[index % colors.length],
          entries: stats.totalEntries,
          active: stats.activeEntries,
          percentage: percentage
        };
      })
      .sort((a, b) => b.value - a.value);
    
    return result;
  }, [reportData.overlapsFound, reportData.entries, selectedRoom, rooms, selectedPeriod, selectedWeek, selectedYear, selectedMonth, selectedMonitor]);



  // Función para obtener el título del gráfico basado en el filtro
  const getChartTitle = (baseTitle: string) => {
    let title = baseTitle;
    
    // Agregar período al título
    if (selectedPeriod === 'week') {
      title = `${baseTitle} (Esta Semana)`;
    } else if (selectedPeriod === 'month') {
      title = `${baseTitle} (Este Mes)`;
    } else if (selectedPeriod === 'all') {
      title = `${baseTitle} (Totales)`;
    }
    
    // Agregar monitor si está seleccionado (solo para admins)
    if (selectedMonitor && isAdmin) {
      const monitor = monitors.find(m => m.id === selectedMonitor);
      title = `${title} - ${monitor?.full_name || 'Monitor'}`;
    }
    
    return title;
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* Overlay de carga para filtros */}
      {isFiltering && (
        <div className="filtering-overlay">
          <div className="filtering-spinner">
            <div className="spinner"></div>
            <p>Aplicando filtros...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="reports-header">
        <div className="reports-title">
          <BarChart3 className="reports-icon" />
          <h2>Reportes y Estadísticas</h2>
        </div>
        </div>


      {/* Contenedor de Exportación de Monitores - Solo para Administradores */}
      {isAdmin && (
        <div className="export-container">
          <div className="export-header">
            <h3>📊 Exportar Datos de Monitores</h3>
            <p>Exporte información detallada de monitores en formato PDF o Excel</p>
          </div>
          
          <div className="export-filters">
            <div className="export-filters-row">
              <div className="export-filter-group">
                <label className="export-filter-label">Título del Reporte:</label>
                <input
                  type="text"
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  placeholder="Ej: Reporte de Monitores Enero 2024"
                  className="export-input"
                />
              </div>
              
              <div className="export-filter-group">
                <label className="export-filter-label">Formato:</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                  className="export-select"
                  disabled
                >
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            
            <div className="export-filters-row">
              <div className="export-filter-group">
                <label className="export-filter-label">Fecha Inicio (opcional):</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="export-input"
                />
              </div>
              
              <div className="export-filter-group">
                <label className="export-filter-label">Fecha Fin (opcional):</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="export-input"
                />
              </div>
            </div>
            
            <div className="export-filters-row">
              <div className="export-filter-group">
                <label className="export-filter-label">Monitores Específicos (opcional):</label>
                <div className="export-monitor-selector">
                  <button
                    type="button"
                    className="export-monitor-trigger"
                    onClick={() => setShowMonitorList(!showMonitorList)}
                  >
                    {selectedMonitorsForExport.length === 0 
                      ? '📊 Todos los monitores (datos completos)' 
                      : `${selectedMonitorsForExport.length} monitor(es) seleccionado(s)`
                    }
                    <span className="export-monitor-arrow">▼</span>
                  </button>
                  
                  {showMonitorList && (
                    <div className="export-monitor-dropdown">
                      <div className="export-monitor-info">
                        <small>💡 <strong>Tip:</strong> Si no seleccionas monitores específicos, se exportarán TODOS con datos completos</small>
                      </div>
                      <div className="export-monitor-list">
                        {monitors.map(monitor => (
                          <label key={monitor.id} className="export-monitor-item">
                            <input
                              type="checkbox"
                              checked={selectedMonitorsForExport.includes(monitor.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMonitorsForExport([...selectedMonitorsForExport, monitor.id]);
                                } else {
                                  setSelectedMonitorsForExport(selectedMonitorsForExport.filter(id => id !== monitor.id));
                                }
                              }}
                            />
                            <span className="export-monitor-name">{monitor.full_name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="export-monitor-actions">
                        <button
                          type="button"
                          className="export-monitor-btn export-monitor-btn--select"
                          onClick={() => setSelectedMonitorsForExport(monitors.map(m => m.id))}
                        >
                          Seleccionar Todos
                        </button>
                        <button
                          type="button"
                          className="export-monitor-btn export-monitor-btn--clear"
                          onClick={() => setSelectedMonitorsForExport([])}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="export-actions">
            <button
              onClick={handleExportMonitors}
              disabled={isExporting || !exportTitle.trim()}
              className={`export-btn export-btn--primary ${isExporting ? 'export-btn--loading' : ''}`}
            >
              {isExporting ? (
                <>
                  <div className="export-spinner"></div>
                  {exportStatus === 'processing' ? 'Procesando...' : 'Exportando...'}
                </>
              ) : (
                <>
                  📄 Exportar Datos
                </>
              )}
            </button>
            
            {exportStatus === 'completed' && (
              <div className="export-status export-status--success">
                ✅ Exportación completada exitosamente
              </div>
            )}
            
            {exportStatus === 'error' && (
              <div className="export-status export-status--error">
                ❌ Error en la exportación
                {error && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.875rem', 
                    color: '#dc2626',
                    whiteSpace: 'pre-line',
                    textAlign: 'left'
                  }}>
                    {error}
                  </div>
                )}
                {retryCountdown > 0 && (
                  <div style={{
                    marginTop: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    ⏳ Esperando {retryCountdown} segundos para que el sistema libere los archivos...
                  </div>
                )}
                {showRetryButton && (
                  <button
                    onClick={handleExportMonitors}
                    className="export-btn export-btn--retry"
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      marginTop: '0.75rem',
                      display: 'block',
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    🔄 Reintentar Exportación
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advertencia de semana */}
      {selectedPeriod === 'week' && !selectedWeek && (
        <div className="charts-warning-top">
          ⚠️ Debe seleccionar una semana para ver los datos
        </div>
      )}
        
        {/* Filtros de Gráficas */}
        <div className="charts-filters-container">
          <div className="charts-filters">
            <div className="charts-filters-row">
              <div className="charts-filter-group">
                <label className="charts-filter-label">Período:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value as 'week' | 'month' | 'all')}
                  className="charts-select"
                >
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                  <option value="all">Totales</option>
                </select>
              </div>
              
              {selectedPeriod === 'week' && (
                <div className="charts-filter-group">
                  <label className="charts-filter-label">Seleccionar semana:</label>
                  <input
                    type="week"
                    value={selectedWeek}
                    onChange={(e) => handleWeekChange(e.target.value)}
                    className="charts-input"
                    placeholder="Seleccionar semana"
                    required
                  />
                </div>
              )}
              
              {selectedPeriod === 'month' && (
                <>
                  <div className="charts-filter-group">
                    <label className="charts-filter-label">Año:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="charts-select"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="charts-filter-group">
                    <label className="charts-filter-label">Mes:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="charts-select"
                    >
                      <option value={1}>Enero</option>
                      <option value={2}>Febrero</option>
                      <option value={3}>Marzo</option>
                      <option value={4}>Abril</option>
                      <option value={5}>Mayo</option>
                      <option value={6}>Junio</option>
                      <option value={7}>Julio</option>
                      <option value={8}>Agosto</option>
                      <option value={9}>Septiembre</option>
                      <option value={10}>Octubre</option>
                      <option value={11}>Noviembre</option>
                      <option value={12}>Diciembre</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <div className="charts-filters-row">
              <div className="charts-filter-group">
                <label className="charts-filter-label">Sala:</label>
                <CustomSelect
                  value={selectedRoom ?? ''}
                  placeholder="Todas las salas"
                  options={rooms.map(r => ({ value: r.id, label: r.name }))}
                  onChange={(val) => setSelectedRoom(val as number | null)}
                />
              </div>
              
              {/* 🔒 FILTRO DE MONITOR SOLO PARA ADMINISTRADORES */}
              {isAdmin && (
                <div className="charts-filter-group">
                  <label className="charts-filter-label">Monitor:</label>
                  <CustomSelect
                    value={selectedMonitor ?? ''}
                    placeholder="Todos los monitores"
                    options={monitors.map(m => ({ value: m.id, label: m.full_name }))}
                    onChange={(val) => setSelectedMonitor(val as number | null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Cards de Estadísticas */}
      <div className="stats-cards">
        {/* Ocultar tarjeta de llegadas tarde para monitores */}
        {!isMonitor && (
          <div className={`stat-card stat-card--late ${isMonitor ? 'stat-card--personal' : ''}`}>
            <div className="stat-card__icon">
              <Clock className="stat-icon" />
            </div>
            <div className="stat-card__content">
              <div className="stat-card__title">Llegadas Tarde</div>
              <div className="stat-card__value">{reportData.lateArrivals}</div>
              <div className="stat-card__hint">Turnos con retraso ≥5m</div>
            </div>
          </div>
        )}

        <div className={`stat-card stat-card--assigned ${isMonitor ? 'stat-card--personal' : ''}`}>
          <div className="stat-card__icon">
            <Calendar className="stat-icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__title">Horas Asignadas</div>
            <div className="stat-card__value">{reportData.assignedHours.toFixed(1)}h</div>
            <div className="stat-card__hint">Turnos del calendario</div>
          </div>
        </div>

        <div className={`stat-card stat-card--worked ${isMonitor ? 'stat-card--personal' : ''}`}>
          <div className="stat-card__icon">
            <Activity className="stat-icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__title">Horas Trabajadas</div>
            <div className="stat-card__value">{reportData.workedHours.toFixed(1)}h</div>
            <div className="stat-card__hint">Realizadas en turnos</div>
          </div>
        </div>

        <div className={`stat-card stat-card--remaining ${isMonitor ? 'stat-card--personal' : ''}`}>
          <div className="stat-card__icon">
            <Clock className="stat-icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__title">Horas Faltantes</div>
            <div className="stat-card__value">{reportData.remainingHours.toFixed(1)}h</div>
            <div className="stat-card__hint">Por completar</div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        
        {/* Gráfico 1: Entradas y Salidas por Día */}
        <div className={`chart-container ${isMonitor ? 'monitor-chart-container' : ''}`}>
          <div className="chart-header">
            <Users className="chart-icon" />
            <h3>{getChartTitle('Entradas y Salidas por Día')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={entriesExitsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="entradas" fill="#3B82F6" name="Entradas" />
              <Bar dataKey="salidas" fill="#EF4444" name="Salidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 2: Horas por Día de la Semana */}
        <div className={`chart-container ${isMonitor ? 'monitor-chart-container' : ''}`}>
          <div className="chart-header">
            <Calendar className="chart-icon" />
            <h3>{getChartTitle('Horas por Día')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="horas" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 3: Distribución por Sala */}
        <div className={`chart-container chart-container--distribution ${isMonitor ? 'monitor-chart-container' : ''}`} style={{ 
          display: 'flex', 
          gap: '20px',
          alignItems: 'flex-start',
          minHeight: '350px',
          padding: '20px',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div className="chart-header">
            <PieChartIcon className="chart-icon" />
            <h3>{getChartTitle('Distribución por Sala')}</h3>
          </div>
            {/* Gráfica de pastel - lado izquierdo */}
            <div style={{ 
              flex: '0 0 300px',  // ✅ Ancho fijo más pequeño
              height: '320px',     // ✅ Reducido de 400px a 320px
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '0',  // ✅ Permitir que se comprima si es necesario
              marginLeft: '-50px'  // ✅ AJUSTAR: Mover gráfico donut (valores negativos = izquierda, positivos = derecha)
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={120}  // ✅ Reducido para que quepa mejor
                    fill="#8884d8"
                    dataKey="value"
                    innerRadius={40}   // ✅ Reducido proporcionalmente
                  >
                    {roomDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, _name: string, props: { payload?: { name: string; value: number; entries?: number; active?: number } }) => {
                      const data = props.payload;
                      return [
                        `${value.toFixed(2)} horas`,
                        `${data?.entries || 0} entradas, ${data?.active || 0} activas`
                      ];
                    }}
                    labelFormatter={(label: string) => `Sala: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* ✅ MEJORADO: Leyenda contenida - lado derecho */}
            <div style={{ 
              flex: '0 0 300px',  // ✅ Ancho fijo para evitar que se estire
              maxHeight: '320px',  // ✅ Reducido de 400px a 320px
              overflowY: 'auto',
              padding: '15px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
              boxSizing: 'border-box',  // ✅ Incluir padding en el ancho
              marginLeft: '-20px'  // ✅ AJUSTAR: Mover tabla (valores negativos = izquierda, positivos = derecha)
            }}>
              <h4 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#374151',
                textAlign: 'center'
              }}>
                Distribución por Sala
              </h4>
              {roomDistributionData.map((entry, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '8px 0',
                  fontSize: '13px',
                  borderBottom: index < roomDistributionData.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div 
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: entry.fill,
                      borderRadius: '4px',
                      flexShrink: 0,
                      border: '1px solid #d1d5db'
                    }} 
                  />
                  <div style={{ flex: '1', minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '600',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '2px'
                    }}>
                      {entry.name}
                    </div>
                    <div style={{ 
                      color: '#6b7280', 
                      fontSize: '12px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <span>{entry.value.toFixed(2)}h</span>
                      <span>•</span>
                      <span>{entry.entries} entradas</span>
                      {entry.active > 0 && (
                        <>
                          <span>•</span>
                          <span>{entry.active} activas</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#1f2937',
                    fontSize: '13px',
                    backgroundColor: '#e5e7eb',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    {((entry.value / roomDistributionData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
