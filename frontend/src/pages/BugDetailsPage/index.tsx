/**
 * BugDetailsPage - Detailed Bug View and Management
 *
 * Features:
 * - Display full bug details
 * - Update bug status dropdown
 * - Re-test button (opens TestRunnerModal for linked test case)
 * - Show steps to reproduce, expected vs actual behavior
 * - Display linked test case and user story
 * - Show all dates and assignments
 * - Edit bug details (basic)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bugApi } from '@/entities/bug';
import { testCaseApi } from '@/entities/test-case';
import { apiService } from '@/shared/api/apiClient';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import type { Bug, BugStatus } from '@/entities/bug';
import type { TestCase } from '@/entities/test-case';
import { TestRunnerModal } from '@/features/test-execution/ui';
import { EditBugModal } from '@/features/bug-management/ui';
import { Button } from '@/shared/ui/Button';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';
import {
  Bug as BugIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  User,
  FileText,
  PlayCircle,
  ArrowLeft,
  Edit,
  Link as LinkIcon,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';

export const BugDetailsPage = () => {
  const { projectId, bugId } = useParams<{ projectId: string; bugId: string }>();
  const { currentProject } = useProject();
  const { hasRole } = useAuth();
  const isDev = hasRole('dev');
  const navigate = useNavigate();

  const [bug, setBug] = useState<Bug | null>(null);
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Test Runner Modal state
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [gherkinContent, setGherkinContent] = useState<string>('');

  // Edit Bug Modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Typography presets
  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingLarge = getTypographyPreset('headingLarge');

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load bug details
  useEffect(() => {
    loadBugDetails();
  }, [bugId]);

  const loadBugDetails = async () => {
    if (!bugId) return;

    try {
      setLoading(true);
      setError(null);
      const bugData = await bugApi.getById(bugId);
      setBug(bugData);

      // Load test case if linked
      if (bugData.test_case_id) {
        try {
          const testCaseData = await testCaseApi.getById(bugData.test_case_id);
          setTestCase(testCaseData);

          // Load gherkin content
          if (testCaseData.gherkin_file_path) {
            const gherkin = await testCaseApi.getGherkinContent(testCaseData.id);
            setGherkinContent(gherkin);
          }
        } catch (err) {
          console.error('Error loading test case:', err);
          // Don't fail the whole page if test case load fails
        }
      }
    } catch (err: any) {
      console.error('Error loading bug details:', err);
      setError(err.message || 'Error al cargar bug');
      toast.error('Error al cargar detalles del bug');
    } finally {
      setLoading(false);
    }
  };

  // Update bug status
  const handleStatusChange = async (newStatus: BugStatus) => {
    if (!bug || !bugId) return;

    try {
      setUpdatingStatus(true);
      // Use devUpdate endpoint for DEV role (restricted to status, fix_description, screenshots)
      const updated = isDev
        ? await bugApi.devUpdate(bugId, { status: newStatus })
        : await bugApi.updateStatus(bugId, newStatus);
      setBug(updated);
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating bug status:', err);
      toast.error('Error al actualizar estado del bug');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle re-test
  const handleRetest = () => {
    if (!testCase) {
      toast.error('No se puede re-ejecutar: el bug no está vinculado a un test case');
      return;
    }

    if (!gherkinContent) {
      toast.error('No se puede re-ejecutar: el test case no tiene contenido Gherkin');
      return;
    }

    setShowTestRunner(true);
  };

  // Handle test execution completion with auto-status update
  const handleTestExecutionComplete = async () => {
    if (!testCase || !bugId) return;

    try {
      setShowTestRunner(false);

      // Get the latest execution for this test case
      const historyData = await apiService.getTestCaseExecutions(testCase.id);

      if (historyData && historyData.executions && historyData.executions.length > 0) {
        // Get the most recent execution (first in the array)
        const latestExecution = historyData.executions[0];

        // Auto-update bug status based on test result
        let newStatus: BugStatus | null = null;

        if (latestExecution.status === 'PASSED') {
          newStatus = 'Verified';
          toast.success('✅ Test passed! Bug status actualizado a Verified');
        } else if (latestExecution.status === 'FAILED') {
          newStatus = 'Reopened';
          toast.error('❌ Test failed! Bug status actualizado a Reopened');
        } else if (latestExecution.status === 'BLOCKED' || latestExecution.status === 'SKIPPED') {
          toast(`⚠️ Test execution: ${latestExecution.status} - Bug status no cambiado`, {
            icon: '⚠️'
          });
        }

        // Update bug status if applicable
        if (newStatus && bug) {
          try {
            await bugApi.updateStatus(bugId, newStatus);
          } catch (err) {
            console.error('Error updating bug status:', err);
            toast.error('Error al actualizar status del bug automáticamente');
          }
        }
      }

      // Reload bug details to show updated status
      await loadBugDetails();
    } catch (err) {
      console.error('Error handling test execution:', err);
      toast.error('Error al procesar resultado del test');
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: BugStatus): string => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'Assigned':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'Fixed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'Testing':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      case 'Verified':
        return 'bg-teal-100 text-teal-800 border border-teal-300';
      case 'Closed':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'Reopened':
        return 'bg-red-100 text-red-800 border border-red-300';
      case "Won't Fix":
        return 'bg-gray-100 text-gray-600 border border-gray-300';
      case 'Duplicate':
        return 'bg-gray-100 text-gray-600 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity badge class
  const getSeverityBadgeClass = (severity: string): string => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-600 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Medium':
        return 'bg-yellow-500 text-white';
      case 'Low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'Low':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: BugStatus) => {
    switch (status) {
      case 'Verified':
      case 'Closed':
        return <CheckCircle2 size={24} className="text-green-600" />;
      case 'Fixed':
        return <CheckCircle2 size={24} className="text-teal-600" />;
      case 'In Progress':
      case 'Testing':
        return <Clock size={24} className="text-yellow-600" />;
      case 'Reopened':
        return <AlertCircle size={24} className="text-red-600" />;
      case "Won't Fix":
      case 'Duplicate':
        return <XCircle size={24} className="text-gray-500" />;
      default:
        return <BugIcon size={24} className="text-blue-600" />;
    }
  };

  // Format date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`${body.className} ${colors.gray.text600}`}>Cargando detalles del bug...</div>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className={`${body.className} ${colors.status.error.text600}`}>Error: {error || 'Bug no encontrado'}</div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate(`/projects/${projectId}/bugs`)}
        >
          Volver a Bugs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(`/projects/${projectId}/bugs`)}
            className={`p-2 hover:bg-gray-100 ${borderRadius.lg} transition-colors`}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {getStatusIcon(bug.status)}
              <h1 className={`${headingLarge.className} font-bold ${colors.gray.text900} break-words`}>{bug.title}</h1>
            </div>
            <p className={`${bodySmall.className} ${colors.gray.text600} font-mono`}>{bug.id}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Re-ejecutar Test: Only QA can retest */}
          {testCase && !isDev && (
            <Button
              variant="success"
              size="md"
              onClick={handleRetest}
              leftIcon={<PlayCircle size={18} />}
            >
              Re-ejecutar Test
            </Button>
          )}
          {/* Edit button: Hidden for DEV (they use status dropdown + fix section) */}
          {!isDev && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowEditModal(true)}
              leftIcon={<Edit size={18} />}
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Status, Severity, Priority */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={bug.status}
              onChange={(e) => handleStatusChange(e.target.value as BugStatus)}
              disabled={updatingStatus}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium ${getStatusBadgeClass(bug.status)} ${
                updatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {/* DEV role: Only allow In Progress, Fixed, Testing */}
              {isDev ? (
                <>
                  <option value="In Progress">In Progress</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Testing">Testing</option>
                </>
              ) : (
                <>
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Testing">Testing</option>
                  <option value="Verified">Verified</option>
                  <option value="Closed">Closed</option>
                  <option value="Reopened">Reopened</option>
                  <option value="Won't Fix">Won't Fix</option>
                  <option value="Duplicate">Duplicate</option>
                </>
              )}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severidad</label>
            <div className={`px-4 py-2 rounded-lg text-sm font-bold text-center ${getSeverityBadgeClass(bug.severity)}`}>
              {bug.severity}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
            <div className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${getPriorityBadgeClass(bug.priority)}`}>
              {bug.priority}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} />
          Descripción
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap">{bug.description}</p>
      </div>

      {/* Steps to Reproduce */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pasos para Reproducir</h2>
        <ol className="space-y-2">
          {bug.steps_to_reproduce.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-gray-700 flex-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Expected vs Actual Behavior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expected Behavior */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" />
            Comportamiento Esperado
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{bug.expected_behavior}</p>
        </div>

        {/* Actual Behavior */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle size={18} className="text-red-600" />
            Comportamiento Real
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{bug.actual_behavior}</p>
        </div>
      </div>

      {/* Environment & Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Entorno</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Environment</label>
              <p className="text-gray-900 font-mono">{bug.environment}</p>
            </div>
            {bug.browser && (
              <div>
                <label className="text-sm font-medium text-gray-600">Browser</label>
                <p className="text-gray-900">{bug.browser}</p>
              </div>
            )}
            {bug.os && (
              <div>
                <label className="text-sm font-medium text-gray-600">OS</label>
                <p className="text-gray-900">{bug.os}</p>
              </div>
            )}
            {bug.version && (
              <div>
                <label className="text-sm font-medium text-gray-600">Version</label>
                <p className="text-gray-900 font-mono">{bug.version}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600">Bug Type</label>
              <p className="text-gray-900">{bug.bug_type}</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LinkIcon size={18} />
            Enlaces
          </h2>
          <div className="space-y-3">
            {bug.test_case_id && (
              <div>
                <label className="text-sm font-medium text-gray-600">Test Case</label>
                <button
                  onClick={() => navigate(`/projects/${projectId}/tests`)}
                  className="block text-blue-600 hover:text-blue-800 font-mono text-sm underline"
                >
                  {bug.test_case_id}
                </button>
                {testCase && (
                  <p className="text-xs text-gray-500 mt-1">{testCase.title}</p>
                )}
              </div>
            )}
            {bug.user_story_id && (
              <div>
                <label className="text-sm font-medium text-gray-600">User Story</label>
                <button
                  onClick={() => navigate(`/projects/${projectId}/stories`)}
                  className="block text-blue-600 hover:text-blue-800 font-mono text-sm underline"
                >
                  {bug.user_story_id}
                </button>
              </div>
            )}
            {bug.execution_id && (
              <div>
                <label className="text-sm font-medium text-gray-600">Ejecución Origen</label>
                <p className="text-gray-900 font-mono">#{bug.execution_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* People & Dates */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={18} />
          Personas y Fechas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Reported */}
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={14} />
              Reportado
            </label>
            <p className="text-gray-900 font-medium mt-1">{bug.reported_by}</p>
            <p className="text-xs text-gray-500">{formatDate(bug.reported_date)}</p>
          </div>

          {/* Assigned */}
          {bug.assigned_to && (
            <div>
              <label className="text-sm font-medium text-gray-600">Asignado</label>
              <p className="text-gray-900 font-medium mt-1">{bug.assigned_to}</p>
              {bug.assigned_date && (
                <p className="text-xs text-gray-500">{formatDate(bug.assigned_date)}</p>
              )}
            </div>
          )}

          {/* Fixed */}
          {bug.fixed_date && (
            <div>
              <label className="text-sm font-medium text-gray-600">Corregido</label>
              <p className="text-xs text-gray-500 mt-1">{formatDate(bug.fixed_date)}</p>
            </div>
          )}

          {/* Verified */}
          {bug.verified_by && (
            <div>
              <label className="text-sm font-medium text-gray-600">Verificado</label>
              <p className="text-gray-900 font-medium mt-1">{bug.verified_by}</p>
              {bug.verified_date && (
                <p className="text-xs text-gray-500">{formatDate(bug.verified_date)}</p>
              )}
            </div>
          )}

          {/* Closed */}
          {bug.closed_date && (
            <div>
              <label className="text-sm font-medium text-gray-600">Cerrado</label>
              <p className="text-xs text-gray-500 mt-1">{formatDate(bug.closed_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* DEV: Fix Documentation Section */}
      {isDev && (
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Edit size={18} className="text-blue-600" />
            Documentación del Fix (Solo DEV)
          </h2>
          <div className="space-y-4">
            {/* Fix Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Fix
              </label>
              <textarea
                value={bug.fix_description || ''}
                onChange={(e) => {
                  // Update bug state locally
                  setBug(prev => prev ? {...prev, fix_description: e.target.value} : null);
                }}
                onBlur={async (e) => {
                  // Save on blur
                  if (!bugId) return;
                  try {
                    await bugApi.devUpdate(bugId, { fix_description: e.target.value });
                    toast.success('Descripción del fix guardada');
                  } catch (err) {
                    toast.error('Error al guardar descripción');
                  }
                }}
                placeholder="Describe cómo solucionaste el bug, cambios realizados, etc..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Upload Screenshots of Fix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidencia del Fix (Screenshots)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Sube capturas de pantalla que demuestren que el bug fue solucionado
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0 || !bugId) return;

                  try {
                    const formData = new FormData();
                    Array.from(files).forEach(file => formData.append('files', file));

                    toast.loading('Subiendo evidencia...');
                    await bugApi.devUpdate(bugId, { screenshots: formData } as any);
                    toast.dismiss();
                    toast.success('Evidencia subida correctamente');

                    // Reload bug to show new screenshots
                    const updated = await bugApi.getById(bugId);
                    setBug(updated);
                  } catch (err) {
                    toast.dismiss();
                    toast.error('Error al subir evidencia');
                  }
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Evidence & Attachments */}
      {bug.attachments && bug.attachments.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon size={18} />
            Evidencia Original ({bug.attachments.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bug.attachments.map((attachment, index) => {
              // Check if it's an image file
              const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(attachment);

              if (isImage) {
                return (
                  <div key={index} className="group relative">
                    <div className={`${borderRadius.lg} overflow-hidden border ${colors.gray.border200} hover:border-blue-400 transition-all hover:shadow-lg`}>
                      <img
                        src={`/api/v1/evidence/${attachment}`}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          console.error(`Failed to load image: /api/v1/evidence/${attachment}`);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/api/v1/evidence/${attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2 py-1 ${colors.white} ${colors.brand.primary[600]} ${borderRadius.base} text-xs font-medium hover:bg-blue-700 shadow-md`}
                        >
                          Ver completa
                        </a>
                      </div>
                    </div>
                    <p className={`${bodySmall.className} ${colors.gray.text600} mt-1 truncate`}>
                      {attachment.split('/').pop()}
                    </p>
                  </div>
                );
              } else {
                // Non-image attachment (file)
                return (
                  <div key={index} className={`p-4 border ${colors.gray.border200} ${borderRadius.lg} hover:border-blue-400 hover:bg-gray-50 transition-all`}>
                    <a
                      href={`/api/v1/evidence/${attachment}`}
                      download
                      className="flex items-center gap-3 group"
                    >
                      <Paperclip size={20} className={colors.gray.text500} />
                      <div className="flex-1 min-w-0">
                        <p className={`${bodySmall.className} ${colors.gray.text900} font-medium truncate group-hover:text-blue-600`}>
                          {attachment.split('/').pop()}
                        </p>
                        <p className={`text-xs ${colors.gray.text500}`}>
                          Click para descargar
                        </p>
                      </div>
                    </a>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Test Runner Modal */}
      {testCase && projectId && (
        <TestRunnerModal
          isOpen={showTestRunner}
          onClose={() => setShowTestRunner(false)}
          testCaseId={testCase.id}
          testCaseTitle={testCase.title}
          gherkinContent={gherkinContent}
          projectId={projectId}
          userStoryId={bug?.user_story_id}
          onSave={handleTestExecutionComplete}
        />
      )}

      {/* Edit Bug Modal */}
      {bug && (
        <EditBugModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          bug={bug}
          onSuccess={(updatedBug) => {
            setBug(updatedBug);
            setShowEditModal(false);
            toast.success('Bug actualizado exitosamente');
          }}
        />
      )}
    </div>
  );
};
