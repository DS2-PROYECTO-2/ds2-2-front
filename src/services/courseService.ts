import { apiClient } from '../utils/api';
import { adminOnly } from '../utils/securityMiddleware';
import type { Course, CreateCourseData, UpdateCourseData, CourseFilters, CourseHistory, CourseOverview, CalendarEvent } from '../types';

const courseService = {
  // Obtener todos los cursos
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    const params = new URLSearchParams();

    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.room) {
      params.append('room', filters.room.toString());
    }
    if (filters?.monitor) {
      params.append('monitor', filters.monitor.toString());
    }
    if (filters?.schedule) {
      params.append('schedule', filters.schedule.toString());
    }

    const url = `/api/courses/?${params.toString()}`;

    const response = await apiClient.get(url) as { results: Course[] };

    if (response && response.results && Array.isArray(response.results)) {
      return response.results as Course[];
    }

    return [];
  },

  // Obtener curso por ID
  async getCourseById(id: number): Promise<Course> {
    const response = await apiClient.get(`/api/courses/${id}/`);
    return response as Course;
  },

  // Crear nuevo curso
  async createCourse(courseData: CreateCourseData): Promise<Course> {
    return await adminOnly(
      () => apiClient.post('/api/courses/', courseData),
      'crear cursos'
    ) as Course;
  },

  // Actualizar curso
  async updateCourse(id: number, courseData: UpdateCourseData): Promise<Course> {
    return await adminOnly(
      () => apiClient.patch(`/api/courses/${id}/`, courseData),
      'editar cursos'
    ) as Course;
  },

  // Eliminar curso
  async deleteCourse(id: number): Promise<void> {
    await adminOnly(
      () => apiClient.delete(`/api/courses/${id}/`),
      'eliminar cursos'
    );
  },

  // Obtener mis cursos (para monitores)
  async getMyCourses(filters?: CourseFilters): Promise<{
    courses: Course[];
    total_count: number;
    summary: {
      scheduled: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const url = `/api/courses/my_courses/?${params.toString()}`;
    const response = await apiClient.get(url) as {
      courses: Course[];
      total_count: number;
      summary: {
        scheduled: number;
        in_progress: number;
        completed: number;
        cancelled: number;
      };
    };
    return response;
  },

  // Obtener cursos próximos
  async getUpcomingCourses(filters?: CourseFilters & { days?: number }): Promise<{
    upcoming_courses: Course[];
    total_count: number;
    date_range: { start_date: string; end_date: string };
  }> {
    const params = new URLSearchParams();
    if (filters?.days) params.append('days', filters.days.toString());
    if (filters?.room) params.append('room', filters.room.toString());
    if (filters?.monitor) params.append('monitor', filters.monitor.toString());

    const url = `/api/courses/upcoming/?${params.toString()}`;
    const response = await apiClient.get(url) as {
      upcoming_courses: Course[];
      total_count: number;
      date_range: { start_date: string; end_date: string };
    };
    return response;
  },

  // Obtener cursos actuales
  async getCurrentCourses(): Promise<{
    current_courses: Course[];
    total_count: number;
    timestamp: string;
  }> {
    const response = await apiClient.get('/api/courses/current/') as {
      current_courses: Course[];
      total_count: number;
      timestamp: string;
    };
    return response;
  },

  // Obtener historial de cambios de un curso
  async getCourseHistory(id: number): Promise<CourseHistory[]> {
    const response = await apiClient.get(`/api/courses/${id}/history/`);
    return response as CourseHistory[];
  },

  // Obtener vista de calendario (cursos y turnos combinados)
  async getCalendarView(startDate: string, endDate: string, room?: number, monitor?: number): Promise<{
    calendar_events: CalendarEvent[];
    date_range: { start_date: string; end_date: string };
    summary: { total_events: number; schedules_count: number; courses_count: number };
  }> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (room) params.append('room', room.toString());
    if (monitor) params.append('monitor', monitor.toString());

    const url = `/api/courses/calendar_view/?${params.toString()}`;
    const response = await apiClient.get(url) as {
      calendar_events: CalendarEvent[];
      date_range: { start_date: string; end_date: string };
      summary: { total_events: number; schedules_count: number; courses_count: number };
    };
    return response;
  },

  // Resumen administrativo
  async getAdminOverview(): Promise<CourseOverview> {
    const response = await apiClient.get('/api/courses/admin/courses/overview/');
    return response as CourseOverview;
  },
};

export default courseService;
