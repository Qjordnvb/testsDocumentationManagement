import { useState, useEffect } from 'react';
import { Clock, User, CheckCircle2, XCircle, Circle, Paperclip, Calendar, Bug } from 'lucide-react';
import { apiService } from '@/shared/api/apiClient';
import type { ExecutionHistoryResponse } from '@/entities/test-execution';
import {
  colors,
  borderRadius,
  getTypographyPreset,
  getStatusClasses,
} from '@/shared/design-system/tokens';

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
    const statusClasses = getStatusClasses(status as any);
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 size={16} className={statusClasses.iconClass} />;
      case 'FAILED':
        return <XCircle size={16} className={statusClasses.iconClass} />;
      case 'BLOCKED':
        return <Circle size={16} className={colors.status.warning.text600} />;
      default:
        return <Circle size={16} className={colors.gray.text400} />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses = getStatusClasses(status as any);
    return `${statusClasses.bgClass} ${statusClasses.textClass}`;
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

  const bodySmall = getTypographyPreset('bodySmall');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className={colors.gray.text500}>Cargando historial...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.lg} p-4 ${colors.status.error.text800}`}>
        {error}
      </div>
    );
  }

  if (!historyData || historyData.executions.length === 0) {
    return (
      <div className={`text-center py-8 ${colors.gray.text500}`}>
        <Circle size={32} className={`mx-auto mb-2 ${colors.gray.text300}`} />
        <p>No hay ejecuciones registradas</p>
        <p className={`${bodySmall.className} mt-1`}>Ejecuta este test case para ver su historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold ${colors.gray.text900}`}>
          Historial de Ejecuciones ({historyData.total})
        </h4>
        <button
          onClick={loadExecutions}
          className={`${bodySmall.className} ${colors.brand.primary.text600} hover:text-blue-800`}
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="space-y-2">
        {historyData.executions.map((execution) => (
          <div
            key={execution.execution_id}
            onClick={() => onSelectExecution?.(execution.execution_id)}
            className={`border ${colors.gray.border200} ${borderRadius.lg} p-3 hover:bg-gray-50 cursor-pointer transition-colors group`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(execution.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 ${borderRadius.base} ${bodySmall.className} font-medium ${getStatusBadgeClass(execution.status)}`}>
                      {execution.status}
                    </span>
                    <span className={`${bodySmall.className} ${colors.gray.text500} flex items-center gap-1`}>
                      <Calendar size={12} />
                      {formatDate(execution.execution_date)}
                    </span>
                  </div>

                  <div className={`flex items-center gap-4 ${bodySmall.className} ${colors.gray.text600}`}>
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
                <div className={`${bodySmall.className} ${colors.gray.text600}`}>
                  <span className={`${colors.status.success.text600} font-medium`}>✓ {execution.passed_steps}</span>
                  {' / '}
                  <span className={`${colors.status.error.text600} font-medium`}>✗ {execution.failed_steps}</span>
                  {' / '}
                  <span className={colors.gray.text500}>{execution.total_steps}</span>
                </div>
                <div className="flex items-center gap-2">
                  {execution.evidence_count > 0 && (
                    <span className={`${bodySmall.className} ${colors.brand.primary.text600} flex items-center gap-1`}>
                      <Paperclip size={12} />
                      {execution.evidence_count}
                    </span>
                  )}
                  {execution.bug_ids && execution.bug_ids.length > 0 && (
                    <span
                      className={`${bodySmall.className} ${colors.status.error.text600} flex items-center gap-1 font-semibold`}
                      title={`Bugs: ${execution.bug_ids.join(', ')}`}
                    >
                      <Bug size={12} />
                      {execution.bug_ids.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {execution.notes && (
              <div className={`mt-2 pt-2 border-t ${colors.gray.border100}`}>
                <p className={`${bodySmall.className} ${colors.gray.text600} line-clamp-2`}>{execution.notes}</p>
              </div>
            )}

            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className={`${bodySmall.className} ${colors.brand.primary.text600} hover:underline`}>
                Ver detalles →
              </button>
            </div>
          </div>
        ))}
      </div>

      {historyData.total > historyData.executions.length && (
        <div className="text-center pt-2">
          <button className={`${bodySmall.className} ${colors.brand.primary.text600} hover:text-blue-800`}>
            Ver más ejecuciones ({historyData.total - historyData.executions.length} restantes)
          </button>
        </div>
      )}
    </div>
  );
};
