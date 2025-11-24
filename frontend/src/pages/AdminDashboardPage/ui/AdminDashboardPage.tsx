/**
 * Admin Dashboard Main Component
 */

import { Users, UserPlus, CheckCircle2, Clock, Shield, Code, Briefcase } from 'lucide-react';
import { SkeletonCard, RoleBadge, Badge, Button } from '@/shared/ui';
import { useAdminDashboard } from '../model';

export const AdminDashboardPage = () => {
  const { user, users, loading, stats, navigate } = useAdminDashboard();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield size={32} className="text-purple-600" />
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-1">Bienvenido, {user?.full_name || 'Admin'}</p>
        </div>

        <Button
          variant="primary"
          leftIcon={<UserPlus size={20} />}
          onClick={() => navigate('/admin/users')}
        >
          Gestionar Usuarios
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Registered */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registrados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.registered}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Active Rate */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Activación</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.total > 0 ? Math.round((stats.registered / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Shield size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Users by Role */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={24} />
          Usuarios por Rol
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Admin */}
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={20} className="text-purple-600" />
              <span className="font-semibold text-purple-900">Administradores</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.byRole.admin}</p>
          </div>

          {/* QA */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 size={20} className="text-blue-600" />
              <span className="font-semibold text-blue-900">QA Engineers</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.byRole.qa}</p>
          </div>

          {/* Dev */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-3 mb-2">
              <Code size={20} className="text-green-600" />
              <span className="font-semibold text-green-900">Developers</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.byRole.dev}</p>
          </div>

          {/* Manager */}
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase size={20} className="text-orange-600" />
              <span className="font-semibold text-orange-900">Managers</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.byRole.manager}</p>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} />
            Usuarios Recientes
          </h2>
          <button
            onClick={() => navigate('/admin/users')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Ver todos →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.slice(0, 5).map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                        <div className="text-sm text-gray-500">{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={u.role as 'admin' | 'qa' | 'dev' | 'manager'} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={u.last_login ? 'success' : 'warning'}>
                      {u.last_login ? 'Registrado' : 'Pendiente'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
