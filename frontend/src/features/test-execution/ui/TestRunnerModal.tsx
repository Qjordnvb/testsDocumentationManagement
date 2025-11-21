import React, { useEffect, useState } from 'react';
import { X, Play, Pause, CheckCircle2, XCircle, Clock, Save, AlertCircle, Upload, Trash2, FileImage, ChevronDown, ChevronRight, Bug, ChevronsDown, ChevronsUp } from 'lucide-react';
import { useTestRunner } from '../model/useTestRunner';
import { parseGherkinContent } from '@/shared/lib/gherkinParser';
import { apiService } from '@/shared/api/apiClient';
import { ConfirmModal } from '@/shared/ui';
import { BugReportModal } from '@/features/bug-management/ui/BugReportModal';
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

  // Expand/Collapse All function
  const handleExpandCollapseAll = () => {
    const allExpanded = expandedScenarios.size === scenarios.length;
    if (allExpanded) {
      // Collapse all
      scenarios.forEach((_, idx) => {
        if (expandedScenarios.has(idx)) {
          toggleScenario(idx);
        }
      });
    } else {
      // Expand all
      scenarios.forEach((_, idx) => {
        if (!expandedScenarios.has(idx)) {
          toggleScenario(idx);
        }
      });
    }
  };

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
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <Clock size={18} className="text-blue-600" />
              <span className="font-mono text-xl font-bold text-blue-700 w-16 text-center">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            {!isRunning ? (
              <button onClick={startExecution} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-95">
                <Play size={18} fill="currentColor" /> Iniciar
              </button>
            ) : (
              <button onClick={pauseExecution} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-95">
                <Pause size={18} fill="currentColor" /> Pausar
              </button>
            )}
            <button
              onClick={handleExpandCollapseAll}
              className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium transition-all border border-purple-200"
              title={expandedScenarios.size === scenarios.length ? "Collapse All" : "Expand All"}
            >
              {expandedScenarios.size === scenarios.length ? (
                <><ChevronsUp size={18} /> Collapse All</>
              ) : (
                <><ChevronsDown size={18} /> Expand All</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="text-green-600 font-bold">{passedScenarios}</span> passed •
              <span className="text-red-600 font-bold ml-1">{failedScenarios}</span> failed
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${
              executionStatus === 'PASSED' ? 'bg-green-100 text-green-700' :
              executionStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {executionStatus}
            </div>
          </div>
        </div>

        {/* Scenarios List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="space-y-4 max-w-4xl mx-auto">
            {scenarios.map((scenario, scenarioIdx) => {
              const isExpanded = expandedScenarios.has(scenarioIdx);
              const passedSteps = scenario.steps.filter((s: any) => s.status === 'passed').length;
              const failedSteps = scenario.steps.filter((s: any) => s.status === 'failed').length;

              return (
                <div
                  key={scenarioIdx}
                  className={`rounded-lg border shadow-sm overflow-hidden transition-all ${
                    scenario.status === 'passed' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' :
                    scenario.status === 'failed' ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300' :
                    scenario.status === 'skipped' ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400' :
                    'bg-white border-gray-200'
                  }`}
                >
                  {/* Scenario Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        onClick={() => toggleScenario(scenarioIdx)}
                        className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
                      >
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-base">{scenario.scenarioName}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {scenario.steps.length} steps •
                            <span className="text-green-600 ml-1">{passedSteps} passed</span> •
                            <span className="text-red-600 ml-1">{failedSteps} failed</span>
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        scenario.status === 'passed' ? 'bg-green-100 text-green-700' :
                        scenario.status === 'failed' ? 'bg-red-100 text-red-700' :
                        scenario.status === 'skipped' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {scenario.status.toUpperCase()}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAllStepsInScenario(scenarioIdx, 'passed');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                        title="Mark all steps as passed"
                      >
                        <CheckCircle2 size={14} />
                        Mark All Passed
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAllStepsInScenario(scenarioIdx, 'failed');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                        title="Mark all steps as failed"
                      >
                        <XCircle size={14} />
                        Mark All Failed
                      </button>
                      {scenario.status === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScenarioForBug({
                              index: scenarioIdx,
                              name: scenario.scenarioName,
                              steps: scenario.steps
                            });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-medium transition-colors ml-auto"
                          title="Report bug for this scenario"
                        >
                          <Bug size={14} />
                          Report Bug
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scenario Steps (Expandable) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="p-4 space-y-3">
                        {scenario.steps.map((step: any, stepIdx: number) => (
                          <div
                            key={step.id}
                            className={`flex flex-col p-3 rounded-lg border transition-all ${
                              step.status === 'passed' ? 'bg-green-50/50 border-green-200' :
                              step.status === 'failed' ? 'bg-red-50/50 border-red-200 shadow-sm' :
                              step.status === 'skipped' ? 'bg-gray-100 border-gray-300' :
                              'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1.5 text-xs font-bold text-gray-400 w-6 text-right">
                                {stepIdx + 1}
                              </div>
                              <div className="flex-1 pt-1">
                                <div className="flex gap-2 text-sm">
                                  <span className="font-bold text-purple-700">{step.keyword}</span>
                                  <span className={`font-medium ${
                                    step.status === 'skipped' ? 'text-gray-400 line-through' : 'text-gray-800'
                                  }`}>
                                    {step.text}
                                  </span>
                                </div>
                              </div>
                              {step.status !== 'skipped' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => markStep(scenarioIdx, step.id, 'passed')}
                                    className={`p-2 rounded-lg transition-colors ${
                                      step.status === 'passed' ? 'bg-green-100 text-green-700' :
                                      'text-gray-300 hover:bg-green-50 hover:text-green-600'
                                    }`}
                                  >
                                    <CheckCircle2 size={20} />
                                  </button>
                                  <button
                                    onClick={() => markStep(scenarioIdx, step.id, 'failed')}
                                    className={`p-2 rounded-lg transition-colors ${
                                      step.status === 'failed' ? 'bg-red-100 text-red-700' :
                                      'text-gray-300 hover:bg-red-50 hover:text-red-600'
                                    }`}
                                  >
                                    <XCircle size={20} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Evidence Area (Only for failed steps) */}
                            {step.status === 'failed' && (
                              <div className="mt-3 ml-9 pl-4 border-l-2 border-red-200">
                                <div className="flex items-center gap-3">
                                  {evidenceMap[step.id] ? (
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 text-sm text-gray-700">
                                      <FileImage size={16} className="text-blue-500" />
                                      <span className="max-w-[200px] truncate">{evidenceMap[step.id].name}</span>
                                      <button
                                        onClick={() => removeEvidence(step.id)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded ml-2"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-2 cursor-pointer bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm transition-colors">
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
                                  <div className="text-xs text-gray-500 flex items-center gap-1 italic">
                                    <AlertCircle size={12} />
                                    Puedes continuar ejecutando los siguientes steps
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || scenarios.length === 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all active:scale-95"
          >
            {isSaving ? (
              <>Guardando...</>
            ) : (
              <><Save size={18} /> Guardar Resultado</>
            )}
          </button>
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
            status: executionStatus,
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
                evidence_file: null
              }))
            ),
            evidence_count: Object.keys(evidenceMap).length,
            evidence_files: []
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
              evidence_file: evidenceMap[step.id] ? null : null
            })),
            evidence_count: selectedScenarioForBug.steps.filter(s => evidenceMap[s.id]).length,
            evidence_files: []
          } : undefined}
        />
      )}
    </div>
  );
};
