/**
 * Users Management Page (ADMIN Only)
 * CRUD operations for user management
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { usersApi } from '@/entities/user';
import type { User, CreateUserDTO, Role } from '@/entities/user';
import { Users, Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const UsersManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { token, user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await usersApi.getAll(token);
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: CreateUserDTO) => {
    if (!token) return;
    try {
      await usersApi.create(userData, token);
      toast.success('Usuario creado exitosamente');
      setShowCreateModal(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    if (userId === currentUser?.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await usersApi.delete(userId, token);
      toast.success('Usuario eliminado exitosamente');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando usuarios...</div>;
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
          <p className="text-gray-600 mt-1">Administrar cuentas de usuario del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
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
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_active ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      Inactivo
                    </span>
                  )}
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
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}
    </div>
  );
};

// Role Badge Component
const RoleBadge = ({ role }: { role: Role }) => {
  const colors = {
    admin: 'bg-red-100 text-red-800',
    qa: 'bg-green-100 text-green-800',
    dev: 'bg-blue-100 text-blue-800',
    manager: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role]}`}>
      {role.toUpperCase()}
    </span>
  );
};

// Create User Modal Component
interface CreateUserModalProps {
  onClose: () => void;
  onSubmit: (user: CreateUserDTO) => Promise<void>;
}

const CreateUserModal = ({ onClose, onSubmit }: CreateUserModalProps) => {
  const [formData, setFormData] = useState<CreateUserDTO>({
    email: '',
    password: '',
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
          <h2 className="text-xl font-bold">Crear Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="qa">QA - Engineer</option>
              <option value="dev">DEV - Developer</option>
              <option value="manager">MANAGER - Project Manager</option>
              <option value="admin">ADMIN - Administrator</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear Usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
