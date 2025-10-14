import type { ComponentType } from 'react';

export interface SidebarButton {
    id: number;
    icon: ComponentType<{ size?: number }>;
    label: string;
}

// Dominio de Salas/Equipos/Reportes
export type EquipmentStatus = 'operational' | 'maintenance' | 'out_of_service';

export interface Computer {
    id: string;
    roomId: string;
    number: number;
    serial: string;
    status: EquipmentStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface Room {
    id: string;
    name: string;
    code: string;
    capacity: number;
    description?: string;
    computers: Computer[];
    createdAt?: string;
    updatedAt?: string;
}

export type ReportStatus = 'pending' | 'resolved';

export interface Report {
    id: string;
    computerId: string;
    roomId?: string;
    reporterId?: number;
    reporter: string;
    date: string;
    description: string;
    issues: string[];
    status: ReportStatus;
}

// Tipos para gestión de usuarios
export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    identification?: string;
    phone?: string;
    role: 'admin' | 'monitor';
    is_active: boolean;
    is_verified: boolean;
    date_joined: string;
    last_login?: string;
}

export interface UserFilters {
    search?: string;
    role?: string;
    is_verified?: boolean;
}

export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    identification?: string;
    phone?: string;
    role: 'admin' | 'monitor';
}

export interface UpdateUserData {
    username?: string;
    email?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    cedula?: string;
    identification?: string;
    phone?: string;
    role?: 'admin' | 'monitor';
    is_active?: boolean;
}

// Tipos para manejo de errores
export interface ApiError extends Error {
    message: string;
    status?: number;
    username?: string[];
    email?: string[];
    identification?: string[];
    response?: {
        data?: {
            detail?: string;
            message?: string;
        };
    };
}

// Tipo para respuesta de API de usuarios
export interface UsersApiResponse {
    results: User[];
    count: number;
    next?: string;
    previous?: string;
}

// Tipos para gestión de cursos
export interface Course {
    id: number;
    name: string;
    description: string;
    room: number;
    schedule: number; // ID del turno
    start_datetime: string;
    end_datetime: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    monitor_name: string;
    monitor_username: string;
    room_name: string;
    room_code: string;
    room_description?: string;
    schedule_id?: number;
    schedule_start?: string;
    schedule_end?: string;
    schedule_status?: string;
    created_by_name?: string;
    duration_hours: number;
    is_current: boolean;
    is_upcoming: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCourseData {
    name: string;
    description: string;
    room: number;
    schedule: number;
    start_datetime: string;
    end_datetime: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface UpdateCourseData {
    name?: string;
    description?: string;
    room?: number;
    schedule?: number;
    start_datetime?: string;
    end_datetime?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface CourseFilters {
    date_from?: string;
    date_to?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'all';
    room?: number;
    monitor?: number;
    schedule?: number;
}

export interface CourseHistory {
    id: number;
    action: 'create' | 'update' | 'delete';
    action_display: string;
    changes: Record<string, unknown>;
    changed_by_name: string;
    timestamp: string;
}

export interface CourseOverview {
    total_courses: number;
    active_courses: number;
    current_courses: number;
    upcoming_courses: number;
    courses_by_status: {
        scheduled: { label: string; count: number };
        in_progress: { label: string; count: number };
        completed: { label: string; count: number };
        cancelled: { label: string; count: number };
    };
    next_courses: Course[];
}

// Tipos para eventos del calendario (turnos + cursos)
export interface CalendarEvent {
    id: string;
    type: 'schedule' | 'course';
    title: string;
    start: string;
    end: string;
    room: string;
    monitor: string;
    description: string;
    status: string;
    color: string;
    schedule_id?: number; // Solo para cursos
}