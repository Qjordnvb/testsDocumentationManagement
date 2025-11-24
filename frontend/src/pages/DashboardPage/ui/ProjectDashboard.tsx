/**
 * Project Dashboard Main Component
 * Shows project statistics and metrics
 */

import { SkeletonCard } from '@/shared/ui';
import { MetricCard } from '@/widgets/dashboard-stats/MetricCard';
import { colors, getTypographyPreset } from '@/shared/design-system/tokens';
import { useProjectDashboard } from '../model';
import { ExecutiveMetricsCards } from './ExecutiveMetrics';
import { CompanyComparison } from './CompanyComparison';

export const ProjectDashboard = () => {
  const {
    projectId,
    currentProject,
    stats,
    isLoadingStats,
    statsError,
    coverage,
    isManager,
    companyAvg,
    executiveMetrics,
    navigate,
  } = useProjectDashboard();

  const body = getTypographyPreset('body');
  const headingMedium = getTypographyPreset('headingMedium');

  // Loading state
  if (isLoadingStats) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (statsError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className={`${body.className} ${colors.status.error.text600}`}>
          Error: {statsError || 'No se pudieron cargar las estadísticas'}
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          Volver a Proyectos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentProject?.name || 'Dashboard'}
          </h1>
          <p className="text-gray-600">Vista general del proyecto</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary flex items-center gap-2"
        >
          <span>🏠</span>
          <span>All Projects</span>
        </button>
      </div>

      {/* Manager: Executive Dashboard */}
      {isManager ? (
        <>
          {/* Executive KPIs */}
          <ExecutiveMetricsCards metrics={executiveMetrics} />

          {/* Comparison with Company Average */}
          <CompanyComparison stats={stats} coverage={coverage} companyAvg={companyAvg} />
        </>
      ) : (
        /* QA/Dev: Standard Metric Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon="📝"
            label="User Stories"
            value={stats.total_user_stories || 0}
            color="blue"
            onClick={() => navigate(`/projects/${projectId}/stories`)}
          />
          <MetricCard
            icon="✅"
            label="Test Cases"
            value={stats.total_test_cases || 0}
            color="green"
            onClick={() => navigate(`/projects/${projectId}/tests`)}
          />
          <MetricCard
            icon="🐛"
            label="Bug Reports"
            value={stats.total_bugs || 0}
            color="red"
            onClick={() => navigate(`/projects/${projectId}/bugs`)}
          />
          <MetricCard
            icon="📊"
            label="Test Coverage"
            value={`${coverage}%`}
            color="purple"
            onClick={() => navigate(`/projects/${projectId}/tests`)}
          />
        </div>
      )}

      {/* Stories by status */}
      {stats.stories_by_status && Object.keys(stats.stories_by_status).length > 0 && (
        <div className="card">
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-4`}>
            Stories by Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.stories_by_status).map(([status, count]) => (
              <div
                key={status}
                className="p-4 bg-gray-50 rounded-lg text-center hover:shadow-md transition-shadow"
              >
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases by status - Commented out temporarily */}
      {/* {stats.test_cases_by_status && Object.keys(stats.test_cases_by_status).length > 0 && (
        <div className="card">
          ...
        </div>
      )} */}

      {/* Recent Activity */}
      <div className="card">
        <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-4`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/projects/${projectId}/stories`)}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="font-semibold text-gray-900">Manage Stories</div>
            <div className="text-sm text-gray-600">View and edit user stories</div>
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/tests`)}
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold text-gray-900">Test Cases</div>
            <div className="text-sm text-gray-600">Generate and run tests</div>
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/bugs`)}
            className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            <div className="text-3xl mb-2">🐛</div>
            <div className="font-semibold text-gray-900">Bug Reports</div>
            <div className="text-sm text-gray-600">Track and manage bugs</div>
          </button>
        </div>
      </div>

      {/* Upload Modal - Temporarily disabled pending UploadModal refactor */}
      {/* {uploadModalOpen && projectId && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )} */}

      {/* Last update timestamp */}
      {stats.timestamp && (
        <p className="text-sm text-gray-500 text-center">
          Last updated: {new Date(stats.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};
