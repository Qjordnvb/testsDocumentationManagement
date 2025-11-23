/**
 * Users Management Page Business Logic
 * Manages user list, invitations, and deletions
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/providers';
import { usersApi } from '@/entities/user';
import type { User, CreateUserInvitationDTO } from '@/entities/user';

export const useUsersManagement = () => {
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
      const data = await usersApi.getAll(); // Token auto-injected by apiClient
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (invitation: CreateUserInvitationDTO) => {
    try {
      await usersApi.createInvitation(invitation); // Token auto-injected by apiClient
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
      await usersApi.delete(userId); // Token auto-injected by apiClient
      toast.success('Usuario eliminado exitosamente');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  return {
    users,
    loading,
    showCreateModal,
    setShowCreateModal,
    currentUser,
    handleCreateInvitation,
    handleDeleteUser,
  };
};
