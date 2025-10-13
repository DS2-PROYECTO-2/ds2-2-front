import React, { useState } from 'react';
import { Mail, User as UserIcon } from 'lucide-react';
import type { User } from '../../context/AuthContext';

interface ProfileEditFormProps {
    user: User;
    onSave: (updatedData: Partial<User>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

interface FormData {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    phone: string;
    identification: string;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
    user,
    onSave,
    onCancel,
    isLoading = false
}) => {
    const [formData, setFormData] = useState<FormData>({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
    phone: (user as User & { phone?: string }).phone || '',
    identification: (user as User & { identification?: string }).identification || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validar formulario
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'El nombre es requerido';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'El apellido es requerido';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'El nombre de usuario es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El formato del correo electrónico no es válido';
        }

        if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
            newErrors.phone = 'El formato del teléfono no es válido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejar cambios en los campos
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error al guardar perfil:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-edit-form">
            {/* Información Personal */}
            <div className="form-section">
                <h3 className="section-title">
                    <UserIcon size={20} />
                    Información Personal
                </h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="first_name">Nombre *</label>
                        <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            className={errors.first_name ? 'error' : ''}
                            placeholder="Ingresa tu nombre"
                        />
                        {errors.first_name && (
                            <span className="error-message">{errors.first_name}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="last_name">Apellido *</label>
                        <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            className={errors.last_name ? 'error' : ''}
                            placeholder="Ingresa tu apellido"
                        />
                        {errors.last_name && (
                            <span className="error-message">{errors.last_name}</span>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="username">Nombre de Usuario *</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={errors.username ? 'error' : ''}
                        placeholder="Ingresa tu nombre de usuario"
                    />
                    {errors.username && (
                        <span className="error-message">{errors.username}</span>
                    )}
                </div>

            </div>

            {/* Información de Contacto */}
            <div className="form-section">
                <h3 className="section-title">
                    <Mail size={20} />
                    Información de Contacto
                </h3>

                <div className="form-group">
                    <label htmlFor="email">Correo Electrónico *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? 'error' : ''}
                        placeholder="Ingresa tu correo electrónico"
                    />
                    {errors.email && (
                        <span className="error-message">{errors.email}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Teléfono</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={errors.phone ? 'error' : ''}
                        placeholder="Ingresa tu número de teléfono"
                    />
                    {errors.phone && (
                        <span className="error-message">{errors.phone}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="identification">Identificación</label>
                    <input
                        type="text"
                        id="identification"
                        name="identification"
                        value={formData.identification}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu número de identificación"
                    />
                </div>
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
                <button
                    type="button"
                    className="btn btn-cancel"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
};

export default ProfileEditForm;
