/**
 * Bug Details Page Main Component
 * Displays detailed bug information and management controls
 */

import type { BugStatus } from '@/entities/bug';
import { TestRunnerModal } from '@/features/test-execution/ui';
import { EditBugModal, MarkAsFixedModal, ReopenBugModal } from '@/features/bug-management/ui';
import { BugCommentSection } from '@/features/bug-comments/ui';
import { Button, SkeletonCard } from '@/shared/ui';
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
  Paperclip,
  Wrench,
} from 'lucide-react';
import { useBugDetails } from '../model';
import {
  getStatusBadgeClass,
  getSeverityBadgeClass,
  getPriorityBadgeClass,
} from '@/pages/BugsPage/lib';

// Local formatDate with time
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get status icon (larger size for details page)
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

export const BugDetailsPage = () => {
  const {
    projectId,
    bugId,
    bug,
    testCase,
    loading,
    error,
    updatingStatus,
    isDev,
    showTestRunner,
    setShowTestRunner,
    gherkinContent,
    showEditModal,
    setShowEditModal,
    showMarkAsFixedModal,
    setShowMarkAsFixedModal,
    showReopenModal,
    setShowReopenModal,
    handleStatusChange,
    handleRetest,
    handleTestExecutionComplete,
    handleEditSuccess,
    navigateBack,
    navigateToTests,
    navigateToStories,
    handleConfirmMarkAsFixed,
    handleConfirmReopen,
  } = useBugDetails();

  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingLarge = getTypographyPreset('headingLarge');

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className={`${body.className} ${colors.status.error.text600}`}>
          Error: {error || 'Bug no encontrado'}
        </div>
        <Button variant="primary" size="md" onClick={navigateBack}>
          Volver a Bugs
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex items-start gap-4 min-w-0 flex-1 max-w-full overflow-hidden">
          <button
            onClick={navigateBack}
            className={`p-2 hover:bg-gray-100 ${borderRadius.lg} transition-colors flex-shrink-0`}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0 flex-1 max-w-full overflow-hidden">
            <div className="flex items-center gap-3 mb-2 flex-wrap min-w-0 max-w-full overflow-hidden">
              <div className="flex-shrink-0">{getStatusIcon(bug.status)}</div>
              <h1 className={`${headingLarge.className} font-bold ${colors.gray.text900} break-words min-w-0 flex-1 max-w-full overflow-hidden`}>
                {bug.title}
              </h1>
            </div>
            <p className={`${bodySmall.className} ${colors.gray.text600} font-mono break-all min-w-0 max-w-full overflow-hidden`}>{bug.id}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap flex-shrink-0 w-full md:w-auto min-w-0 max-w-full">
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
      <div className="card w-full max-w-full min-w-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-full min-w-0">
          {/* Status */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={bug.status}
              onChange={(e) => handleStatusChange(e.target.value as BugStatus)}
              disabled={updatingStatus}
              className={`w-full max-w-full px-3 py-2 rounded-lg text-sm font-medium ${getStatusBadgeClass(bug.status)} ${
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
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Severidad</label>
            <div
              className={`px-4 py-2 rounded-lg text-sm font-bold text-center max-w-full ${getSeverityBadgeClass(bug.severity)}`}
            >
              {bug.severity}
            </div>
          </div>

          {/* Priority */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium text-center max-w-full ${getPriorityBadgeClass(bug.priority)}`}
            >
              {bug.priority}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card w-full max-w-full min-w-0 overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} />
          Descripción
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap break-words max-w-full min-w-0">{bug.description}</p>
      </div>

      {/* Steps to Reproduce */}
      <div className="card w-full max-w-full min-w-0 overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pasos para Reproducir</h2>
        <ol className="space-y-2 min-w-0">
          {bug.steps_to_reproduce.map((step, index) => (
            <li key={index} className="flex items-start gap-3 min-w-0 max-w-full overflow-hidden">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-gray-700 flex-1 break-words min-w-0 max-w-full">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Expected vs Actual Behavior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-full min-w-0">
        {/* Expected Behavior */}
        <div className="card w-full min-w-0 max-w-full overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" />
            Comportamiento Esperado
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap break-words max-w-full min-w-0">{bug.expected_behavior}</p>
        </div>

        {/* Actual Behavior */}
        <div className="card w-full min-w-0 max-w-full overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle size={18} className="text-red-600" />
            Comportamiento Real
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap break-words max-w-full min-w-0">{bug.actual_behavior}</p>
        </div>
      </div>

      {/* Environment & Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-full min-w-0">
        {/* Environment Info */}
        <div className="card w-full min-w-0 max-w-full overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Entorno</h2>
          <div className="space-y-3 min-w-0">
            <div className="min-w-0">
              <label className="text-sm font-medium text-gray-600">Environment</label>
              <p className="text-gray-900 font-mono break-words max-w-full min-w-0">{bug.environment}</p>
            </div>
            {bug.browser && (
              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-600">Browser</label>
                <p className="text-gray-900 break-words max-w-full min-w-0">{bug.browser}</p>
              </div>
            )}
            {bug.os && (
              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-600">OS</label>
                <p className="text-gray-900 break-words max-w-full min-w-0">{bug.os}</p>
              </div>
            )}
            {bug.version && (
              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-600">Version</label>
                <p className="text-gray-900 font-mono break-words max-w-full min-w-0">{bug.version}</p>
              </div>
            )}
            <div className="min-w-0">
              <label className="text-sm font-medium text-gray-600">Bug Type</label>
              <p className="text-gray-900 break-words max-w-full min-w-0">{bug.bug_type}</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="card w-full min-w-0 max-w-full overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LinkIcon size={18} />
            Enlaces
          </h2>
          <div className="space-y-3 min-w-0">
            {bug.test_case_id && (
              <div className="min-w-0 overflow-hidden">
                <label className="text-sm font-medium text-gray-600">Test Case</label>
                <button
                  onClick={navigateToTests}
                  className="block text-blue-600 hover:text-blue-800 font-mono text-sm underline break-all max-w-full min-w-0"
                >
                  {bug.test_case_id}
                </button>
                {testCase && <p className="text-xs text-gray-500 mt-1 break-words max-w-full min-w-0">{testCase.title}</p>}
              </div>
            )}
            {bug.user_story_id && (
              <div className="min-w-0 overflow-hidden">
                <label className="text-sm font-medium text-gray-600">User Story</label>
                <button
                  onClick={navigateToStories}
                  className="block text-blue-600 hover:text-blue-800 font-mono text-sm underline break-all max-w-full min-w-0"
                >
                  {bug.user_story_id}
                </button>
              </div>
            )}
            {bug.execution_id && (
              <div className="min-w-0 overflow-hidden">
                <label className="text-sm font-medium text-gray-600">Ejecución Origen</label>
                <p className="text-gray-900 font-mono break-all max-w-full min-w-0">#{bug.execution_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* People & Dates */}
      <div className="card w-full max-w-full min-w-0 overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={18} />
          Personas y Fechas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">
          {/* Reported */}
          <div className="min-w-0">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={14} />
              Reportado
            </label>
            <p className="text-gray-900 font-medium mt-1 break-words">{bug.reported_by}</p>
            <p className="text-xs text-gray-500 break-words">{formatDate(bug.reported_date)}</p>
          </div>

          {/* Assigned */}
          {bug.assigned_to && (
            <div className="min-w-0">
              <label className="text-sm font-medium text-gray-600">Asignado</label>
              <p className="text-gray-900 font-medium mt-1 break-words">{bug.assigned_to}</p>
              {bug.assigned_date && (
                <p className="text-xs text-gray-500 break-words">{formatDate(bug.assigned_date)}</p>
              )}
            </div>
          )}

          {/* Fixed */}
          {bug.fixed_date && (
            <div className="min-w-0">
              <label className="text-sm font-medium text-gray-600">Corregido</label>
              <p className="text-xs text-gray-500 mt-1 break-words">{formatDate(bug.fixed_date)}</p>
            </div>
          )}

          {/* Verified */}
          {bug.verified_by && (
            <div className="min-w-0">
              <label className="text-sm font-medium text-gray-600">Verificado</label>
              <p className="text-gray-900 font-medium mt-1 break-words">{bug.verified_by}</p>
              {bug.verified_date && (
                <p className="text-xs text-gray-500 break-words">{formatDate(bug.verified_date)}</p>
              )}
            </div>
          )}

          {/* Closed */}
          {bug.closed_date && (
            <div className="min-w-0">
              <label className="text-sm font-medium text-gray-600">Cerrado</label>
              <p className="text-xs text-gray-500 mt-1 break-words">{formatDate(bug.closed_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fix Documentation (DEV wrote this) */}
      {bug.fix_description && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 w-full max-w-full overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench size={18} className="text-green-600" />
            Fix del Desarrollador
          </h2>

          {/* Fix Description */}
          <div className="mb-4 min-w-0 max-w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fix Description
            </label>
            <div className="bg-white rounded-lg p-4 border border-green-200 overflow-hidden">
              <p className="text-gray-800 whitespace-pre-wrap break-words max-w-full">{bug.fix_description}</p>
            </div>
          </div>

          {/* Root Cause */}
          {bug.root_cause && (
            <div className="mb-4 min-w-0 max-w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Root Cause
              </label>
              <div className="bg-white rounded-lg p-4 border border-green-200 overflow-hidden">
                <p className="text-gray-800 whitespace-pre-wrap break-words max-w-full">{bug.root_cause}</p>
              </div>
            </div>
          )}

          {/* Workaround */}
          {bug.workaround && (
            <div className="mb-4 min-w-0 max-w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workaround (Temporary Solution)
              </label>
              <div className="bg-white rounded-lg p-4 border border-green-200 overflow-hidden">
                <p className="text-gray-800 whitespace-pre-wrap break-words max-w-full">{bug.workaround}</p>
              </div>
            </div>
          )}

          {/* Fixed Date */}
          {bug.fixed_date && (
            <div className="text-sm text-gray-600">
              <Calendar size={14} className="inline mr-1" />
              Fixed on: {formatDate(bug.fixed_date)}
            </div>
          )}
        </div>
      )}

      {/* Reopen Notes (QA feedback) */}
      {bug.notes && bug.status === 'Reopened' && (
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-l-4 border-orange-500 w-full max-w-full overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-orange-600" />
            QA Feedback - Por qué se reabrió
          </h2>

          <div className="bg-white rounded-lg p-4 border border-orange-200 overflow-hidden">
            <p className="text-gray-800 whitespace-pre-wrap break-words max-w-full">{bug.notes}</p>
          </div>
        </div>
      )}


      {/* Evidence & Attachments */}
      {bug.attachments && bug.attachments.length > 0 && (
        <div className="card w-full max-w-full min-w-0 overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 break-words max-w-full">
            <ImageIcon size={18} className="flex-shrink-0" />
            Evidencia Original ({bug.attachments.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full min-w-0">
            {bug.attachments.map((attachment, index) => {
              // Check if it's an image file
              const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(attachment);

              if (isImage) {
                return (
                  <div key={index} className="group relative min-w-0 max-w-full">
                    <div
                      className={`${borderRadius.lg} overflow-hidden border ${colors.gray.border200} hover:border-blue-400 transition-all hover:shadow-lg`}
                    >
                      <img
                        src={`/api/v1/evidence/${attachment}`}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          console.error(`Failed to load image: /api/v1/evidence/${attachment}`);
                          e.currentTarget.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
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
                    <p className={`${bodySmall.className} ${colors.gray.text600} mt-1 truncate max-w-full`}>
                      {attachment.split('/').pop()}
                    </p>
                  </div>
                );
              } else {
                // Non-image attachment (file)
                return (
                  <div
                    key={index}
                    className={`p-4 border ${colors.gray.border200} ${borderRadius.lg} hover:border-blue-400 hover:bg-gray-50 transition-all min-w-0 max-w-full`}
                  >
                    <a
                      href={`/api/v1/evidence/${attachment}`}
                      download
                      className="flex items-center gap-3 group min-w-0 max-w-full"
                    >
                      <Paperclip size={20} className={`${colors.gray.text500} flex-shrink-0`} />
                      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                        <p
                          className={`${bodySmall.className} ${colors.gray.text900} font-medium truncate group-hover:text-blue-600 max-w-full`}
                        >
                          {attachment.split('/').pop()}
                        </p>
                        <p className={`text-xs ${colors.gray.text500}`}>Click para descargar</p>
                      </div>
                    </a>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Bug Comments Section */}
      {bugId && projectId && (
        <BugCommentSection bugId={bugId} projectId={projectId} />
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
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Mark as Fixed Modal (DEV) */}
      {bugId && (
        <MarkAsFixedModal
          isOpen={showMarkAsFixedModal}
          onClose={() => setShowMarkAsFixedModal(false)}
          onConfirm={handleConfirmMarkAsFixed}
          bugId={bugId}
        />
      )}

      {/* Reopen Bug Modal (QA) */}
      {bugId && (
        <ReopenBugModal
          isOpen={showReopenModal}
          onClose={() => setShowReopenModal(false)}
          onConfirm={handleConfirmReopen}
          bugId={bugId}
        />
      )}
    </div>
  );
};
