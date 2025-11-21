import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Image, AlertCircle } from 'lucide-react';
import { apiService } from '@/shared/api/apiClient';
import type { ExecutionDetails, StepExecutionResult } from '@/entities/test-execution';
import { BugReportModal } from '@/features/bug-management/ui';
import { ScenarioList, ScenarioCard, StepExecutionItem } from '@/shared/design-system/components/composite';
import { Button } from '@/shared/ui/Button';
import { colors, borderRadius } from '@/shared/design-system/tokens';
import toast from 'react-hot-toast';

interface Props {
  executionId: number;
  isOpen: boolean;
  onClose: () => void;

  // Context for bug reporting
  projectId?: string;
  testCaseTitle?: string;
  userStoryId?: string;
  onBugReported?: () => void;  // Callback after bug is created
}

interface ScenarioGroup {
  scenarioName: string;
  steps: StepExecutionResult[];
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
}

export const ExecutionDetailsModal: React.FC<Props> = ({
  executionId,
  isOpen,
  onClose,
  projectId,
  testCaseTitle,
  userStoryId,
  onBugReported
}) => {
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [selectedScenarioForBug, setSelectedScenarioForBug] = useState<ScenarioGroup | null>(null);

  useEffect(() => {
    if (isOpen && executionId) {
      loadExecutionDetails();
    }
  }, [executionId, isOpen]);

  const loadExecutionDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getExecutionDetails(executionId);
      setExecution(data);
    } catch (err: any) {
      console.error('Error loading execution details:', err);
      toast.error('Error al cargar detalles de ejecución');
    } finally {
      setLoading(false);
    }
  };

  // Group steps by scenario
  const scenarioGroups = useMemo((): ScenarioGroup[] => {
    if (!execution?.step_results) return [];

    const grouped = execution.step_results.reduce((acc, step) => {
      const scenarioName = step.scenario_name || 'Unnamed Scenario';
      if (!acc[scenarioName]) {
        acc[scenarioName] = [];
      }
      acc[scenarioName].push(step);
      return acc;
    }, {} as Record<string, StepExecutionResult[]>);

    return Object.entries(grouped).map(([scenarioName, steps]) => {
      const passedSteps = steps.filter(s => s.status === 'PASSED').length;
      const failedSteps = steps.filter(s => s.status === 'FAILED').length;
      const skippedSteps = steps.filter(s => s.status === 'SKIPPED').length;

      // Determine scenario status
      let status: 'passed' | 'failed' | 'skipped' | 'pending' = 'pending';
      if (failedSteps > 0) {
        status = 'failed';
      } else if (passedSteps === steps.length) {
        status = 'passed';
      } else if (skippedSteps === steps.length) {
        status = 'skipped';
      }

      return {
        scenarioName,
        steps,
        passedSteps,
        failedSteps,
        skippedSteps,
        status,
      };
    });
  }, [execution]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openEvidence = (filePath: string) => {
    const url = apiService.getEvidenceUrl(filePath);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Cargando detalles...</div>
          </div>
        ) : !execution ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">Error al cargar ejecución</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Ejecución #{execution.execution_id}
                    </h2>
                    <span className={`px-3 py-1 ${borderRadius.full} text-sm font-bold ${
                      execution.status === 'PASSED' ? `${colors.status.success[100]} ${colors.status.success.text700}` :
                      execution.status === 'FAILED' ? `${colors.status.error[100]} ${colors.status.error.text700}` :
                      execution.status === 'SKIPPED' ? `${colors.gray[100]} ${colors.gray.text600}` :
                      execution.status === 'BLOCKED' ? `${colors.status.warning[100]} ${colors.status.warning.text700}` :
                      `${colors.gray[100]} ${colors.gray.text600}`
                    }`}>
                      {execution.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Test Case: <span className="font-mono font-medium">{execution.test_case_id}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <User size={14} />
                    <span>Ejecutado por</span>
                  </div>
                  <p className="font-medium text-gray-900">{execution.executed_by}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar size={14} />
                    <span>Fecha</span>
                  </div>
                  <p className="font-medium text-gray-900">{formatDate(execution.execution_date)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock size={14} />
                    <span>Duración</span>
                  </div>
                  <p className="font-medium text-gray-900">{execution.execution_time_minutes.toFixed(1)} min</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <span>🏷️</span>
                    <span>Ambiente</span>
                  </div>
                  <p className="font-medium text-gray-900 font-mono">{execution.environment}</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Resumen</h3>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500">Total Steps</p>
                  <p className="text-2xl font-bold text-gray-900">{execution.total_steps}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">✓ Passed</p>
                  <p className="text-2xl font-bold text-green-600">{execution.passed_steps}</p>
                </div>
                <div>
                  <p className="text-sm text-red-600">✗ Failed</p>
                  <p className="text-2xl font-bold text-red-600">{execution.failed_steps}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">⊘ Skipped</p>
                  <p className="text-2xl font-bold text-gray-500">
                    {execution.total_steps - execution.passed_steps - execution.failed_steps}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Progreso</p>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{
                        width: `${(execution.passed_steps / execution.total_steps) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((execution.passed_steps / execution.total_steps) * 100).toFixed(0)}% completado
                  </p>
                </div>
              </div>
            </div>

            {/* Steps Grouped by Scenario - Using Composite Components */}
            <div className="flex-1 overflow-y-auto p-6">
              <ScenarioList
                title="Steps Ejecutados"
                showExpandCollapseAll
                defaultAllExpanded={true}
              >
                {scenarioGroups.map((scenario, scenarioIdx) => (
                  <ScenarioCard
                    key={scenarioIdx}
                    scenarioName={scenario.scenarioName}
                    status={scenario.status}
                    passedSteps={scenario.passedSteps}
                    failedSteps={scenario.failedSteps}
                    skippedSteps={scenario.skippedSteps}
                    totalSteps={scenario.steps.length}
                    showBugButton={scenario.failedSteps > 0 && !!projectId}
                    onReportBug={() => setSelectedScenarioForBug(scenario)}
                  >
                    {/* Steps within scenario */}
                    <div className="space-y-3">
                      {scenario.steps.map((step, stepIdx) => {
                        // Map backend status to frontend status
                        const stepStatus = step.status === 'PASSED' ? 'passed' :
                                         step.status === 'FAILED' ? 'failed' :
                                         step.status === 'SKIPPED' ? 'skipped' :
                                         step.status === 'BLOCKED' ? 'blocked' :
                                         'pending';

                        return (
                          <div key={stepIdx}>
                            <StepExecutionItem
                              keyword={step.keyword}
                              text={step.text}
                              status={stepStatus}
                              stepNumber={stepIdx + 1}
                            />

                            {/* Comment */}
                            {step.comment && (
                              <p className={`text-xs ${colors.gray.text600} mt-2 pl-2 border-l-2 ${colors.gray.border300} ml-9`}>
                                💬 {step.comment}
                              </p>
                            )}

                            {/* Evidence */}
                            {step.evidence_file && (
                              <div className={`mt-3 pl-2 border-l-2 ${colors.brand.primary.border} ml-9`}>
                                <p className={`text-xs ${colors.gray.text600} mb-2 flex items-center gap-1`}>
                                  <Image size={12} />
                                  Evidencia adjunta:
                                </p>
                                <div className="relative group">
                                  <img
                                    src={apiService.getEvidenceUrl(step.evidence_file)}
                                    alt="Evidence"
                                    className={`max-w-md border ${borderRadius.base} cursor-pointer hover:shadow-lg transition-shadow`}
                                    onClick={() => openEvidence(step.evidence_file!)}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                    <button
                                      onClick={() => openEvidence(step.evidence_file!)}
                                      className={`opacity-0 group-hover:opacity-100 bg-white px-3 py-1 ${borderRadius.base} shadow-lg text-sm font-medium transition-opacity`}
                                    >
                                      🔍 Ver en tamaño completo
                                    </button>
                                  </div>
                                </div>
                                <p className={`text-xs ${colors.gray.text500} mt-1`}>
                                  {step.evidence_file.split('/').pop()}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScenarioCard>
                ))}
              </ScenarioList>

              {execution.failure_reason && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Razón del Fallo
                  </h4>
                  <p className="text-sm text-red-700">{execution.failure_reason}</p>
                </div>
              )}

              {execution.notes && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Notas</h4>
                  <p className="text-sm text-blue-700">{execution.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-white flex justify-end items-center gap-3">
              {/* Close Button */}
              <Button variant="ghost" size="md" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Evidence Lightbox (if needed) */}
      {selectedEvidence && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedEvidence(null)}
        >
          <img
            src={apiService.getEvidenceUrl(selectedEvidence)}
            alt="Evidence"
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedEvidence(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
        </div>
      )}

      {/* Bug Report Modal (All Scenarios) */}
      {projectId && execution && (
        <BugReportModal
          isOpen={showBugReportModal}
          onClose={() => setShowBugReportModal(false)}
          onSuccess={(bug) => {
            toast.success(`Bug ${bug.id} creado exitosamente`);
            setShowBugReportModal(false);
            if (onBugReported) {
              onBugReported();
            }
          }}
          projectId={projectId}
          executionDetails={execution}
          testCaseId={execution.test_case_id}
          testCaseTitle={testCaseTitle}
          userStoryId={userStoryId}
        />
      )}

      {/* Bug Report Modal (Specific Scenario) */}
      {projectId && execution && selectedScenarioForBug && (
        <BugReportModal
          isOpen={!!selectedScenarioForBug}
          onClose={() => setSelectedScenarioForBug(null)}
          onSuccess={(bug) => {
            toast.success(`Bug ${bug.id} creado exitosamente para el scenario: ${selectedScenarioForBug.scenarioName}`);
            setSelectedScenarioForBug(null);
            if (onBugReported) {
              onBugReported();
            }
          }}
          projectId={projectId}
          testCaseId={execution.test_case_id}
          testCaseTitle={testCaseTitle}
          userStoryId={userStoryId}
          scenarioName={selectedScenarioForBug.scenarioName}
          executionDetails={{
            ...execution,
            total_steps: selectedScenarioForBug.steps.length,
            passed_steps: selectedScenarioForBug.passedSteps,
            failed_steps: selectedScenarioForBug.failedSteps,
            step_results: selectedScenarioForBug.steps,
          }}
        />
      )}
    </div>
  );
};
