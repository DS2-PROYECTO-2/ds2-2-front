import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Monitor, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { Room, Computer, Report } from '../../types/index';
import { roomManagementService } from '../../services/roomManagementService';
import { useAuth } from '../../hooks/useAuth';
import { getMyActiveEntry } from '../../services/roomEntryService';
import RoomModal from './RoomModal';
import ComputerModal from './ComputerModal';
import ReportModal from './ReportModal';
import FaultReportModal from './FaultReportModal';
import '../../styles/RoomManagement.css';

export default function RoomManagement() {
  const { user } = useAuth();

  // Funciones de permisos
  const isAdmin = () => user?.role === 'admin';
  const isMonitor = () => user?.role === 'monitor';
  const canCreateRooms = () => isAdmin();
  const canEditRooms = () => isAdmin();
  const canDeleteRooms = () => isAdmin();
  const canCreateComputers = () => isAdmin();
  const canEditComputers = () => isAdmin();
  const canDeleteComputers = () => isAdmin();
  const canReportFaults = () => isAdmin() || isMonitor();

  // Función para mostrar notificaciones
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Función para emitir actualizaciones en tiempo real
  const emitRealTimeUpdate = (type: string, data: Record<string, unknown>) => {
    const updateData = {
      type,
      timestamp: Date.now(),
      ...data
    };
    
    // Usar localStorage para sincronizar entre pestañas
    localStorage.setItem('room-data-update', JSON.stringify(updateData));
    // Señales adicionales usadas por campanario/lista y cards
    localStorage.setItem('notifications-updated', String(Date.now()));
    localStorage.setItem('reports-updated', String(Date.now()));
    
    // Disparar evento storage para la misma pestaña
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'room-data-update',
      newValue: JSON.stringify(updateData),
      storageArea: localStorage
    }));
    // Y notificar el mismo canal ya utilizado
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'notifications-updated',
      newValue: String(Date.now()),
      storageArea: localStorage
    }));
    // Canal dedicado para listas de reportes/badges
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'reports-updated',
      newValue: String(Date.now()),
      storageArea: localStorage
    }));
  };

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showComputerModal, setShowComputerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFaultReportModal, setShowFaultReportModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingComputer, setEditingComputer] = useState<Computer | null>(null);
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingByComputerId, setPendingByComputerId] = useState<Record<string, number>>({});
  const [currentView, setCurrentView] = useState<'rooms' | 'room-detail'>('rooms');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeEntryRoomId, setActiveEntryRoomId] = useState<number | null>(null);

  // Cargar datos de la API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { rooms: apiRooms, reports: apiReports } = await roomManagementService.getRooms(user?.role);
        setRooms(apiRooms);
        setReports(apiReports);
      } catch {
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Sincronización en tiempo real usando localStorage y eventos
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'room-data-update' || e.key === 'notifications-updated' || e.key === 'reports-updated') && (e.newValue || e.key !== null)) {
        try {
          const updateData = e.key === 'room-data-update' && e.newValue ? JSON.parse(e.newValue) : null;
          
          if (updateData && updateData.type === 'report-created') {
            // Agregar nuevo reporte
            setReports(prevReports => {
              const exists = prevReports.find(r => r.id === updateData.report.id);
              if (!exists) {
                return [...prevReports, updateData.report];
              }
              return prevReports;
            });
            // Forzar refresco de vistas para badges/conteos
            // No modificar selectedRoom y rooms directamente para evitar bucles infinitos
          } else if (updateData && updateData.type === 'report-updated') {
            // Actualizar reporte existente
            setReports(prevReports => 
              prevReports.map(report => 
                report.id === updateData.reportId 
                  ? { ...report, status: updateData.newStatus }
                  : report
              )
            );
            // Forzar refresco de vistas para badges/conteos
            // No modificar selectedRoom y rooms directamente para evitar bucles infinitos
          } else if (e.key === 'notifications-updated' || e.key === 'reports-updated') {
            // Reconsultar solo los reportes con un pequeño retraso y REEMPLAZAR por verdad de servidor
            (async () => {
              try {
                await new Promise(r => setTimeout(r, 400));
                const apiReports = await roomManagementService.getReports();
                setReports(apiReports);
                // Forzar refresco de vistas
                // No modificar selectedRoom y rooms directamente para evitar bucles infinitos
          } catch { /* silencioso */ }
            })();
          }
        } catch {
          // Error processing real-time update
        }
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  // Cargar y mantener la sala activa del monitor (para restricciones de acceso)
  useEffect(() => {
    const loadActive = async () => {
      try {
        const res = await getMyActiveEntry();
        if (res.has_active_entry && res.active_entry) {
          setActiveEntryRoomId(res.active_entry.roomId ?? null);
        } else {
          setActiveEntryRoomId(null);
        }
      } catch {
        setActiveEntryRoomId(null);
      }
    };
    loadActive();
    const refreshOnEvents = () => { loadActive(); };
    window.addEventListener('room-entry-added', refreshOnEvents as EventListener);
    window.addEventListener('room-entry-exited', refreshOnEvents as EventListener);
    return () => {
      window.removeEventListener('room-entry-added', refreshOnEvents as EventListener);
      window.removeEventListener('room-entry-exited', refreshOnEvents as EventListener);
    };
  }, []);



  // Recalcular conteos de pendientes por equipo cada vez que cambian los reportes
  useEffect(() => {
    const map: Record<string, number> = {};
    for (const r of reports) {
      if (r.status === 'pending') {
        map[r.computerId] = (map[r.computerId] || 0) + 1;
      }
    }
    setPendingByComputerId(map);
  }, [reports]);


  const getRoomStats = (room: Room) => {
    const total = room.computers.length;
    const operational = room.computers.filter(c => c.status === 'operational').length;
    const faulty = room.computers.filter(c => c.status === 'maintenance' || c.status === 'out_of_service').length;
    return { total, operational, faulty };
  };

  // Función para obtener el siguiente número de PC en una sala específica
  const getNextComputerNumber = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 1;
    
    // Obtener el número más alto de los PCs existentes en esta sala
    const maxNumber = room.computers.reduce((max, computer) => {
      return Math.max(max, computer.number);
    }, 0);
    
    return maxNumber + 1;
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setShowRoomModal(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    const proceed = await new Promise<boolean>(resolve => {
      const detail = {
        title: 'Eliminar sala',
        message: '¿Estás seguro de que quieres eliminar esta sala?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      };
      window.dispatchEvent(new CustomEvent('app-confirm', { detail }));
    });
    if (!proceed) return;
    try {
      await roomManagementService.deleteRoom(roomId);
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      showNotification('Sala eliminada', 'success');
    } catch {
      showNotification('Error al eliminar la sala. Por favor, intenta de nuevo.', 'error');
    }
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setCurrentView('room-detail');
  };

  const handleBackToRooms = () => {
    setCurrentView('rooms');
    setSelectedRoom(null);
  };

  const handleCreateComputer = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
      setEditingComputer(null);
      setShowComputerModal(true);
    }
  };

  const handleEditComputer = (computer: Computer) => {
    const room = rooms.find(r => r.id === computer.roomId);
    if (room) {
      setSelectedRoom(room);
      setEditingComputer(computer);
      setShowComputerModal(true);
    }
  };

  const handleDeleteComputer = async (computerId: string, roomId: string) => {
    const proceed = await new Promise<boolean>(resolve => {
      const detail = {
        title: 'Eliminar equipo',
        message: '¿Estás seguro de que quieres eliminar este equipo?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      };
      window.dispatchEvent(new CustomEvent('app-confirm', { detail }));
    });
    if (!proceed) return;
    try {
      await roomManagementService.deleteEquipment(computerId);
      setRooms(prevRooms => {
        const updatedRooms = prevRooms.map(room => 
          room.id === roomId 
            ? { ...room, computers: room.computers.filter(c => c.id !== computerId) }
            : room
        );
        
        // Actualizar también el selectedRoom si estamos eliminando un equipo de la sala actual
        if (selectedRoom && roomId === selectedRoom.id) {
          const updatedSelectedRoom = updatedRooms.find(r => r.id === selectedRoom.id);
          if (updatedSelectedRoom) {
            setSelectedRoom(updatedSelectedRoom);
          }
        }
        
        return updatedRooms;
      });
      showNotification('Equipo eliminado', 'success');
    } catch {
      showNotification('Error al eliminar el equipo. Por favor, intenta de nuevo.', 'error');
    }
  };

  const handleViewComputer = (computer: Computer) => {
    if (user?.role === 'monitor') {
      const compRoomNum = Number(computer.roomId);
      if (activeEntryRoomId == null) {
        showNotification('Debes tener una entrada activa para ver equipos.', 'error');
        return;
      }
      if (Number.isFinite(compRoomNum) && compRoomNum !== activeEntryRoomId) {
        showNotification('Solo puedes acceder a equipos de tu sala activa.', 'error');
        return;
      }
    }
    setSelectedComputer(computer);
    setShowReportModal(true);
  };

  const handleReportFault = async (computer: Computer) => {
    if (user?.role === 'monitor') {
      const compRoomNum = Number(computer.roomId);
      if (activeEntryRoomId == null) {
        showNotification('Debes registrar tu entrada en una sala antes de reportar.', 'error');
        return;
      }
      if (Number.isFinite(compRoomNum) && compRoomNum !== activeEntryRoomId) {
        showNotification('Solo puedes reportar fallas en la sala donde estás registrado.', 'error');
        return;
      }
    }
    setSelectedComputer(computer);
    setShowFaultReportModal(true);
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: 'pending' | 'resolved') => {
    // Optimista: guardar estado previo por si hay que revertir
    const previous = reports;
    setReports(prevReports => prevReports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    try {
      await roomManagementService.updateReportStatus(reportId, newStatus);
      // Refresco mínimo: reconsultar solo ese reporte para confirmar estado
      try {
        const fresh = await roomManagementService.getReportById(reportId);
        if (fresh) {
          setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: fresh.status } : r));
        }
      } catch { /* noop */ }
      // Refrescar lista completa de reportes en esta pestaña
      try {
        const latest = await roomManagementService.getReports();
        setReports(latest);
      } catch { /* noop */ }
      // Emitir actualización en tiempo real
      emitRealTimeUpdate('report-updated', { reportId, newStatus });
      showNotification('Reporte actualizado', 'success');
    } catch (error) {
      // Rollback
      setReports(previous);
      showNotification('No se pudo actualizar el reporte', 'error');
      throw error;
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    // Optimista
    const prev = reports;
    setReports(prevReports => prevReports.filter(r => r.id !== reportId));
    try {
      await roomManagementService.deleteReport(reportId);
      // Refrescar para certeza
      try {
        const latest = await roomManagementService.getReports();
        setReports(latest);
      } catch { /* noop */ }
      // Emitir evento para otras vistas/pestañas
      emitRealTimeUpdate('report-deleted', { reportId });
      showNotification('Reporte eliminado', 'success');
    } catch (err) {
      setReports(prev); // rollback
      showNotification('No se pudo eliminar el reporte', 'error');
      throw err;
    }
  };

  const handleSaveFaultReport = async (reportData: {
    computerId: string;
    roomId: string;
    issues: string[];
    reporter: string;
    description: string;
  }) => {
    try {
      // Crear el reporte en la API
      const newReport = await roomManagementService.createReport({
        equipment: parseInt(reportData.computerId),
        issue_description: reportData.description,
        reported_by: user?.id || 1, // Usar ID del usuario actual
        issue_type: reportData.issues.join(', ')
      });
      
      // Asignar roomId al reporte
      newReport.roomId = reportData.roomId;
      newReport.issues = reportData.issues;
      newReport.reporter = reportData.reporter;
      
      // Guardar el reporte en el historial
      setReports(prevReports => [...prevReports, newReport]);
      // Refrescar lista completa de reportes en esta pestaña
      try {
        const latest = await roomManagementService.getReports();
        setReports(latest);
      } catch { /* noop */ }
      
      // Emitir actualización en tiempo real
      emitRealTimeUpdate('report-created', {
        report: newReport,
        computerId: reportData.computerId,
        roomId: reportData.roomId
      });
      
      // Solo los administradores pueden cambiar el estado del equipo
      if (user?.role === 'admin') {
        await roomManagementService.updateEquipment(reportData.computerId, {
          status: 'out_of_service'
        });
      }
      
      // Actualizar el selectedRoom para todos los usuarios (para que se vea el badge de reportes)
      if (selectedRoom && reportData.roomId === selectedRoom.id) {
        setSelectedRoom(prevSelectedRoom => {
          if (prevSelectedRoom) {
            return {
              ...prevSelectedRoom,
              computers: prevSelectedRoom.computers.map(c => 
                c.id === reportData.computerId 
                  ? { ...c, status: user?.role === 'admin' ? 'out_of_service' as const : c.status }
                  : c
              )
            };
          }
          return prevSelectedRoom;
        });
      }

      // Solo los administradores cambian el estado del equipo en todas las salas
      if (user?.role === 'admin') {
        // Marcar el equipo como fuera de servicio en todas las salas
        setRooms(prevRooms => {
          const updatedRooms = prevRooms.map(room => 
            room.id === reportData.roomId 
              ? { 
                  ...room, 
                  computers: room.computers.map(c => 
                    c.id === reportData.computerId 
                      ? { ...c, status: 'out_of_service' as const }
                      : c
                  )
                }
              : room
          );
          
          return updatedRooms;
        });
      }
      
      setShowFaultReportModal(false);
      showNotification('✅ Reporte enviado exitosamente', 'success');
    } catch {
      showNotification('Error al enviar el reporte. Por favor, intenta de nuevo.', 'error');
    }
  };

  const handleSaveRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'computers'>) => {
    try {
      if (editingRoom) {
        const updatedRoom = await roomManagementService.updateRoom(editingRoom.id, {
          name: roomData.name,
          capacity: roomData.capacity,
          description: roomData.description
        });
        setRooms(prevRooms => 
          prevRooms.map(room => 
            room.id === editingRoom.id ? updatedRoom : room
          )
        );
      } else {
        // Generar código único si no se proporciona
        const generateUniqueCode = () => {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 5).toUpperCase();
          return `SALA-${timestamp}-${random}`;
        };

        const newRoom = await roomManagementService.createRoom({
          name: roomData.name,
          code: roomData.code || generateUniqueCode(),
          capacity: roomData.capacity,
          description: roomData.description || ''
        });
        setRooms(prevRooms => [...prevRooms, newRoom]);
      }
      setShowRoomModal(false);
    } catch (error) {
      
      // Manejar error específico de código duplicado
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data as { details?: { code?: string } };
        if (errorData?.details?.code?.includes('ya existe')) {
          showNotification('El código de sala ya existe. Por favor, usa un código diferente.', 'error');
        } else {
          showNotification('Error al guardar la sala. Por favor, intenta de nuevo.', 'error');
        }
      } else {
        showNotification('Error al guardar la sala. Por favor, intenta de nuevo.', 'error');
      }
    }
  };

  const handleSaveComputer = async (computerData: Omit<Computer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingComputer) {
        // Actualizar equipo existente
        const updatedComputer = await roomManagementService.updateEquipment(editingComputer.id, {
          serial_number: computerData.serial,
          name: `PC ${computerData.number}`,
          description: computerData.serial,
          status: computerData.status
        });
        
        setRooms(prevRooms => {
          const updatedRooms = prevRooms.map(room =>
            room.id === editingComputer.roomId
              ? { 
                  ...room, 
                  computers: room.computers.map(c => 
                    c.id === editingComputer.id ? updatedComputer : c
                  )
                }
              : room
          );
          
          // Actualizar también el selectedRoom si estamos editando un equipo de la sala actual
          if (selectedRoom && editingComputer.roomId === selectedRoom.id) {
            const updatedSelectedRoom = updatedRooms.find(r => r.id === selectedRoom.id);
            if (updatedSelectedRoom) {
              setSelectedRoom(updatedSelectedRoom);
            }
          }
          
          return updatedRooms;
        });
      } else if (selectedRoom) {
        // Crear nuevo equipo
        const nextNumber = getNextComputerNumber(selectedRoom.id);
        const newComputer = await roomManagementService.createEquipment({
          serial_number: computerData.serial,
          name: `PC ${nextNumber}`,
          description: computerData.serial,
          room: parseInt(selectedRoom.id),
          status: computerData.status === 'operational' ? 'operational' : 'maintenance',
          acquisition_date: new Date().toISOString()
        });
        
        
        setRooms(prevRooms => {
          const updatedRooms = prevRooms.map(room => 
            room.id === selectedRoom.id 
              ? { ...room, computers: [...room.computers, newComputer] }
              : room
          );
          
          // Actualizar también el selectedRoom para que la vista se actualice inmediatamente
          const updatedSelectedRoom = updatedRooms.find(r => r.id === selectedRoom.id);
          if (updatedSelectedRoom) {
            setSelectedRoom(updatedSelectedRoom);
          }
          
          return updatedRooms;
        });
      }
      setShowComputerModal(false);
    } catch {
        showNotification('Error al guardar el equipo. Por favor, intenta de nuevo.', 'error');
    }
  };

  const renderRoomsView = () => (
    <div className="room-management-container">
      <header className="room-management-header">
        <div className="header-content">
          <h1>Sistema de Gestión de Salas de Cómputo</h1>
          <p className="subtitle">Haz clic en una sala para ver sus equipos</p>
        </div>
        {canCreateRooms() && (
          <button className="create-room-btn" onClick={handleCreateRoom}>
            <Plus size={20} />
            Nueva Sala
          </button>
        )}
      </header>

      <div className="rooms-grid">
        {rooms.map(room => {
          const stats = getRoomStats(room);
          return (
            <div 
              key={room.id} 
              className="room-card clickable"
              onClick={() => handleRoomClick(room)}
            >
              <div className="room-card-header">
                <div className="room-info">
                  <h3 className="room-name">{room.name}</h3>
                  <p className="room-location">{room.code} · Capacidad: {room.capacity}</p>
                </div>
                <div className="room-actions">
                  {canEditRooms() && (
                    <button 
                      className="action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRoom(room);
                      }}
                      title="Editar sala"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {canDeleteRooms() && (
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.id);
                      }}
                      title="Eliminar sala"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="room-card-body">
                <div className="room-stats">
                   <div className="stat-item">
                     <div className="stat-icon">
                       <Monitor size={20} />
                     </div>
                     <div className="stat-content">
                       <div className="stat-number">{stats.total}</div>
                       <div className="stat-label">Total Equipos</div>
                     </div>
                   </div>
                  
                  <div className="stat-item">
                    <div className="stat-icon operational">
                      <CheckCircle size={20} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number operational">{stats.operational}</div>
                      <div className="stat-label">Operativos</div>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-icon faulty">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number faulty">{stats.faulty}</div>
                      <div className="stat-label">Con Fallas</div>
                    </div>
                  </div>
                </div>
                
                <div className="room-description">
                  <p>{room.description || 'Sin descripción'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRoomDetailView = () => {
    if (!selectedRoom) return null;
    
    const stats = getRoomStats(selectedRoom);
    
    return (
      <div className="room-management-container">
        <header className="room-management-header">
          <div className="header-content">
            <button className="back-btn" onClick={handleBackToRooms}>
              ← Volver a Salas
            </button>
            <h1>{selectedRoom.name}</h1>
            <p className="subtitle">Gestión de equipos de la sala</p>
          </div>
          {canCreateComputers() && (
            <button className="create-room-btn" onClick={() => handleCreateComputer(selectedRoom.id)}>
              <Plus size={20} />
              Nuevo Equipo
            </button>
          )}
        </header>

        <div className="room-detail-stats">
           <div className="stat-card">
             <div className="stat-icon">
               <Monitor size={24} />
             </div>
             <div className="stat-content">
               <div className="stat-number">{stats.total}</div>
               <div className="stat-label">Total Equipos</div>
             </div>
           </div>
          
          <div className="stat-card">
            <div className="stat-icon operational">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number operational">{stats.operational}</div>
              <div className="stat-label">Operativos</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon faulty">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number faulty">{stats.faulty}</div>
              <div className="stat-label">Con Fallas</div>
            </div>
          </div>
        </div>

        <div className="computers-section">
          <h2>Equipos de la Sala</h2>
          <div className="computers-grid">
            {selectedRoom.computers.map(computer => {
              const pendingCount = pendingByComputerId[computer.id] || 0;

              return (
                <div 
                  key={computer.id} 
                  className={`computer-card ${computer.status}`}
                  onClick={() => handleViewComputer(computer)}
                >
                {/* Indicador de reportes pendientes - Esquina superior izquierda */}
                {pendingCount > 0 && (
                  <div className="pending-reports-badge">
                    <AlertCircle size={12} />
                    <span>{pendingCount}</span>
                  </div>
                )}
                
                <div className="computer-icon">
                  <Monitor size={24} />
                </div>
                <div className="computer-header">
                  <span className="computer-number">PC {computer.number}</span>
                </div>
                <div className="computer-serial">{computer.serial}</div>
                <div className={`status-badge ${computer.status}`}>
                  {computer.status === 'operational' && 'Operativo'}
                  {computer.status === 'maintenance' && 'En Mantenimiento'}
                  {computer.status === 'out_of_service' && 'Fuera de Servicio'}
                </div>
                <div className="computer-actions">
                  {canReportFaults() && (
                    <button 
                      className="action-btn report-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportFault(computer);
                      }}
                      title="Reportar falla"
                    >
                      <AlertCircle size={12} />
                    </button>
                  )}
                  {canEditComputers() && (
                    <button 
                      className="action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditComputer(computer);
                      }}
                      title="Editar equipo"
                    >
                      <Edit size={12} />
                    </button>
                  )}
                  {canDeleteComputers() && (
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteComputer(computer.id, selectedRoom.id);
                      }}
                      title="Eliminar equipo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                
                
              </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="room-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="room-management-container">
        <div className="error-container">
          <h2>Error al cargar los datos</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'rooms' ? renderRoomsView() : renderRoomDetailView()}

      {showRoomModal && (
        <RoomModal
          room={editingRoom}
          onSave={handleSaveRoom}
          onClose={() => setShowRoomModal(false)}
        />
      )}

      {showComputerModal && selectedRoom && (
        <ComputerModal
          computer={editingComputer}
          room={selectedRoom}
          onSave={handleSaveComputer}
          onClose={() => setShowComputerModal(false)}
        />
      )}

      {showReportModal && selectedComputer && (
        <ReportModal
          computer={selectedComputer}
          reports={reports.filter(r => r.computerId === selectedComputer.id)}
          onClose={() => setShowReportModal(false)}
          onUpdateReportStatus={handleUpdateReportStatus}
          onDeleteReport={handleDeleteReport}
        />
      )}

      {showFaultReportModal && selectedComputer && (
        <FaultReportModal
          computer={selectedComputer}
          onSave={handleSaveFaultReport}
          onClose={() => setShowFaultReportModal(false)}
        />
      )}

      {/* Notificaciones */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </>
  );
};
