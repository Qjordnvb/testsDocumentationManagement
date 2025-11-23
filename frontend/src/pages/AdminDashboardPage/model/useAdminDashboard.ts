/**
 * Admin Dashboard Business Logic
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/providers';
import { usersApi } from '@/entities/user';
import type { User } from '@/entities/user';

export const useAdminDashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    pending: 0,
    byRole: {
      admin: 0,
      qa: 0,
      dev: 0,
      manager: 0,
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/');
      toast.error('Acceso denegado: Solo administradores');
    }
  }, [hasRole, navigate]);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData: User[]) => {
    const registered = usersData.filter((u) => u.last_login !== null).length;
    const pending = usersData.length - registered;

    const byRole = {
      admin: usersData.filter((u) => u.role === 'admin').length,
      qa: usersData.filter((u) => u.role === 'qa').length,
      dev: usersData.filter((u) => u.role === 'dev').length,
      manager: usersData.filter((u) => u.role === 'manager').length,
    };

    setStats({
      total: usersData.length,
      registered,
      pending,
      byRole,
    });
  };

  return {
    user,
    users,
    loading,
    stats,
    navigate,
  };
};
