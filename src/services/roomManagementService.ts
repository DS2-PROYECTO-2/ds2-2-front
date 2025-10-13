/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '../utils/api';
import type { Room, Computer, Report } from '../types/index';

function resolveIssues(apiReport: Record<string, unknown>): string[] {
  const fromArray = (apiReport as any)?.issues || (apiReport as any)?.issue_types || (apiReport as any)?.failure_types || (apiReport as any)?.tags || (apiReport as any)?.categories;
  if (Array.isArray(fromArray) && fromArray.length > 0) {
    return fromArray.map((x: any) => String(x)).map(s => s.trim()).filter(Boolean);
  }
  const single = (apiReport as any)?.issue_type || (apiReport as any)?.category || (apiReport as any)?.tag || (apiReport as any)?.issue;
  if (typeof single === 'string') {
    // CSV -> lista
    return single.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (single) return [String(single)];
  return [];
}

function resolveReporterName(apiReport: Record<string, unknown>): string {
  // Campos directos comunes
  const direct =
    apiReport.reporter_name ||
    apiReport.reporter ||
    apiReport.reported_by_name ||
    apiReport.reported_by_full_name ||
    apiReport.reported_by_username ||
    apiReport.reported_by_email ||
    apiReport.reported_by_display;

  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  // Objetos anidados potenciales
  const candidates = [
    (apiReport as any).user,
    (apiReport as any).reported_by_user,
    (apiReport as any).reported_by,
    (apiReport as any).owner,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  for (const obj of candidates) {
    if (!obj || typeof obj !== 'object') continue;
    const fullName = obj.full_name || obj.fullName;
    if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
    const first = obj.first_name || obj.firstName;
    const last = obj.last_name || obj.lastName;
    const username = obj.username || obj.email || obj.name;
    if (first || last) {
      return [first, last].filter(Boolean).join(' ').trim();
    }
    if (typeof username === 'string' && username.trim()) return username.trim();
  }

  const byId = (apiReport as any).reported_by ?? (apiReport as any).user_id ?? (apiReport as any).userId;
  return byId != null ? `Usuario ${byId}` : 'Usuario';
}

// Cache simple en memoria para nombres de usuario resueltos
const userNameCache: Record<string, string> = {};

async function fetchUserNameById(userId: string | number): Promise<string | null> {
  const id = String(userId);
  if (userNameCache[id]) return userNameCache[id];
  const candidateEndpoints = [
    `/api/users/${id}/`,
    `/api/auth/users/${id}/`,
    `/api/accounts/users/${id}/`,
    `/api/users/profile/${id}/`,
  ];
  for (const ep of candidateEndpoints) {
    try {
      const resp: any = await apiClient.get(ep);
      const name = resp?.full_name || resp?.fullName || resp?.name || resp?.username || resp?.email;
      if (typeof name === 'string' && name.trim()) {
        userNameCache[id] = name.trim();
        return userNameCache[id];
      }
    } catch {
      // noop
    }
  }
  return null;
}

async function resolveReporterNamesForReports(reports: Report[], apiReportsRaw: Array<Record<string, unknown>>): Promise<Report[]> {
  try {
    const missing = new Set<string>();
    apiReportsRaw.forEach((raw) => {
      const existing = resolveReporterName(raw);
      if (!existing || /^Usuario\s+\d+$/i.test(existing)) {
        const uid = (raw as any)?.reported_by ?? (raw as any)?.user_id ?? (raw as any)?.userId;
        if (uid != null) missing.add(String(uid));
      }
    });
    if (missing.size === 0) return reports;
    await Promise.all(Array.from(missing).map(id => fetchUserNameById(id)));
    // reconstruir con nombres si se resolvieron
    return reports.map((r, idx) => {
      const raw = apiReportsRaw[idx];
      const uid = (raw as any)?.reported_by ?? (raw as any)?.user_id ?? (raw as any)?.userId;
      const cached = uid != null ? userNameCache[String(uid)] : undefined;
      if (cached && /^Usuario\s+\d+$/i.test(r.reporter)) {
        return { ...r, reporter: cached };
      }
      return r;
    });
  } catch {
    return reports;
  }
}



// Servicios de la API
export const roomManagementService = {
  // Obtener todas las salas
  async getRooms(userRole?: string): Promise<{ rooms: Room[]; reports: Report[] }> {
    try {
      // Usar endpoints diferentes según el rol
      const roomsEndpoint = userRole === 'admin' ? '/api/rooms/admin/rooms/' : '/api/rooms/';
      
      const [roomsResponse, equipmentResponse, reportsResponse] = await Promise.all([
        apiClient.get(roomsEndpoint),
        apiClient.get('/api/equipment/equipment/'),
        apiClient.get('/api/equipment/reports/')
      ]);


      // Procesar respuesta de salas
      // logs removidos
      
      // Manejar diferentes estructuras de respuesta según el endpoint
      let apiRooms = [];
      if (userRole === 'admin') {
        // Para admin: /api/rooms/admin/rooms/ devuelve { rooms: [...] }
        apiRooms = (roomsResponse as any).rooms || [];
      } else {
        // Para monitor: /api/rooms/ puede devolver directamente un array o { results: [...] }
        if (Array.isArray(roomsResponse)) {
          apiRooms = roomsResponse;
        } else {
          apiRooms = (roomsResponse as any).results || (roomsResponse as any).rooms || [];
        }
      }
      
      // logs removidos
      
      const rooms: Room[] = apiRooms.map((apiRoom: any) => ({
        id: apiRoom.id.toString(),
        name: apiRoom.name,
        code: apiRoom.code,
        capacity: apiRoom.capacity,
        description: apiRoom.description || '',
        computers: [], // Se llenará con equipos
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Procesar respuesta de equipos
      const apiEquipment = (equipmentResponse as any).results || [];
      const equipmentByRoom: { [key: string]: Computer[] } = {};
      
      // Verificar que apiEquipment sea un array
      if (Array.isArray(apiEquipment)) {
        apiEquipment.forEach((eq: any) => {
          const roomId = eq.room.toString();
          if (!equipmentByRoom[roomId]) {
            equipmentByRoom[roomId] = [];
          }
          
          // Extraer el número del nombre (ej: "PC 5" -> 5)
          const nameMatch = eq.name?.match(/PC (\d+)/);
          const computerNumber = nameMatch ? parseInt(nameMatch[1]) : eq.id || 0;
          
          equipmentByRoom[roomId].push({
            id: eq.id.toString(), // ✅ Usar el ID real de la base de datos para eliminación
            number: computerNumber,
            serial: eq.serial_number,
            status: eq.status as 'operational' | 'maintenance' | 'out_of_service',
            roomId: roomId,
            createdAt: eq.acquisition_date,
            updatedAt: eq.acquisition_date
          });
        });
      } else {
        // noop
      }

      // Asignar equipos a las salas
      rooms.forEach(room => {
        room.computers = equipmentByRoom[room.id] || [];
      });

      // Procesar respuesta de reportes
      const apiReports = (reportsResponse as any).results || [];
      let reports: Report[] = [];
      
      // Verificar que apiReports sea un array
      if (Array.isArray(apiReports)) {
        reports = apiReports.map((apiReport: any) => {
          const reporterName = resolveReporterName(apiReport);
          const isResolved = (apiReport.resolved === true) || (apiReport.is_resolved === true) || (apiReport.status === 'resolved');
          const issues = resolveIssues(apiReport);
          return {
            id: apiReport.id.toString(),
            computerId: apiReport.equipment.toString(),
            roomId: '', // Se asignará después
            reporterId: (apiReport.reported_by ?? apiReport.user_id ?? apiReport.userId) ?? undefined,
            issues,
            reporter: reporterName,
            description: apiReport.issue_description,
            date: new Date(apiReport.created_at).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
            status: (isResolved ? 'resolved' : 'pending')
          } as Report;
        });
        // Intentar resolver nombres si aún quedaron como Usuario {id}
        reports = await resolveReporterNamesForReports(reports, apiReports);

        // Asignar roomId a los reportes
        reports.forEach(report => {
          if (Array.isArray(apiEquipment)) {
            const equipment = apiEquipment.find((eq: any) => eq.id.toString() === report.computerId);
            if (equipment) {
              report.roomId = equipment.room.toString();
            }
          }
        });
      } else {
        // noop
      }

      return { rooms, reports };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  // Crear nueva sala
  async createRoom(roomData: {
    name: string;
    code: string;
    capacity: number;
    description: string;
  }): Promise<Room> {
    try {
      const response = await apiClient.post('/api/rooms/admin/rooms/create/', roomData);
      const apiRoom = (response as any).room;
      
      return {
        id: apiRoom.id.toString(),
        name: apiRoom.name,
        code: apiRoom.code,
        capacity: apiRoom.capacity,
        description: apiRoom.description,
        computers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  // Actualizar sala
  async updateRoom(roomId: string, roomData: {
    name?: string;
    capacity?: number;
    description?: string;
    is_active?: boolean;
  }): Promise<Room> {
    try {
      const response = await apiClient.patch(`/api/rooms/admin/rooms/${roomId}/update/`, roomData);
      const apiRoom = (response as any).room;
      
      return {
        id: apiRoom.id.toString(),
        name: apiRoom.name,
        code: apiRoom.code,
        capacity: apiRoom.capacity,
        description: apiRoom.description,
        computers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },

  // Eliminar sala
  async deleteRoom(roomId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/rooms/admin/rooms/${roomId}/delete/`);
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  },

  // Crear equipo
  async createEquipment(equipmentData: {
    serial_number: string;
    name: string;
    description: string;
    room: number;
    status: 'operational' | 'maintenance' | 'out_of_service';
    acquisition_date: string;
  }): Promise<Computer> {
    try {
      // Formatear la fecha al formato YYYY-MM-DD que espera el servidor
      const formattedData = {
        ...equipmentData,
        acquisition_date: new Date(equipmentData.acquisition_date).toISOString().split('T')[0]
      };
      
      const response = await apiClient.post('/api/equipment/equipment/', formattedData);
      const apiEquipment = response as any;
      
      // logs removidos
      
      // Extraer el número del nombre (ej: "PC 5" -> 5)
      const nameMatch = apiEquipment.name?.match(/PC (\d+)/);
      const computerNumber = nameMatch ? parseInt(nameMatch[1]) : apiEquipment.id || 0;
      
      const newComputer = {
        id: apiEquipment.id?.toString(), // ✅ Usar el ID real de la base de datos
        number: computerNumber,
        serial: apiEquipment.serial_number,
        status: apiEquipment.status as 'operational' | 'maintenance' | 'out_of_service',
        roomId: apiEquipment.room?.toString() || equipmentData.room.toString(),
        createdAt: apiEquipment.acquisition_date || new Date().toISOString(),
        updatedAt: apiEquipment.acquisition_date || new Date().toISOString()
      };
      
      // logs removidos
      return newComputer;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  },

  // Actualizar equipo
  async updateEquipment(equipmentId: string, equipmentData: {
    serial_number?: string;
    name?: string;
    description?: string;
    status?: 'operational' | 'maintenance' | 'out_of_service';
  }): Promise<Computer> {
    try {
      // logs removidos
      const response = await apiClient.patch(`/api/equipment/equipment/${equipmentId}/`, equipmentData);
      const apiEquipment = response as any;
      // logs removidos
      
      // Extraer el número del nombre (ej: "PC 5" -> 5)
      const nameMatch = apiEquipment.name?.match(/PC (\d+)/);
      const computerNumber = nameMatch ? parseInt(nameMatch[1]) : apiEquipment.id || 0;
      
      return {
        id: apiEquipment.id?.toString(), // ✅ Usar el ID real de la base de datos
        number: computerNumber,
        serial: apiEquipment.serial_number,
        status: apiEquipment.status as 'operational' | 'maintenance' | 'out_of_service',
        roomId: apiEquipment.room.toString(),
        createdAt: apiEquipment.acquisition_date,
        updatedAt: apiEquipment.acquisition_date
      };
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  },

  // Eliminar equipo
  async deleteEquipment(equipmentId: string): Promise<void> {
    try {
      // logs removidos
      
      // Intentar primero con el endpoint estándar
      try {
        await apiClient.delete(`/api/equipment/equipment/${equipmentId}/`);
        // logs removidos
        return;
      } catch (firstError) {
        // logs removidos
        
        // Si falla, intentar con el serial_number como parámetro
        try {
          await apiClient.delete(`/api/equipment/equipment/?serial_number=${equipmentId}`);
          // logs removidos
          return;
        } catch {
          // logs removidos
          throw firstError;
        }
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  },

  // Crear reporte de falla
  async createReport(reportData: {
    equipment: number;
    issue_description: string;
    reported_by: number;
    issue_type?: string;
  }): Promise<Report> {
    try {
      const response = await apiClient.post('/api/equipment/reports/', reportData);
      const apiReport = response as any;
      
      return {
        id: apiReport.id.toString(),
        computerId: apiReport.equipment.toString(),
        roomId: '', // Se asignará después
        reporterId: (apiReport.reported_by ?? apiReport.user_id ?? apiReport.userId) ?? undefined,
        issues: resolveIssues(apiReport),
        reporter: resolveReporterName(apiReport),
        description: apiReport.issue_description,
        date: new Date(apiReport.created_at).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        status: 'pending'
      };
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  // Obtener reportes de un equipo
  async getEquipmentReports(equipmentId: string): Promise<Report[]> {
    try {
      const response = await apiClient.get('/api/equipment/reports/');
      const apiReports = (response as any) || [];
      
      let result = apiReports
        .filter((report: any) => report.equipment.toString() === equipmentId)
        .map((apiReport: any) => {
          const reporterName = resolveReporterName(apiReport);
          const isResolved = (apiReport.resolved === true) || (apiReport.is_resolved === true) || (apiReport.status === 'resolved');
          const issues = resolveIssues(apiReport);
          return {
            id: apiReport.id.toString(),
            computerId: apiReport.equipment.toString(),
            roomId: '', // Se asignará después
            reporterId: (apiReport.reported_by ?? apiReport.user_id ?? apiReport.userId) ?? undefined,
            issues,
            reporter: reporterName,
            description: apiReport.issue_description,
            date: new Date(apiReport.created_at).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
            status: (isResolved ? 'resolved' : 'pending')
          } as Report;
        });
      result = await resolveReporterNamesForReports(result, apiReports);
      return result;
    } catch (error) {
      console.error('Error fetching equipment reports:', error);
      throw error;
    }
  },

  // Obtener TODOS los reportes (liviano)
  async getReports(): Promise<Report[]> {
    try {
      const response = await apiClient.get('/api/equipment/reports/');
      const apiReports = (response as any).results || (response as any) || [];
      let reports: Report[] = (Array.isArray(apiReports) ? apiReports : []).map((apiReport: any) => {
        const reporterName = resolveReporterName(apiReport);
        const isResolved = (apiReport.resolved === true) || (apiReport.is_resolved === true) || (apiReport.status === 'resolved');
        const issues = resolveIssues(apiReport);
        return {
          id: apiReport.id?.toString?.() ?? String(apiReport.id),
          computerId: apiReport.equipment?.toString?.() ?? String(apiReport.equipment),
          roomId: '',
          reporterId: (apiReport.reported_by ?? apiReport.user_id ?? apiReport.userId) ?? undefined,
          issues,
          reporter: reporterName,
          description: apiReport.issue_description,
          date: new Date(apiReport.created_at).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
          status: (isResolved ? 'resolved' : 'pending')
        } as Report;
      });
      reports = await resolveReporterNamesForReports(reports, apiReports);
      return reports;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Obtener reporte por ID (liviano)
  async getReportById(reportId: string): Promise<Report | null> {
    try {
      const response = await apiClient.get(`/api/equipment/reports/${reportId}/`);
      const apiReport = response as any;
      if (!apiReport) return null;
      const reporterName = resolveReporterName(apiReport);
      const isResolved = (apiReport.resolved === true) || (apiReport.is_resolved === true) || (apiReport.status === 'resolved');
      let report = {
        id: apiReport.id?.toString?.() ?? String(apiReport.id),
        computerId: apiReport.equipment?.toString?.() ?? String(apiReport.equipment),
        roomId: '',
        reporterId: (apiReport.reported_by ?? apiReport.user_id ?? apiReport.userId) ?? undefined,
        issues: resolveIssues(apiReport),
        reporter: reporterName,
        description: apiReport.issue_description,
        date: new Date(apiReport.created_at).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        status: (isResolved ? 'resolved' : 'pending')
      } as Report;
      // Si sigue siendo Usuario {id}, intentar lookup puntual
      if (/^Usuario\s+\d+$/i.test(report.reporter)) {
        const uid = apiReport?.reported_by ?? apiReport?.user_id ?? apiReport?.userId;
        if (uid != null) {
          const name = await fetchUserNameById(uid);
          if (name) report = { ...report, reporter: name };
        }
      }
      return report;
    } catch (error) {
      console.error('Error fetching report by id:', error);
      throw error;
    }
  },

  // Actualizar estado de un reporte (resolver / reabrir)
  async updateReportStatus(reportId: string, newStatus: 'pending' | 'resolved'): Promise<void> {
    try {
      // Backend espera un booleano 'resolved'
      const resolvedFlag = newStatus === 'resolved';
      const payload = {
        resolved: resolvedFlag,
        is_resolved: resolvedFlag,
        status: resolvedFlag ? 'resolved' : 'pending'
      } as { resolved: boolean; is_resolved: boolean; status: 'pending' | 'resolved' };
      try {
        await apiClient.patch(`/api/equipment/reports/${reportId}/`, payload);
        return;
      } catch (firstError: any) {
        // Intento 2: PUT completo (algunos backends lo requieren)
        try {
          await apiClient.patch(`/api/equipment/reports/${reportId}/`, undefined);
        } catch { /* noop */ }
        try {
          // fallback con PUT a una ruta común
          await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/equipment/reports/${reportId}/`, {
            method: 'PUT',
            headers: (() => {
              const t = localStorage.getItem('authToken');
              const h: Record<string, string> = { 'Content-Type': 'application/json' };
              if (t) h.Authorization = `Token ${t}`;
              return h;
            })(),
            credentials: 'include',
            body: JSON.stringify(payload)
          });
          return;
        } catch { /* noop */ }

        // Intento 3: Endpoints de acción específicos
        try {
          if (resolvedFlag) {
            await apiClient.post(`/api/equipment/reports/${reportId}/resolve/`, {});
          } else {
            await apiClient.post(`/api/equipment/reports/${reportId}/reopen/`, {} as any);
          }
          return;
        } catch {
          // Re-lanzar el primer error para tener más contexto del endpoint principal
          throw firstError;
        }
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }
  ,
  // Eliminar reporte por ID
  async deleteReport(reportId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/equipment/reports/${reportId}/`);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }
};
