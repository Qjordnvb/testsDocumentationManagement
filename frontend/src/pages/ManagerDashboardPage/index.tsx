/**
 * Manager Dashboard Page
 * Only accessible to MANAGER role
 * Shows metrics, reports, and project overview
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { projectApi } from '@/entities/project';
import type { Project } from '@/entities/project';
import {
  BarChart3,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ManagerDashboardPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalStories: 0,
    totalTests: 0,
    totalBugs: 0,
    avgCoverage: 0,
  });

  // Redirect if not manager
  useEffect(() => {
    if (!hasRole('manager')) {
      navigate('/');
      toast.error('Acceso denegado: Solo managers');
    }
  }, [hasRole, navigate]);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
      setProjects(data);
      calculateGlobalStats(data);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const calculateGlobalStats = (projectsData: Project[]) => {
    const activeProjects = projectsData.filter((p) => p.status === 'active').length;
    const totalStories = projectsData.reduce((sum, p) => sum + p.total_user_stories, 0);
    const totalTests = projectsData.reduce((sum, p) => sum + p.total_test_cases, 0);
    const totalBugs = projectsData.reduce((sum, p) => sum + p.total_bugs, 0);
    const avgCoverage =
      projectsData.length > 0
        ? projectsData.reduce((sum, p) => sum + p.test_coverage, 0) / projectsData.length
        : 0;

    setGlobalStats({
      totalProjects: projectsData.length,
      activeProjects,
      totalStories,
      totalTests,
      totalBugs,
      avgCoverage,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard de métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 size={32} className="text-blue-600" />
          Dashboard de Métricas
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.full_name || 'Manager'} - Vista general de todos los proyectos
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proyectos Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{globalStats.totalProjects}</p>
              <p className="text-xs text-green-600 mt-1">
                {globalStats.activeProjects} activos
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Target size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total User Stories */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">User Stories</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{globalStats.totalStories}</p>
              <p className="text-xs text-gray-500 mt-1">Todos los proyectos</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <FileText size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Test Cases */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Cases</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{globalStats.totalTests}</p>
              <p className="text-xs text-gray-500 mt-1">Coverage: {globalStats.avgCoverage.toFixed(1)}%</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Bugs */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bugs Totales</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{globalStats.totalBugs}</p>
              <p className="text-xs text-gray-500 mt-1">Todos los proyectos</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Performance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Rendimiento por Proyecto
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bugs
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{project.total_user_stories}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{project.total_test_cases}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 mr-2">
                        {project.test_coverage.toFixed(1)}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            project.test_coverage >= 80
                              ? 'bg-green-600'
                              : project.test_coverage >= 50
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(project.test_coverage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{project.total_bugs}</span>
                      {project.total_bugs > 0 && (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-4">
              <FileText size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reportes Disponibles</h3>
              <p className="text-sm text-gray-600">Generar reportes de test plans</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-4">
              <BarChart3 size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Análisis de Métricas</h3>
              <p className="text-sm text-gray-600">Ver tendencias y comparativas</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-4">
              <Clock size={32} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historial de Proyectos</h3>
              <p className="text-sm text-gray-600">Ver proyectos archivados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
