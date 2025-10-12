import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  XCircle,
  X,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  XCircle as XCircleIcon,
  Users,
  UserCheck
} from 'lucide-react';
import userManagementService from '../../services/userManagementService';
import type { User, UserFilters, CreateUserData, ApiError } from '../../types';
import type { UpdateUserData } from '../../services/userManagementService';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/UserManagement.css';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Todos los usuarios sin filtrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    is_verified: undefined
  });
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Estados para formulario de edición
  const [editUser, setEditUser] = useState<UpdateUserData>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // Estados de carga para acciones
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  
  // Estado de carga para modal de eliminación
  const [deleteModalLoading, setDeleteModalLoading] = useState(false);
  
  // Estados para formulario de nuevo usuario
  const [newUser, setNewUser] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    identification: '',
    phone: '',
    role: 'monitor'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Estados para validación visual de contraseña
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Función de filtrado local
  const filterUsers = useCallback((users: User[], currentFilters: UserFilters): User[] => {
    return users.filter(user => {
      // Filtro por búsqueda (nombre, email, identificación)
      if (currentFilters.search && currentFilters.search.trim()) {
        const searchTerm = currentFilters.search.toLowerCase().trim();
        const matchesSearch = 
          user.full_name?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.identification?.toLowerCase().includes(searchTerm) ||
          user.username?.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }
      
      // Filtro por rol
      if (currentFilters.role && user.role !== currentFilters.role) {
        return false;
      }
      
      // Filtro por verificación
      if (currentFilters.is_verified !== undefined && user.is_verified !== currentFilters.is_verified) {
        return false;
      }
      
      return true;
    });
  }, []);

  // Cargar usuarios (solo backend, sin filtros)
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Cargar todos los usuarios sin filtros del backend
      const usersData = await userManagementService.getUsers();
      setAllUsers(usersData);
      setUsers(usersData);
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error.message || 'Error al cargar usuarios';
      setError(errorMessage);
      // Mostrar toast de error
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: errorMessage, type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar recreación constante

  // Manejar filtros
  const handleFilterChange = (key: keyof UserFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Aplicar filtros localmente cuando cambien los filtros o los usuarios
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filteredUsers = filterUsers(allUsers, filters);
      setUsers(filteredUsers);
    }, 300); // Debounce para búsqueda

    return () => clearTimeout(timeoutId);
  }, [filters, allUsers, filterUsers]); // Incluir filterUsers en dependencias

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      is_verified: undefined
    });
  };

  // Validar criterios de contraseña en tiempo real
  const validatePasswordCriteria = (password: string) => {
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    });
  };

  // Manejar formulario de nuevo usuario
  const handleNewUserChange = (field: keyof CreateUserData, value: string) => {
    // Validación especial para identificación (solo números)
    if (field === 'identification') {
      // Solo permitir números
      const numericValue = value.replace(/[^0-9]/g, '');
      // Limitar a 10 dígitos máximo
      const limitedValue = numericValue.slice(0, 10);
      setNewUser(prev => ({
        ...prev,
        [field]: limitedValue
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Validar criterios de contraseña en tiempo real
      if (field === 'password') {
        validatePasswordCriteria(value);
      }
    }
    setCreateError(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!newUser.username.trim()) {
      setCreateError('El nombre de usuario es requerido');
      return;
    }
    if (!newUser.email.trim()) {
      setCreateError('El email es requerido');
      return;
    }
    if (!newUser.first_name.trim()) {
      setCreateError('El nombre es requerido');
      return;
    }
    if (!newUser.last_name.trim()) {
      setCreateError('El apellido es requerido');
      return;
    }
    if (!newUser.password.trim()) {
      setCreateError('La contraseña es requerida');
      return;
    }
    if (!newUser.password_confirm.trim()) {
      setCreateError('La confirmación de contraseña es requerida');
      return;
    }
    if (newUser.password !== newUser.password_confirm) {
      setCreateError('Las contraseñas no coinciden');
      return;
    }
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setCreateError('El email debe tener un formato válido');
      return;
    }
    
    // Validación de identificación (solo números, 6-10 dígitos)
    if (newUser.identification && newUser.identification.trim()) {
      const identificationRegex = /^\d{6,10}$/;
      if (!identificationRegex.test(newUser.identification)) {
        setCreateError('La identificación debe tener entre 6 y 10 dígitos numéricos');
        return;
      }
    }
    
    // Validación de contraseña (mayúscula, minúscula, número, especial, mínimo 8)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newUser.password)) {
      setCreateError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial');
      return;
    }

    // Validaciones adicionales de longitud y formato
    if (newUser.username.length < 3) {
      setCreateError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }
    if (newUser.username.length > 30) {
      setCreateError('El nombre de usuario no puede tener más de 30 caracteres');
      return;
    }
    if (newUser.first_name.length < 2) {
      setCreateError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    if (newUser.last_name.length < 2) {
      setCreateError('El apellido debe tener al menos 2 caracteres');
      return;
    }
    if (newUser.phone && newUser.phone.length < 7) {
      setCreateError('El teléfono debe tener al menos 7 dígitos');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      
      await userManagementService.createUser(newUser);
      
      // Limpiar formulario y cerrar modal
      setNewUser({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        identification: '',
        phone: '',
        role: 'monitor'
      });
      setShowCreateModal(false);
      
      // Mostrar toast de éxito
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Usuario creado exitosamente', type: 'success' }
      }));
      
      // Recargar lista de usuarios
      loadUsers();
    } catch (err: unknown) {
      
      let errorMessage = 'Error al crear usuario';
      
      // Manejar diferentes tipos de errores
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        const apiError = err as { message: string; status?: number };
        errorMessage = apiError.message;
        
        // Manejar errores específicos del backend
        if (apiError.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor, intenta nuevamente.';
        } else if (apiError.status === 400) {
          // Intentar extraer errores de validación específicos
          if (err && typeof err === 'object' && 'data' in err) {
            const errorData = (err as { data: unknown }).data;
            if (errorData && typeof errorData === 'object') {
              const data = errorData as Record<string, unknown>;
              if (data.username && Array.isArray(data.username)) {
                errorMessage = `Nombre de usuario: ${data.username[0]}`;
              } else if (data.email && Array.isArray(data.email)) {
                errorMessage = `Email: ${data.email[0]}`;
              } else if (data.password && Array.isArray(data.password)) {
                errorMessage = `Contraseña: ${data.password[0]}`;
              } else if (data.identification && Array.isArray(data.identification)) {
                errorMessage = `Identificación: ${data.identification[0]}`;
              }
            }
          }
        } else if (apiError.status === 409) {
          errorMessage = 'El usuario o email ya existe. Por favor, usa otros datos.';
        }
      }
      
      setCreateError(errorMessage);
      // Mostrar toast de error
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: errorMessage, type: 'error' }
      }));
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewUser({
      username: '',
      email: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      identification: '',
      phone: '',
      role: 'monitor'
    });
    setCreateError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordCriteria({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    });
  };

  // Acciones de usuario
  const handleEditUser = (user: User) => {
    // Bloquear edición de otros administradores: solo te puedes editar a ti mismo
    if (user.role === 'admin' && user.id !== (userContextUserId())) {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: 'No puedes editar a otro administrador', 
          type: 'error'
        }
      }));
      return;
    }
    setSelectedUser(user);
    
    // Separar full_name en first_name y last_name
    const nameParts = user.full_name ? user.full_name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setEditUser({
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      phone: user.phone || '',
      identification: user.identification || '',
      role: user.role,
      is_verified: user.is_verified
    });
    setEditError(null);
    setShowEditModal(true);
  };

  // Helper para obtener el id del usuario autenticado con fallback seguro
  const userContextUserId = () => {
    try {
      return user?.id as unknown as number;
    } catch {
      return -1;
    }
  };

  // Manejar cambios en formulario de edición
  const handleEditUserChange = (field: keyof UpdateUserData, value: string | boolean) => {
    let processedValue = value;
    
    // Validaciones en tiempo real
    if (typeof value === 'string') {
      if (field === 'identification') {
        // Solo permitir números para identificación
        processedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      } else if (field === 'phone') {
        // Solo permitir números para teléfono
        processedValue = value.replace(/[^0-9]/g, '');
      }
    }
    
    setEditUser((prev: UpdateUserData) => ({
      ...prev,
      [field]: processedValue
    }));
    setEditError(null);
  };

  // Guardar cambios de usuario
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    // Prevenir múltiples solicitudes
    if (editLoading) return;

    // Validaciones básicas
    if (!editUser.email?.trim()) {
      setEditError('El email es requerido');
      return;
    }
    if (!editUser.first_name?.trim()) {
      setEditError('El nombre es requerido');
      return;
    }
    if (!editUser.last_name?.trim()) {
      setEditError('El apellido es requerido');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editUser.email && !emailRegex.test(editUser.email)) {
      setEditError('El email debe tener un formato válido');
      return;
    }

    // Validación de identificación (solo números, 6-10 dígitos)
    if (editUser.identification && editUser.identification.trim()) {
      const identificationRegex = /^\d{6,10}$/;
      if (!identificationRegex.test(editUser.identification)) {
        setEditError('La identificación debe tener entre 6 y 10 dígitos numéricos');
        return;
      }
    }

    try {
      // Pre-chequeo: impedir enviar cambios si es otro admin
      if (selectedUser.role === 'admin' && selectedUser.id !== userContextUserId()) {
        setEditError('No puedes editar a otro administrador');
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: 'No puedes editar a otro administrador', type: 'error' }
        }));
        return;
      }

      setEditLoading(true);
      setEditError(null);
      
      await userManagementService.updateUser(selectedUser.id, editUser);
      
      // Cerrar modal y recargar lista
      setShowEditModal(false);
      setSelectedUser(null);
      setEditUser({});
      loadUsers();
      
      // Mostrar toast de éxito
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Usuario actualizado exitosamente', type: 'success' }
      }));
    } catch (err: unknown) {
      const error = err as ApiError;
      // Si el backend ahora devuelve 403/404, NO redirigimos: mostramos toast/controlado
      let errorMessage = error.message || 'Error al actualizar el usuario';
      if ('status' in error && error.status === 403) {
        errorMessage = 'Acceso denegado: no puedes editar a este usuario';
      } else if ('status' in error && error.status === 404) {
        errorMessage = 'Usuario no encontrado o no editable';
      }
      setEditError(errorMessage);
      // Mostrar toast de error
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: errorMessage, type: 'error' }
      }));
    } finally {
      setEditLoading(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditUser({});
    setEditError(null);
  };

  const handleDeleteUser = (user: User) => {
    // Bloquear eliminación del administrador protegido id=1
    if (user.id === 1 && user.role === 'admin') {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: 'No se puede eliminar al administrador principal', 
          type: 'error' 
        }
      }));
      return;
    }
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Confirmar eliminación de usuario
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    // Prevenir múltiples solicitudes
    if (deleteModalLoading) return;

    try {
      setDeleteModalLoading(true);
      
      await userManagementService.deleteUser(selectedUser.id);
      
      // Cerrar modal y recargar lista
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
      
      // Mostrar toast de éxito
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Usuario eliminado exitosamente', type: 'success' }
      }));
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error.message || 'Error al eliminar el usuario';
      // Mostrar toast de error
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: errorMessage, type: 'error' }
      }));
    } finally {
      setDeleteModalLoading(false);
    }
  };

  // Verificar/Desverificar usuario
  const handleVerifyUser = async (user: User) => {
    const actionKey = `verify-${user.id}`;
    
    // Bloquear verificación/desverificación del administrador protegido id=1
    if (user.id === 1 && user.role === 'admin') {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message: 'No se puede cambiar la verificación del administrador principal', 
          type: 'error' 
        }
      }));
      return;
    }

    // Prevenir múltiples solicitudes
    if (loadingStates[actionKey]) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, [actionKey]: true }));
      
      const newVerifiedStatus = !user.is_verified;
      await userManagementService.verifyUser(user.id, newVerifiedStatus);
      
      // Recargar lista de usuarios
      loadUsers();
      
      // Mostrar toast de éxito
      const message = newVerifiedStatus 
        ? 'Usuario verificado exitosamente' 
        : 'Usuario desverificado exitosamente';
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { 
          message, 
          type: 'success',
          duration: 4000
        }
      }));
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error.message || 'Error al cambiar el estado de verificación del usuario';
      // Mostrar toast de error
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: errorMessage, type: 'error' }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [actionKey]: false }));
    }
  };


  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };


  if (user?.role !== 'admin') {
    return (
      <div className="user-management-container">
        <div className="access-denied">
          <Shield size={48} />
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-content">
          <h1>Gestión de Usuarios</h1>
          <p>Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button 
          className="btn-danger"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Botón Limpiar Filtros */}
      <div className="clear-filters-container">
        <button onClick={clearFilters} className="btn-clear-filters">
          Limpiar Filtros
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o cédula..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <Users size={20} />
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              className="filter-select"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="monitor">Monitor</option>
            </select>
          </div>

          <div className="filter-group">
            <UserCheck size={20} />
            <select
              value={filters.is_verified === undefined ? '' : filters.is_verified.toString()}
              onChange={(e) => handleFilterChange('is_verified', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="filter-select"
            >
              <option value="">Todos los estados</option>
              <option value="true">Verificados</option>
              <option value="false">No verificados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="users-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <XCircle size={48} />
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => loadUsers()} className="btn-primary">
              Reintentar
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <UserIcon size={48} />
            <h3>No hay usuarios</h3>
            <p>No se encontraron usuarios con los filtros aplicados.</p>
            <button onClick={clearFilters} className="btn-primary">
              Limpiar Filtros
            </button>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Identificación</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Verificado</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td title={user.full_name}>{user.full_name}</td>
                    <td title={`@${user.username}`}>@{user.username}</td>
                    <td title={user.email}>{user.email}</td>
                    <td title={user.identification || 'Sin identificación'}>{user.identification || '-'}</td>
                    <td title={user.phone || 'Sin teléfono'}>{user.phone || '-'}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Administrador' : 'Monitor'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_verified ? 'verified' : 'pending'}`}>
                        {user.is_verified ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>{formatDate(user.date_joined)}</td>
                    <td>
                      <div className="user-actions-horizontal">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="btn-action btn-edit"
                          title={user.role === 'admin' && user.id !== userContextUserId() ? 'No puedes editar a otro administrador' : 'Editar usuario'}
                          disabled={editLoading || (user.role === 'admin' && user.id !== userContextUserId())}
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleVerifyUser(user)}
                          className={`btn-action ${user.is_verified ? 'btn-unverify' : 'btn-verify'}`}
                          title={(user.id === 1 && user.role === 'admin') ? 'Acción no permitida para el administrador principal' : (user.is_verified ? 'Desverificar usuario' : 'Verificar usuario')}
                          disabled={loadingStates[`verify-${user.id}`] || (user.id === 1 && user.role === 'admin')}
                        >
                          {loadingStates[`verify-${user.id}`] ? (
                            <div className="loading-spinner" />
                          ) : user.is_verified ? (
                            <XCircleIcon size={16} />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="btn-action btn-delete"
                          title={(user.id === 1 && user.role === 'admin') ? 'No se puede eliminar al administrador principal' : 'Eliminar usuario'}
                          disabled={loadingStates[`delete-${user.id}`] || (user.id === 1 && user.role === 'admin')}
                        >
                          {loadingStates[`delete-${user.id}`] ? (
                            <div className="loading-spinner" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nuevo Usuario */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Usuario</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="username">Nombre de Usuario *</label>
                  <input
                    type="text"
                    id="username"
                    value={newUser.username}
                    onChange={(e) => handleNewUserChange('username', e.target.value)}
                    placeholder="Ingresa el nombre de usuario"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) => handleNewUserChange('email', e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="first_name">Nombre *</label>
                  <input
                    type="text"
                    id="first_name"
                    value={newUser.first_name}
                    onChange={(e) => handleNewUserChange('first_name', e.target.value)}
                    placeholder="Nombre"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Apellido *</label>
                  <input
                    type="text"
                    id="last_name"
                    value={newUser.last_name}
                    onChange={(e) => handleNewUserChange('last_name', e.target.value)}
                    placeholder="Apellido"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="identification">Identificación</label>
                  <input
                    type="text"
                    id="identification"
                    value={newUser.identification}
                    onChange={(e) => handleNewUserChange('identification', e.target.value)}
                    placeholder="6-10 dígitos numéricos"
                    minLength={6}
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Teléfono</label>
                  <input
                    type="text"
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => handleNewUserChange('phone', e.target.value)}
                    placeholder="Número de teléfono"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Contraseña *</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={newUser.password}
                      onChange={(e) => handleNewUserChange('password', e.target.value)}
                      placeholder="Contraseña"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Validador visual de contraseña */}
                  {newUser.password && (
                    <div className="password-validator">
                      <div className="validator-title">Requisitos de contraseña:</div>
                      <div className="validator-criteria">
                        <div className={`criterion ${passwordCriteria.length ? 'valid' : 'invalid'}`}>
                          <span className="criterion-icon">
                            {passwordCriteria.length ? '✓' : '✗'}
                          </span>
                          Mínimo 8 caracteres
                        </div>
                        <div className={`criterion ${passwordCriteria.uppercase ? 'valid' : 'invalid'}`}>
                          <span className="criterion-icon">
                            {passwordCriteria.uppercase ? '✓' : '✗'}
                          </span>
                          Una letra mayúscula
                        </div>
                        <div className={`criterion ${passwordCriteria.lowercase ? 'valid' : 'invalid'}`}>
                          <span className="criterion-icon">
                            {passwordCriteria.lowercase ? '✓' : '✗'}
                          </span>
                          Una letra minúscula
                        </div>
                        <div className={`criterion ${passwordCriteria.number ? 'valid' : 'invalid'}`}>
                          <span className="criterion-icon">
                            {passwordCriteria.number ? '✓' : '✗'}
                          </span>
                          Un número
                        </div>
                        <div className={`criterion ${passwordCriteria.special ? 'valid' : 'invalid'}`}>
                          <span className="criterion-icon">
                            {passwordCriteria.special ? '✓' : '✗'}
                          </span>
                          Un carácter especial (@$!%*?&)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password_confirm">Confirmar Contraseña *</label>
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="password_confirm"
                      value={newUser.password_confirm}
                      onChange={(e) => handleNewUserChange('password_confirm', e.target.value)}
                      placeholder="Confirmar contraseña"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Indicador de coincidencia de contraseñas */}
                  {newUser.password_confirm && (
                    <div className={`password-match ${newUser.password === newUser.password_confirm ? 'match' : 'no-match'}`}>
                      <span className="match-icon">
                        {newUser.password === newUser.password_confirm ? '✓' : '✗'}
                      </span>
                      {newUser.password === newUser.password_confirm ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="role">Rol *</label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => handleNewUserChange('role', e.target.value as 'admin' | 'monitor')}
                    required
                  >
                    <option value="monitor">Monitor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {createError && (
                <div className="form-error">
                  <XCircle size={16} />
                  {createError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  disabled={createLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <>
                      <div className="spinner-small"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Crear Usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Usuario</h2>
              <button 
                className="modal-close"
                onClick={handleCancelEdit}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="edit-email">Email *</label>
                  <input
                    type="email"
                    id="edit-email"
                    value={editUser.email || ''}
                    onChange={(e) => handleEditUserChange('email', e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    title="Formato de email válido (ejemplo@dominio.com)"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-first_name">Nombre *</label>
                  <input
                    type="text"
                    id="edit-first_name"
                    value={editUser.first_name || ''}
                    onChange={(e) => handleEditUserChange('first_name', e.target.value)}
                    placeholder="Nombre"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-last_name">Apellido *</label>
                  <input
                    type="text"
                    id="edit-last_name"
                    value={editUser.last_name || ''}
                    onChange={(e) => handleEditUserChange('last_name', e.target.value)}
                    placeholder="Apellido"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-phone">Teléfono</label>
                  <input
                    type="tel"
                    id="edit-phone"
                    value={editUser.phone || ''}
                    onChange={(e) => handleEditUserChange('phone', e.target.value)}
                    placeholder="Solo números"
                    pattern="[0-9]+"
                    title="Solo números"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-identification">Identificación</label>
                  <input
                    type="text"
                    id="edit-identification"
                    value={editUser.identification || ''}
                    onChange={(e) => handleEditUserChange('identification', e.target.value)}
                    placeholder="6-10 dígitos numéricos"
                    minLength={6}
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-role">Rol</label>
                  <select
                    id="edit-role"
                    value={editUser.role || 'monitor'}
                    onChange={(e) => handleEditUserChange('role', e.target.value as 'admin' | 'monitor')}
                  >
                    <option value="monitor">Monitor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-is_verified">Verificado</label>
                  <select
                    id="edit-is_verified"
                    value={String(editUser.is_verified ?? false)}
                    onChange={(e) => handleEditUserChange('is_verified', e.target.value === 'true')}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              
              {/* Nota removida: ahora los admins pueden editar identificación, rol y verificación */}
              
              {editError && (
                <div className="form-error">
                  <XCircle size={16} />
                  {editError}
                </div>
              )}
              
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={editLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <div className="spinner-small"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Usuario</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="delete-confirmation">
              <div className="warning-icon">
                <XCircle size={48} />
              </div>
              
              <div className="confirmation-content">
                <h3>¿Estás seguro de eliminar este usuario?</h3>
                <p>Esta acción no se puede deshacer.</p>
                
                <div className="user-info">
                  <div className="info-item">
                    <strong>Nombre:</strong> {selectedUser.full_name}
                  </div>
                  <div className="info-item">
                    <strong>Usuario:</strong> @{selectedUser.username}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {selectedUser.email}
                  </div>
                  <div className="info-item">
                    <strong>Rol:</strong> {selectedUser.role === 'admin' ? 'Administrador' : 'Monitor'}
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteModalLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={deleteModalLoading}
                >
                  {deleteModalLoading ? (
                    <>
                      <div className="loading-spinner" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Eliminar Usuario
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

