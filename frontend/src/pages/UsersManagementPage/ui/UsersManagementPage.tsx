/**
 * Users Management Page Main Component
 * ADMIN-only page for managing user invitations and accounts
 */

import { Users, Plus, Trash2 } from 'lucide-react';
import { SkeletonTable, EmptyState, RoleBadge, Badge, Button } from '@/shared/ui';
import { useUsersManagement } from '../model';
import { RegistrationStatusBadge } from './RegistrationStatusBadge';
import { CreateInvitationModal } from './CreateInvitationModal';

export const UsersManagementPage = () => {
  const {
    users,
    loading,
    showCreateModal,
    setShowCreateModal,
    currentUser,
    handleCreateInvitation,
    handleDeleteUser,
  } = useUsersManagement();

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={6} columns={5} />
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.full_name}
                </td>
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
