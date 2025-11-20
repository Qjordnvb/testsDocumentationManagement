import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Circle, Calendar, Clock, User, Image, AlertCircle } from 'lucide-react';
import { apiService } from '@/shared/api/apiClient';
import type { ExecutionDetails } from '@/entities/test-execution';
import toast from 'react-hot-toast';

interface Props {
  executionId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutionDetailsModal: React.FC<Props> = ({ executionId, isOpen, onClose }) => {
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'FAILED':
        return <XCircle size={16} className="text-red-600" />;
      case 'SKIPPED':
        return <Circle size={16} className="text-gray-400" />;
      case 'BLOCKED':
        return <AlertCircle size={16} className="text-yellow-600" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'SKIPPED':
        return 'bg-gray-100 text-gray-600';
      case 'BLOCKED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStepCardClass = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-50/50 border-green-200';
      case 'FAILED':
        return 'bg-red-50/50 border-red-200';
      case 'SKIPPED':
        return 'bg-gray-100 border-gray-300';
      case 'BLOCKED':
        return 'bg-yellow-50/50 border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

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
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusBadgeClass(execution.status)}`}>
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

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Steps Ejecutados</h3>
              <div className="space-y-3">
                {execution.step_results.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border transition-all ${getStepCardClass(step.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getStatusIcon(step.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-purple-700 text-sm">{step.keyword}</span>
                          <span className={`text-sm ${
                            step.status === 'SKIPPED' ? 'text-gray-400 line-through' : 'text-gray-800'
                          }`}>
                            {step.text}
                          </span>
                        </div>

                        {step.comment && (
                          <p className="text-xs text-gray-600 mt-2 pl-2 border-l-2 border-gray-300">
                            💬 {step.comment}
                          </p>
                        )}

                        {/* Evidence */}
                        {step.evidence_file && (
                          <div className="mt-3 pl-2 border-l-2 border-blue-300">
                            <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                              <Image size={12} />
                              Evidencia adjunta:
                            </p>
                            <div className="relative group">
                              <img
                                src={apiService.getEvidenceUrl(step.evidence_file)}
                                alt="Evidence"
                                className="max-w-md border rounded cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => openEvidence(step.evidence_file!)}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                <button
                                  onClick={() => openEvidence(step.evidence_file!)}
                                  className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1 rounded shadow-lg text-sm font-medium transition-opacity"
                                >
                                  🔍 Ver en tamaño completo
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {step.evidence_file.split('/').pop()}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        #{idx + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
            <div className="p-4 border-t bg-white flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
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
    </div>
  );
};
