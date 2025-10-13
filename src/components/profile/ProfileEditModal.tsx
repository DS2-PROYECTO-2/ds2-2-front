import React from 'react';
import { X } from 'lucide-react';
import ProfileEditForm from './ProfileEditForm';
import type { User } from '../../context/AuthContext';

interface ProfileEditModalProps {
    user: User;
    onSave: (updatedData: Partial<User>) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
    user,
    onSave,
    onClose,
    isLoading = false
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Perfil</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <ProfileEditForm
                        user={user}
                        onSave={onSave}
                        onCancel={onClose}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProfileEditModal;
