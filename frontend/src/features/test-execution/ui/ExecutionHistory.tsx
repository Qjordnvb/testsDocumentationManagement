import { useState, useEffect } from 'react';
import { Clock, User, CheckCircle2, XCircle, Circle, Paperclip, Calendar } from 'lucide-react';
import { apiService } from '@/shared/api/apiClient';
import type { ExecutionHistoryResponse } from '@/entities/test-execution';

interface Props {
  testCaseId: string;
  onSelectExecution?: (executionId: number) => void;
}

export const ExecutionHistory: React.FC<Props> = ({ testCaseId, onSelectExecution }) => {
  const [historyData, setHistoryData] = useState<ExecutionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExecutions();
  }, [testCaseId]);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTestCaseExecutions(testCaseId);
      setHistoryData(data);
    } catch (err: any) {
      console.error('Error loading execution history:', err);
      setError('Error al cargar historial de ejecuciones');
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
      case 'BLOCKED':
        return <Circle size={16} className="text-yellow-600" />;
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
      case 'BLOCKED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Cargando historial...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (!historyData || historyData.executions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Circle size={32} className="mx-auto mb-2 text-gray-300" />
        <p>No hay ejecuciones registradas</p>
        <p className="text-sm mt-1">Ejecuta este test case para ver su historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">
          Historial de Ejecuciones ({historyData.total})
        </h4>
        <button
          onClick={loadExecutions}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="space-y-2">
        {historyData.executions.map((execution) => (
          <div
            key={execution.execution_id}
            onClick={() => onSelectExecution?.(execution.execution_id)}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(execution.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(execution.status)}`}>
                      {execution.status}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(execution.execution_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {execution.executed_by}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {execution.execution_time_minutes.toFixed(1)} min
                    </span>
                    <span className="font-mono">
                      {execution.environment}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="text-xs text-gray-600">
                  <span className="text-green-600 font-medium">✓ {execution.passed_steps}</span>
                  {' / '}
                  <span className="text-red-600 font-medium">✗ {execution.failed_steps}</span>
                  {' / '}
                  <span className="text-gray-500">{execution.total_steps}</span>
                </div>
                {execution.evidence_count > 0 && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Paperclip size={12} />
                    {execution.evidence_count}
                  </span>
                )}
              </div>
            </div>

            {execution.notes && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600 line-clamp-2">{execution.notes}</p>
              </div>
            )}

            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-xs text-blue-600 hover:underline">
                Ver detalles →
              </button>
            </div>
          </div>
        ))}
      </div>

      {historyData.total > historyData.executions.length && (
        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Ver más ejecuciones ({historyData.total - historyData.executions.length} restantes)
          </button>
        </div>
      )}
    </div>
  );
};
