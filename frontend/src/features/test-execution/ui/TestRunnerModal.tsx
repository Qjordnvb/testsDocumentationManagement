import React, { useEffect, useState } from 'react';
import { X, Play, Pause, CheckCircle2, XCircle, Clock, Save, AlertCircle, Upload, Trash2, FileImage } from 'lucide-react';
import { useTestRunner } from '../model/useTestRunner';
import { parseGherkinContent } from '@/shared/lib/gherkinParser';
import { apiService } from '@/shared/api/apiClient';
import { ConfirmModal } from '@/shared/ui';
import { BugReportModal } from '@/features/bug-management/ui/BugReportModal';
import { ScenarioList, ScenarioCard, StepExecutionItem } from '@/shared/design-system/components/composite';
import { Button } from '@/shared/ui/Button';
import { colors, getStatusClasses, borderRadius } from '@/shared/design-system/tokens';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  testCaseId: string;
  testCaseTitle: string;
  gherkinContent: string;
  projectId: string;
  userStoryId?: string;
  onSave: () => void;
}

export const TestRunnerModal: React.FC<Props> = ({
  isOpen, onClose, testCaseId, testCaseTitle, gherkinContent, projectId, userStoryId, onSave
}) => {
  const [parsedFeature, setParsedFeature] = useState(() => parseGherkinContent(gherkinContent));

  useEffect(() => {
    if (isOpen) {
      setParsedFeature(parseGherkinContent(gherkinContent));
    }
  }, [gherkinContent, isOpen]);

  const {
    scenarios, isRunning, elapsedSeconds, executionStatus, evidenceMap,
    expandedScenarios, startExecution, pauseExecution, toggleScenario, markStep, addEvidence, removeEvidence
  } = useTestRunner(parsedFeature.scenarios);

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showBugPrompt, setShowBugPrompt] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [savedExecutionId, setSavedExecutionId] = useState<number | null>(null);
  const [selectedScenarioForBug, setSelectedScenarioForBug] = useState<{
    index: number;
    name: string;
    steps: any[];
  } | null>(null);

  if (!isOpen) return null;

  // Mark all steps in a scenario
  const handleMarkAllStepsInScenario = (scenarioIdx: number, status: 'passed' | 'failed') => {
    const scenario = scenarios[scenarioIdx];
    scenario.steps.forEach((step: any) => {
      if (step.status !== 'skipped') {
        markStep(scenarioIdx, step.id, status);
      }
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (stepId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addEvidence(stepId, e.target.files[0]);
    }
  };

  const handleSave = () => {
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirm(false);
    setIsSaving(true);

    try {
      // 1. Upload Evidence
      const stepEvidencePaths: Record<number, string> = {};
      const allUploadedPaths: string[] = [];

      for (const [stepId, file] of Object.entries(evidenceMap)) {
        try {
          const response = await apiService.uploadEvidence(file as File, projectId, 'execution');

          if (response.file_path) {
            stepEvidencePaths[Number(stepId)] = response.file_path;
            allUploadedPaths.push(response.file_path);
          }
        } catch (uploadError) {
          console.error(`Error uploading evidence for step ${stepId}:`, uploadError);
        }
      }

      // 2. Build step results (flatten all scenarios but keep scenario name)
      const allStepResults: any[] = [];
      scenarios.forEach((scenario) => {
        console.log('[TestRunnerModal] Processing scenario:', {
          scenarioName: scenario.scenarioName,
          stepsCount: scenario.steps.length
        });

        scenario.steps.forEach((step: any) => {
          allStepResults.push({
            step_index: step.id,
            keyword: step.keyword,
            text: step.text,
            status: step.status === 'pending' ? 'SKIPPED' : step.status.toUpperCase(),
            scenario_name: scenario.scenarioName,  // Keep scenario grouping info
            evidence_file: stepEvidencePaths[step.id] || null
          });
        });
      });

      console.log('[TestRunnerModal] Built step results:', {
        totalSteps: allStepResults.length,
        uniqueScenarios: [...new Set(allStepResults.map(s => s.scenario_name))]
      });

      // 3. Build payload
      const payload = {
        test_case_id: testCaseId,
        executed_by: "QA Tester",
        status: executionStatus === 'IN_PROGRESS' ? 'BLOCKED' : executionStatus,
        environment: "QA",
        execution_time_seconds: elapsedSeconds,
        step_results: allStepResults,
        evidence_files: allUploadedPaths
      };

      // Debug: Log payload before sending
      console.log('[TestRunnerModal] Sending execution payload:', JSON.stringify(payload, null, 2));

      // 4. Send to backend
      const response = await apiService.createTestExecution(payload);

      // Save execution ID for bug reporting
      if (response && response.execution_id) {
        setSavedExecutionId(response.execution_id);
      }

      toast.success("Ejecución guardada exitosamente");
      onSave();

      // Check if there are failed steps - prompt to create bug
      const hasFailures = executionStatus === 'FAILED';
      if (hasFailures) {
        setShowBugPrompt(true);
      } else {
        onClose();
      }

    } catch (error) {
      console.error("Error saving execution:", error);
      toast.error("Error al guardar la ejecución.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalSteps = scenarios.reduce((sum, s) => sum + s.steps.length, 0);
  const passedScenarios = scenarios.filter(s => s.status === 'passed').length;
  const failedScenarios = scenarios.filter(s => s.status === 'failed').length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">{testCaseId}</span>
                <span>•</span>
                <span className="font-semibold text-blue-600">{parsedFeature.featureName}</span>
                <span>•</span>
                <span>{scenarios.length} Scenarios ({totalSteps} steps)</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 leading-tight">{testCaseTitle}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className={`px-6 py-3 border-b ${colors.gray.border100} bg-white flex justify-between items-center shadow-sm`}>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${colors.brand.primary[50]} px-4 py-2 ${borderRadius.lg} border ${colors.brand.primary.border}`}>
              <Clock size={18} className={colors.brand.primary.text600} />
              <span className={`font-mono text-xl font-bold ${colors.brand.primary.text700} w-16 text-center`}>
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            {!isRunning ? (
              <Button variant="success" size="md" onClick={startExecution} leftIcon={<Play size={18} fill="currentColor" />}>
                Iniciar
              </Button>
            ) : (
              <Button variant="warning" size="md" onClick={pauseExecution} leftIcon={<Pause size={18} fill="currentColor" />}>
                Pausar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className={`${colors.status.success.text600} font-bold`}>{passedScenarios}</span> passed •
              <span className={`${colors.status.error.text600} font-bold ml-1`}>{failedScenarios}</span> failed
            </div>
            <div className={`px-3 py-1 ${borderRadius.full} text-sm font-bold flex items-center gap-2 ${
              executionStatus === 'PASSED' ? `${colors.status.success[100]} ${colors.status.success.text700}` :
              executionStatus === 'FAILED' ? `${colors.status.error[100]} ${colors.status.error.text700}` :
              `${colors.gray[100]} ${colors.gray.text600}`
            }`}>
              {executionStatus}
            </div>
          </div>
        </div>

        {/* Scenarios List - Using Composite Components */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <ScenarioList showExpandCollapseAll defaultAllExpanded={false}>
              {scenarios.map((scenario, scenarioIdx) => {
                const passedSteps = scenario.steps.filter((s: any) => s.status === 'passed').length;
                const failedSteps = scenario.steps.filter((s: any) => s.status === 'failed').length;
                const skippedSteps = scenario.steps.filter((s: any) => s.status === 'skipped').length;

                return (
                  <ScenarioCard
                    key={scenarioIdx}
                    scenarioName={scenario.scenarioName}
                    status={scenario.status as any}
                    passedSteps={passedSteps}
                    failedSteps={failedSteps}
                    skippedSteps={skippedSteps}
                    totalSteps={scenario.steps.length}
                    showBugButton={scenario.status === 'failed'}
                    onReportBug={() => {
                      setSelectedScenarioForBug({
                        index: scenarioIdx,
                        name: scenario.scenarioName,
                        steps: scenario.steps
                      });
                    }}
                  >
                    {/* Steps within scenario */}
                    <div className="space-y-3">
                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2 flex-wrap mb-3 pb-3 border-b border-gray-200">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleMarkAllStepsInScenario(scenarioIdx, 'passed')}
                          leftIcon={<CheckCircle2 size={14} />}
                        >
                          Mark All Passed
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleMarkAllStepsInScenario(scenarioIdx, 'failed')}
                          leftIcon={<XCircle size={14} />}
                        >
                          Mark All Failed
                        </Button>
                      </div>

                      {/* Steps */}
                      {scenario.steps.map((step: any, stepIdx: number) => (
                        <div key={step.id} className="flex flex-col gap-2">
                          {/* Step Item with Action Buttons */}
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <StepExecutionItem
                                keyword={step.keyword}
                                text={step.text}
                                status={step.status === 'pending' ? 'pending' : step.status}
                                stepNumber={stepIdx + 1}
                              />
                            </div>
                            {/* Mark Buttons */}
                            {step.status !== 'skipped' && (
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => markStep(scenarioIdx, step.id, 'passed')}
                                  className={`p-2 ${borderRadius.lg} transition-colors ${
                                    step.status === 'passed' ? `${colors.status.success[100]} ${colors.status.success.text700}` :
                                    `${colors.gray.text300} hover:bg-green-50 hover:text-green-600`
                                  }`}
                                >
                                  <CheckCircle2 size={20} />
                                </button>
                                <button
                                  onClick={() => markStep(scenarioIdx, step.id, 'failed')}
                                  className={`p-2 ${borderRadius.lg} transition-colors ${
                                    step.status === 'failed' ? `${colors.status.error[100]} ${colors.status.error.text700}` :
                                    `${colors.gray.text300} hover:bg-red-50 hover:text-red-600`
                                  }`}
                                >
                                  <XCircle size={20} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Evidence Area (Only for failed steps) */}
                          {step.status === 'failed' && (
                            <div className={`ml-9 pl-4 border-l-2 ${colors.status.error.border200}`}>
                              <div className="flex items-center gap-3">
                                {evidenceMap[step.id] ? (
                                  <div className={`flex items-center gap-2 bg-white px-3 py-2 ${borderRadius.base} border ${colors.gray.border200} text-sm ${colors.gray.text700}`}>
                                    <FileImage size={16} className={colors.brand.primary.text500} />
                                    <span className="max-w-[200px] truncate">{evidenceMap[step.id].name}</span>
                                    <button
                                      onClick={() => removeEvidence(step.id)}
                                      className={`${colors.status.error.text600} hover:bg-red-50 p-1 ${borderRadius.base} ml-2`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <label className={`flex items-center gap-2 cursor-pointer ${colors.status.error[100]} hover:bg-red-200 ${colors.status.error.text700} px-3 py-2 ${borderRadius.base} text-sm transition-colors`}>
                                    <Upload size={16} />
                                    Adjuntar Evidencia
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*,video/*,.log,.txt"
                                      onChange={(e) => handleFileChange(step.id, e)}
                                    />
                                  </label>
                                )}
                                <div className={`text-xs ${colors.gray.text500} flex items-center gap-1 italic`}>
                                  <AlertCircle size={12} />
                                  Puedes continuar ejecutando los siguientes steps
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScenarioCard>
                );
              })}
            </ScenarioList>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isSaving || scenarios.length === 0}
            isLoading={isSaving}
            leftIcon={!isSaving ? <Save size={18} /> : undefined}
          >
            {isSaving ? 'Guardando...' : 'Guardar Resultado'}
          </Button>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Confirmar Guardado"
        message={`¿Estás seguro de guardar esta ejecución?\n\nSe guardará el estado actual de todos los steps y evidencias adjuntadas.\n\nEstado: ${executionStatus}\nTiempo: ${formatTime(elapsedSeconds)}\nScenarios: ${scenarios.length}\nSteps completados: ${scenarios.reduce((sum, s) => sum + s.steps.filter((st: any) => st.status !== 'pending').length, 0)}/${totalSteps}`}
        confirmText="Guardar Ejecución"
        cancelText="Cancelar"
        variant="info"
        isLoading={isSaving}
      />

      {/* Bug Report Prompt */}
      <ConfirmModal
        isOpen={showBugPrompt}
        onClose={() => {
          setShowBugPrompt(false);
          onClose();
        }}
        onConfirm={() => {
          setShowBugPrompt(false);
          setShowBugModal(true);
        }}
        title="Test Failed - Create Bug Report?"
        message={`La ejecución del test ha fallado con ${failedScenarios} scenario(s) fallido(s).\n\n¿Deseas crear un bug report ahora?\n\nEsto te permitirá documentar el problema con toda la información de la ejecución automáticamente.`}
        confirmText="Sí, Crear Bug Report"
        cancelText="No, Cerrar"
        variant="warning"
      />

      {/* Bug Report Modal (All Scenarios) */}
      {showBugModal && savedExecutionId && (
        <BugReportModal
          isOpen={showBugModal}
          onClose={() => {
            setShowBugModal(false);
            onClose();
          }}
          onSuccess={() => {
            setShowBugModal(false);
            onClose();
          }}
          projectId={projectId}
          testCaseId={testCaseId}
          testCaseTitle={testCaseTitle}
          userStoryId={userStoryId}
          executionDetails={{
            execution_id: savedExecutionId,
            test_case_id: testCaseId,
            executed_by: 'QA Tester',
            execution_date: new Date().toISOString(),
            status: executionStatus === 'IN_PROGRESS' ? 'BLOCKED' : executionStatus,
            environment: 'QA',
            version: '',
            execution_time_minutes: elapsedSeconds / 60,
            total_steps: totalSteps,
            passed_steps: scenarios.reduce((sum, s) => sum + s.steps.filter((st: any) => st.status === 'passed').length, 0),
            failed_steps: scenarios.reduce((sum, s) => sum + s.steps.filter((st: any) => st.status === 'failed').length, 0),
            step_results: scenarios.flatMap(scenario =>
              scenario.steps.map((step: any) => ({
                step_index: step.id,
                keyword: step.keyword,
                text: step.text,
                status: step.status.toUpperCase(),
                scenario_name: scenario.scenarioName,
                evidence_file: undefined
              }))
            ),
            evidence_count: Object.keys(evidenceMap).length,
            evidence_files: [],
            bug_ids: []
          }}
        />
      )}

      {/* Bug Report Modal (Specific Scenario) */}
      {selectedScenarioForBug && (
        <BugReportModal
          isOpen={!!selectedScenarioForBug}
          onClose={() => {
            setSelectedScenarioForBug(null);
          }}
          onSuccess={() => {
            setSelectedScenarioForBug(null);
            toast.success('Bug reportado exitosamente para el scenario: ' + selectedScenarioForBug.name);
          }}
          projectId={projectId}
          testCaseId={testCaseId}
          testCaseTitle={testCaseTitle}
          userStoryId={userStoryId}
          scenarioName={selectedScenarioForBug.name}
          executionDetails={savedExecutionId ? {
            execution_id: savedExecutionId,
            test_case_id: testCaseId,
            executed_by: 'QA Tester',
            execution_date: new Date().toISOString(),
            status: 'FAILED',
            environment: 'QA',
            version: '',
            execution_time_minutes: elapsedSeconds / 60,
            total_steps: selectedScenarioForBug.steps.length,
            passed_steps: selectedScenarioForBug.steps.filter((st: any) => st.status === 'passed').length,
            failed_steps: selectedScenarioForBug.steps.filter((st: any) => st.status === 'failed').length,
            step_results: selectedScenarioForBug.steps.map((step: any) => ({
              step_index: step.id,
              keyword: step.keyword,
              text: step.text,
              status: step.status.toUpperCase(),
              scenario_name: selectedScenarioForBug.name,
              evidence_file: undefined
            })),
            evidence_count: selectedScenarioForBug.steps.filter(s => evidenceMap[s.id]).length,
            evidence_files: [],
            bug_ids: []
          } : undefined}
        />
      )}
    </div>
  );
};
