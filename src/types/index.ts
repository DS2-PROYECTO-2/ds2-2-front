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
    reporter: string;
    date: string;
    description: string;
    issues: string[];
    status: ReportStatus;
}