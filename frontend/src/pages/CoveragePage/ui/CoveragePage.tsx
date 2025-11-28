import { useParams, useNavigate } from 'react-router-dom';
import { useCoverage } from '../model/useCoverage';
import { MetricCard } from './MetricCard';
import { Button, SkeletonCard } from '@/shared/ui';
import { Target, PlayCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const CoveragePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { coverage, loading } = useCoverage(projectId!);

  if (loading || !coverage) {
    return (
      <div className="p-6 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'green';
    if (value >= thresholds.warning) return 'yellow';
    return 'red';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Coverage Dashboard</h1>
        <p className="text-gray-600 mt-1">Análisis de cobertura de testing para el proyecto</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          icon={<Target size={24} />}
          title="Test Coverage"
          value={`${coverage.test_coverage_percent}%`}
          subtitle={`${coverage.stories_with_tests} / ${coverage.total_stories} stories`}
          color={getMetricColor(coverage.test_coverage_percent, { good: 80, warning: 50 })}
        />

        <MetricCard
          icon={<PlayCircle size={24} />}
          title="Execution Rate"
          value={`${coverage.execution_rate_percent}%`}
          subtitle={`${coverage.executed_tests} / ${coverage.total_tests} tests`}
          color={getMetricColor(coverage.execution_rate_percent, { good: 70, warning: 40 })}
        />

        <MetricCard
          icon={<CheckCircle size={24} />}
          title="Pass Rate"
          value={`${coverage.pass_rate_percent}%`}
          subtitle={`${coverage.passed_tests} tests pasados`}
          color={getMetricColor(coverage.pass_rate_percent, { good: 90, warning: 70 })}
        />
      </div>

      {/* Stories sin tests */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Stories Sin Tests ({coverage.stories_without_tests.length})
          </h2>
        </div>

        {coverage.stories_without_tests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <p className="text-gray-600 font-medium">¡Excelente! Todas las stories tienen tests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Título</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prioridad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Sprint</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {coverage.stories_without_tests.map(story => (
                  <tr key={story.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{story.id}</td>
                    <td className="py-3 px-4">{story.title}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        story.priority === 'High' ? 'bg-red-100 text-red-700' :
                        story.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {story.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">{story.sprint || '-'}</td>
                    <td className="py-3 px-4">{story.status}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/projects/${projectId}/stories`)}
                      >
                        + Generate Tests
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
