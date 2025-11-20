/**
 * BugsPage - Bug Management and Tracking
 *
 * Features:
 * - List all bugs for current project
 * - Filter by severity, priority, status, bug type
 * - Search by title/description
 * - Click bug to view details
 * - Shows test case and user story links
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bugApi } from '@/entities/bug';
import { useProject } from '@/app/providers/ProjectContext';
import type { Bug, BugSeverity, BugPriority, BugStatus } from '@/entities/bug';
import {
  Bug as BugIcon,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Calendar
} from 'lucide-react';

export const BugsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const navigate = useNavigate();

  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load bugs
  useEffect(() => {
    loadBugs();
  }, [projectId]);

  const loadBugs = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bugApi.getAll({ project_id: projectId });
      setBugs(data);
    } catch (err: any) {
      console.error('Error loading bugs:', err);
      setError(err.message || 'Error al cargar bugs');
      toast.error('Error al cargar bugs');
    } finally {
      setLoading(false);
    }
  };

  // Filter bugs
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        bug.title.toLowerCase().includes(searchLower) ||
        bug.description.toLowerCase().includes(searchLower) ||
        bug.id.toLowerCase().includes(searchLower);

      // Severity filter
      const matchesSeverity = selectedSeverity === 'ALL' || bug.severity === selectedSeverity;

      // Priority filter
      const matchesPriority = selectedPriority === 'ALL' || bug.priority === selectedPriority;

      // Status filter
      const matchesStatus = selectedStatus === 'ALL' || bug.status === selectedStatus;

      // Type filter
      const matchesType = selectedType === 'ALL' || bug.bug_type === selectedType;

      return matchesSearch && matchesSeverity && matchesPriority && matchesStatus && matchesType;
    });
  }, [bugs, searchQuery, selectedSeverity, selectedPriority, selectedStatus, selectedType]);

  // Get status badge class
  const getStatusBadgeClass = (status: BugStatus): string => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'FIXED':
        return 'bg-green-100 text-green-800';
      case 'TESTING':
        return 'bg-indigo-100 text-indigo-800';
      case 'VERIFIED':
        return 'bg-teal-100 text-teal-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'REOPENED':
        return 'bg-red-100 text-red-800';
      case 'WONT_FIX':
        return 'bg-gray-100 text-gray-600';
      case 'DUPLICATE':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity badge class
  const getSeverityBadgeClass = (severity: BugSeverity): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority: BugPriority): string => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: BugStatus) => {
    switch (status) {
      case 'VERIFIED':
      case 'CLOSED':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'FIXED':
        return <CheckCircle2 size={16} className="text-teal-600" />;
      case 'IN_PROGRESS':
      case 'TESTING':
        return <Clock size={16} className="text-yellow-600" />;
      case 'REOPENED':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'WONT_FIX':
      case 'DUPLICATE':
        return <XCircle size={16} className="text-gray-500" />;
      default:
        return <BugIcon size={16} className="text-blue-600" />;
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle bug click
  const handleBugClick = (bugId: string) => {
    // Navigate to bug details page
    navigate(`/projects/${projectId}/bugs/${bugId}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('ALL');
    setSelectedPriority('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedSeverity !== 'ALL') count++;
    if (selectedPriority !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    return count;
  }, [searchQuery, selectedSeverity, selectedPriority, selectedStatus, selectedType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando bugs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BugIcon size={32} className="text-red-600" />
            Bug Reports
          </h1>
          <p className="text-gray-600 mt-1">
            {currentProject?.name || 'Current Project'} - {filteredBugs.length} bugs
          </p>
        </div>

        <div className="text-sm text-gray-600">
          <p>💡 <span className="font-medium">Tip:</span> Reporta bugs desde las ejecuciones de test</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filtros</h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por título, descripción o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todas</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todas</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FIXED">Fixed</option>
              <option value="TESTING">Testing</option>
              <option value="VERIFIED">Verified</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
              <option value="WONT_FIX">Won't Fix</option>
              <option value="DUPLICATE">Duplicate</option>
            </select>
          </div>

          {/* Bug Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="FUNCTIONAL">Functional</option>
              <option value="UI">UI</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="SECURITY">Security</option>
              <option value="COMPATIBILITY">Compatibility</option>
              <option value="DATA">Data</option>
              <option value="API">API</option>
              <option value="CRASH">Crash</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bugs Table */}
      {filteredBugs.length === 0 ? (
        <div className="card text-center py-12">
          <BugIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron bugs</h3>
          <p className="text-gray-600">
            {activeFiltersCount > 0
              ? 'Intenta ajustar los filtros para ver más resultados'
              : 'Los bugs reportados desde ejecuciones aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID / Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reportado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignado a
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBugs.map((bug) => (
                  <tr
                    key={bug.id}
                    onClick={() => handleBugClick(bug.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* ID / Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(bug.status)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono font-medium text-blue-600">
                            {bug.id}
                          </p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">
                            {bug.title}
                          </p>
                          {bug.user_story_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              Story: {bug.user_story_id}
                            </p>
                          )}
                          {bug.test_case_id && (
                            <p className="text-xs text-gray-500">
                              Test: {bug.test_case_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityBadgeClass(bug.severity)}`}>
                        {bug.severity}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(bug.priority)}`}>
                        {bug.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(bug.status)}`}>
                        {bug.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {bug.bug_type}
                      </span>
                    </td>

                    {/* Reported Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        {formatDate(bug.reported_date)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <User size={12} />
                        {bug.reported_by}
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="px-6 py-4">
                      {bug.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User size={14} className="text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-900">{bug.assigned_to}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Total Bugs</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{bugs.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Abiertos</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {bugs.filter((b) => ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(b.status)).length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">En Testing</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {bugs.filter((b) => ['FIXED', 'TESTING'].includes(b.status)).length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Cerrados</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {bugs.filter((b) => ['VERIFIED', 'CLOSED'].includes(b.status)).length}
          </p>
        </div>
      </div>
    </div>
  );
};
