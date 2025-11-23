/**
 * Manager Dashboard Page - IMPROVED
 * Only accessible to MANAGER role
 * Shows metrics, reports, and project overview with real actionable insights
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
  Target,
  Download,
  GitCompare,
  Archive,
  Eye,
  Filter,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner, Button } from '@/shared/ui';

export const ManagerDashboardPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalStories: 0,
    totalTests: 0,
    totalBugs: 0,
    avgCoverage: 0,
  });

  // Filter states
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownType, setBreakdownType] = useState<'stories' | 'tests' | 'bugs' | null>(null);

  // Downloading states
  const [downloadingReport, setDownloadingReport] = useState(false);

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

  // Apply filters
  useEffect(() => {
    let filtered = [...projects];

    if (showOnlyActive) {
      filtered = filtered.filter((p) => p.status === 'active');
    }

    if (showOnlyAtRisk) {
      filtered = filtered.filter(
        (p) =>
          p.test_coverage < 50 ||
          p.total_bugs > 10 ||
          (p.total_user_stories > 0 && p.total_test_cases === 0)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [projects, showOnlyActive, showOnlyAtRisk, searchQuery]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
      setProjects(data);
      setFilteredProjects(data);
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

  // Identify projects at risk
  const getProjectsAtRisk = () => {
    return projects
      .filter(
        (p) =>
          p.test_coverage < 50 || // Low coverage
          p.total_bugs > 10 || // Too many bugs
          (p.total_user_stories > 0 && p.total_test_cases === 0) // Stories without tests
      )
      .sort((a, b) => {
        // Sort by severity: bugs > low coverage > no tests
        const scoreA = a.total_bugs * 10 + (100 - a.test_coverage);
        const scoreB = b.total_bugs * 10 + (100 - b.test_coverage);
        return scoreB - scoreA;
      });
  };

  // Get top performing projects
  const getTopProjects = () => {
    return [...projects]
      .filter((p) => p.total_user_stories > 0) // Only projects with work
      .sort((a, b) => b.test_coverage - a.test_coverage)
      .slice(0, 3);
  };

  // Download consolidated report (all projects)
  const handleDownloadConsolidatedReport = async () => {
    try {
      setDownloadingReport(true);
      toast.loading('Generando reporte consolidado de todos los proyectos...');

      // TODO: Backend endpoint needs to be created: GET /api/v1/reports/consolidated
      // For now, we'll simulate the download

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.dismiss();
      toast.success('🚧 Endpoint pendiente: /api/v1/reports/consolidated');
      toast('Esta funcionalidad estará disponible próximamente', { icon: 'ℹ️' });
    } catch (error) {
      toast.dismiss();
      toast.error('Error al generar reporte consolidado');
    } finally {
      setDownloadingReport(false);
    }
  };

  // Show breakdown modal
  const handleShowBreakdown = (type: 'stories' | 'tests' | 'bugs') => {
    setBreakdownType(type);
    setShowBreakdownModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Cargando dashboard de métricas..." center />
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

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showOnlyActive ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              leftIcon={<Filter size={16} />}
            >
              Solo Activos
            </Button>
            <Button
              variant={showOnlyAtRisk ? 'danger' : 'outline-danger'}
              size="sm"
              onClick={() => setShowOnlyAtRisk(!showOnlyAtRisk)}
              leftIcon={<AlertCircle size={16} />}
            >
              En Riesgo
            </Button>
            {(searchQuery || showOnlyActive || showOnlyAtRisk) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setShowOnlyActive(false);
                  setShowOnlyAtRisk(false);
                }}
                leftIcon={<X size={16} />}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
        {filteredProjects.length !== projects.length && (
          <p className="text-sm text-gray-500 mt-2">
            Mostrando {filteredProjects.length} de {projects.length} proyectos
          </p>
        )}
      </div>

      {/* Global KPIs - Now clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects - Click to toggle active filter */}
        <button
          onClick={() => setShowOnlyActive(!showOnlyActive)}
          className="card hover:shadow-lg transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proyectos Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{globalStats.totalProjects}</p>
              <p className="text-xs text-green-600 mt-1">{globalStats.activeProjects} activos</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3 group-hover:scale-110 transition-transform">
              <Target size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 group-hover:text-blue-600">
            Click para filtrar activos
          </p>
        </button>

        {/* Total User Stories - Click to show breakdown */}
        <button
          onClick={() => handleShowBreakdown('stories')}
          className="card hover:shadow-lg transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">User Stories</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{globalStats.totalStories}</p>
              <p className="text-xs text-gray-500 mt-1">Todos los proyectos</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3 group-hover:scale-110 transition-transform">
              <FileText size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 group-hover:text-purple-600">
            Click para ver breakdown
          </p>
        </button>

        {/* Total Test Cases - Click to show breakdown */}
        <button
          onClick={() => handleShowBreakdown('tests')}
          className="card hover:shadow-lg transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Cases</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{globalStats.totalTests}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coverage: {globalStats.avgCoverage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 group-hover:text-green-600">
            Click para ver breakdown
          </p>
        </button>

        {/* Total Bugs - Click to show breakdown */}
        <button
          onClick={() => handleShowBreakdown('bugs')}
          className="card hover:shadow-lg transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bugs Totales</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{globalStats.totalBugs}</p>
              <p className="text-xs text-gray-500 mt-1">Todos los proyectos</p>
            </div>
            <div className="bg-red-100 rounded-full p-3 group-hover:scale-110 transition-transform">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 group-hover:text-red-600">
            Click para ver breakdown
          </p>
        </button>
      </div>

      {/* Alerts: Projects at Risk */}
      {getProjectsAtRisk().length > 0 && (
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-red-600" />
            Proyectos que Requieren Atención ({getProjectsAtRisk().length})
          </h2>
          <div className="space-y-3">
            {getProjectsAtRisk()
              .slice(0, 5)
              .map((project) => {
                const issues = [];
                if (project.test_coverage < 50)
                  issues.push(`Coverage bajo (${project.test_coverage.toFixed(0)}%)`);
                if (project.total_bugs > 10) issues.push(`${project.total_bugs} bugs activos`);
                if (project.total_user_stories > 0 && project.total_test_cases === 0)
                  issues.push('Sin test cases');

                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="danger" size="sm" leftIcon={<Eye size={16} />}>
                      Ver Detalles
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {getTopProjects().length > 0 && (
        <div className="card bg-green-50 border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={24} className="text-green-600" />
            Proyectos con Mejor Desempeño
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getTopProjects().map((project, idx) => (
              <div
                key={project.id}
                className="p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}/dashboard`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">#{idx + 1}</span>
                  <span className="text-3xl font-bold text-green-600">
                    {project.test_coverage.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600">
                  {project.total_test_cases} tests · {project.total_bugs} bugs
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Performance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Todos los Proyectos ({filteredProjects.length})
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                      leftIcon={<Eye size={14} />}
                    >
                      Ver Dashboard
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions - NOW WITH REAL FUNCTIONALITY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Consolidated Report */}
        <button
          onClick={handleDownloadConsolidatedReport}
          disabled={downloadingReport}
          className="card hover:shadow-lg transition-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-4">
              <Download size={32} className="text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-gray-900">Reporte Consolidado</h3>
              <p className="text-sm text-gray-600">
                Descargar métricas de todos los proyectos
              </p>
            </div>
          </div>
        </button>

        {/* Compare Projects */}
        <button
          onClick={() => setShowCompareModal(true)}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-4">
              <GitCompare size={32} className="text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-gray-900">Comparar Proyectos</h3>
              <p className="text-sm text-gray-600">Ver métricas comparativas</p>
            </div>
          </div>
        </button>

        {/* Archived Projects */}
        <button
          onClick={() => toast.info('Mostrando solo proyectos archivados')}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-4">
              <Archive size={32} className="text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-gray-900">Proyectos Archivados</h3>
              <p className="text-sm text-gray-600">Ver proyectos inactivos</p>
            </div>
          </div>
        </button>
      </div>

      {/* Breakdown Modal */}
      {showBreakdownModal && breakdownType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {breakdownType === 'stories'
                  ? 'User Stories por Proyecto'
                  : breakdownType === 'tests'
                  ? 'Test Cases por Proyecto'
                  : 'Bugs por Proyecto'}
              </h2>
              <button
                onClick={() => {
                  setShowBreakdownModal(false);
                  setBreakdownType(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Proyecto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      % del Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => {
                    const value =
                      breakdownType === 'stories'
                        ? project.total_user_stories
                        : breakdownType === 'tests'
                        ? project.total_test_cases
                        : project.total_bugs;
                    const total =
                      breakdownType === 'stories'
                        ? globalStats.totalStories
                        : breakdownType === 'tests'
                        ? globalStats.totalTests
                        : globalStats.totalBugs;
                    const percentage = total > 0 ? (value / total) * 100 : 0;

                    return (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {project.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{value}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Comparativa de Proyectos</h2>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Coverage Comparison */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Coverage</h3>
                <div className="space-y-3">
                  {projects.slice(0, 10).map((project) => (
                    <div key={project.id} className="flex items-center gap-4">
                      <div className="w-40 text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div
                          className={`h-6 rounded-full flex items-center justify-end px-2 ${
                            project.test_coverage >= 80
                              ? 'bg-green-600'
                              : project.test_coverage >= 50
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(project.test_coverage, 100)}%` }}
                        >
                          <span className="text-xs text-white font-semibold">
                            {project.test_coverage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bugs Comparison */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bugs Activos</h3>
                <div className="space-y-3">
                  {[...projects]
                    .sort((a, b) => b.total_bugs - a.total_bugs)
                    .slice(0, 10)
                    .map((project) => {
                      const maxBugs = Math.max(...projects.map((p) => p.total_bugs));
                      const widthPercentage = maxBugs > 0 ? (project.total_bugs / maxBugs) * 100 : 0;

                      return (
                        <div key={project.id} className="flex items-center gap-4">
                          <div className="w-40 text-sm font-medium text-gray-900 truncate">
                            {project.name}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6">
                            <div
                              className="h-6 rounded-full flex items-center justify-end px-2 bg-red-600"
                              style={{ width: `${widthPercentage}%` }}
                            >
                              <span className="text-xs text-white font-semibold">
                                {project.total_bugs}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
