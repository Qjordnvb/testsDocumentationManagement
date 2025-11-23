/**
 * Users Management Page (ADMIN Only)
 * CRUD operations for user management with invitation-based registration
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { usersApi } from '@/entities/user';
import type { User, CreateUserInvitationDTO, Role } from '@/entities/user';
import { Users, Plus, Trash2, X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LoadingSpinner,
  EmptyState,
  RoleBadge,
  Badge,
  FormGroup,
  Input,
  Select,
  Button,
} from '@/shared/ui';

export const UsersManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();  // Token auto-injected by apiClient
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (invitation: CreateUserInvitationDTO) => {
    try {
      await usersApi.createInvitation(invitation);  // Token auto-injected by apiClient
      toast.success(`Invitación creada para ${invitation.email}`);
      setShowCreateModal(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear invitación');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await usersApi.delete(userId);  // Token auto-injected by apiClient
      toast.success('Usuario eliminado exitosamente');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Cargando usuarios..." center />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">Administrar invitaciones y usuarios del sistema</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => setShowCreateModal(true)}
        >
          Crear Invitación
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RoleBadge role={user.role as 'admin' | 'qa' | 'dev' | 'manager'} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={user.is_active ? 'success' : 'default'}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RegistrationStatusBadge user={user} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser?.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <EmptyState
            icon={<Users className="w-full h-full" />}
            message="No hay usuarios registrados"
            description="Crea tu primera invitación para agregar usuarios al sistema"
            action={
              <Button
                variant="primary"
                leftIcon={<Plus />}
                onClick={() => setShowCreateModal(true)}
              >
                Crear Invitación
              </Button>
            }
          />
        )}
      </div>

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <CreateInvitationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInvitation}
        />
      )}
    </div>
  );
};

// Registration Status Badge Component
const RegistrationStatusBadge = ({ user }: { user: any }) => {
  const isRegistered = user.last_login !== null && user.last_login !== undefined;

  if (isRegistered) {
    return <Badge variant="success">Registrado</Badge>;
  }

  return <Badge variant="warning">Pendiente</Badge>;
};

// Create Invitation Modal Component
interface CreateInvitationModalProps {
  onClose: () => void;
  onSubmit: (invitation: CreateUserInvitationDTO) => Promise<void>;
}

const CreateInvitationModal = ({ onClose, onSubmit }: CreateInvitationModalProps) => {
  const [formData, setFormData] = useState<CreateUserInvitationDTO>({
    email: '',
    full_name: '',
    role: 'qa',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Crear Invitación</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            <span className="font-medium">Nota:</span> El usuario recibirá una invitación y
            deberá completar su registro creando una contraseña cuando ingrese al sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
            />
          </FormGroup>

          <FormGroup label="Nombre Completo" htmlFor="fullName" required>
            <Input
              id="fullName"
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </FormGroup>

          <FormGroup label="Rol" htmlFor="role" required>
            <Select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              options={[
                { value: 'qa', label: 'QA - Quality Assurance Engineer' },
                { value: 'dev', label: 'DEV - Developer' },
                { value: 'manager', label: 'MANAGER - Project Manager' },
                { value: 'admin', label: 'ADMIN - Administrator' },
              ]}
            />
          </FormGroup>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              isLoading={submitting}
              leftIcon={<Mail className="w-4 h-4" />}
              className="flex-1"
            >
              Crear Invitación
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
