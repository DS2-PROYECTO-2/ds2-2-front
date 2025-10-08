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
    capacity: number;
    description?: string;
    location?: string;
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
    cedula?: string;
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
    is_active?: boolean;
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
    cedula?: string;
    role?: 'admin' | 'monitor';
    is_active?: boolean;
}