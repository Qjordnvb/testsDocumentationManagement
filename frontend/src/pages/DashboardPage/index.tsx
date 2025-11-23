/**
 * Dashboard Page
 * Shows project-specific metrics and quick actions
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MetricCard } from '@/widgets/dashboard-stats/MetricCard';
import { UploadModal } from '@/features/upload-excel';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import { projectApi, type ProjectStats } from '@/entities/project';
import { colors, getTypographyPreset } from '@/shared/design-system/tokens';
import { LoadingSpinner } from '@/shared/ui';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target, Activity } from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const { hasRole } = useAuth();
  const isManager = hasRole('manager');
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Manager-specific state: company averages for comparison
  const [companyAvg, setCompanyAvg] = useState({ coverage: 0, bugs: 0, stories: 0, tests: 0 });

  // Typography presets
  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingMedium = getTypographyPreset('headingMedium');
  const headingLarge = getTypographyPreset('headingLarge');

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load stats on mount (NO POLLING)
  useEffect(() => {
    if (!projectId) return;

    const loadStats = async () => {
      setIsLoadingStats(true);
      setStatsError(null);
      try {
        const data = await projectApi.getStats(projectId);
        setStats(data);
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : 'Failed to load stats');
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
    // No interval - user can manually refresh
  }, [projectId]);

  // Manager: Load all projects for comparison metrics
  useEffect(() => {
    if (!isManager) return;

    const loadAllProjects = async () => {
      try {
        const projects = await projectApi.getAll();

        // Calculate company averages
        if (projects.length > 0) {
          const totalCoverage = projects.reduce((sum, p) => sum + p.test_coverage, 0);
          const totalBugs = projects.reduce((sum, p) => sum + p.total_bugs, 0);
          const totalStories = projects.reduce((sum, p) => sum + p.total_user_stories, 0);
          const totalTests = projects.reduce((sum, p) => sum + p.total_test_cases, 0);

          setCompanyAvg({
            coverage: totalCoverage / projects.length,
            bugs: totalBugs / projects.length,
            stories: totalStories / projects.length,
            tests: totalTests / projects.length,
          });
        }
      } catch (error) {
        console.error('Error loading projects for comparison:', error);
      }
    };

    loadAllProjects();
  }, [isManager]);

  // Handle upload success
  const handleUploadSuccess = async () => {
    // Refresh stats after upload
    if (projectId) {
      try {
        const data = await projectApi.getStats(projectId);
        setStats(data);
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    }
    // Navigate to stories page to see uploaded stories
    navigate(`/projects/${projectId}/stories`);
  };

  // Manual refresh
  const handleRefresh = async () => {
    if (!projectId) return;
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const data = await projectApi.getStats(projectId);
      setStats(data);
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Failed to load stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Get coverage from backend (already calculated correctly)
  // Backend calculates: (stories_with_tests / total_stories) * 100
  const coverage = stats ? stats.test_coverage : 0;

  // Manager Executive Metrics
  const getHealthScore = (): number => {
    if (!stats) return 0;
    // Health = 40% coverage + 30% low bugs + 30% test execution rate
    const coverageScore = (coverage / 100) * 40;
    const bugScore = Math.max(0, (1 - (stats.total_bugs / (stats.total_user_stories || 1))) * 30);
    const testScore = Math.max(0, ((stats.total_test_cases / (stats.total_user_stories || 1)) / 3) * 30); // Assuming 3 tests per story is ideal
    return Math.min(100, coverageScore + bugScore + testScore);
  };

  const getRiskLevel = (): { level: 'low' | 'medium' | 'high'; message: string } => {
    if (!stats) return { level: 'low', message: 'No data' };

    const criticalFactors = [];
    if (coverage < 50) criticalFactors.push('cobertura baja');
    if (stats.total_bugs > stats.total_user_stories * 0.3) criticalFactors.push('alto número de bugs');
    if (stats.total_test_cases < stats.total_user_stories) criticalFactors.push('pocos test cases');

    if (criticalFactors.length >= 2) return { level: 'high', message: criticalFactors.join(', ') };
    if (criticalFactors.length === 1) return { level: 'medium', message: criticalFactors[0] };
    return { level: 'low', message: 'Proyecto saludable' };
  };

  const getQualityTrend = (): 'improving' | 'stable' | 'declining' => {
    if (!stats) return 'stable';
    // Compare with company average
    const coverageDiff = coverage - companyAvg.coverage;
    const bugDiff = (stats.total_bugs / (stats.total_user_stories || 1)) - (companyAvg.bugs / (companyAvg.stories || 1));

    if (coverageDiff > 10 && bugDiff < -0.1) return 'improving';
    if (coverageDiff < -10 || bugDiff > 0.2) return 'declining';
    return 'stable';
  };

  const getComparisonIndicator = (current: number, average: number, lowerIsBetter: boolean = false) => {
    const diff = current - average;
    const percentage = average > 0 ? (diff / average) * 100 : 0;
    const isGood = lowerIsBetter ? diff < 0 : diff > 0;

    return {
      diff: Math.abs(diff),
      percentage: Math.abs(percentage),
      isGood,
      icon: isGood ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
      color: isGood ? 'text-green-600' : 'text-red-600',
    };
  };

  // Download reports
  const handleDownloadBugSummary = async () => {
    if (!projectId) return;

    try {
      toast.loading('Generating Bug Summary Report...');
      const response = await fetch(`/api/v1/projects/${projectId}/reports/bug-summary`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate report');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BugSummary_${currentProject?.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Bug Summary Report downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Failed to download report');
    }
  };

  const handleDownloadTestExecutionReport = async () => {
    if (!projectId) return;

    try {
      toast.loading('Generating Test Execution Report...');
      const response = await fetch(`/api/v1/projects/${projectId}/reports/test-execution-summary`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate report');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TestExecution_${currentProject?.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Test Execution Report downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Failed to download report');
    }
  };

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="xl" variant="emoji" label="Loading dashboard..." center />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-2`}>Error Loading Dashboard</h2>
          <p className={`${body.className} ${colors.gray.text600} mb-4`}>{statsError}</p>
          <button
            onClick={handleRefresh}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`${headingLarge.className} font-bold ${colors.gray.text900}`}>
            {currentProject?.name || 'Dashboard'}
          </h1>
          <p className={`${body.className} ${colors.gray.text600} mt-2`}>Overview of your project metrics</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Health Score */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Health Score</span>
                <Activity size={20} className="text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {getHealthScore().toFixed(0)}
                <span className="text-xl text-gray-600">/100</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {getHealthScore() >= 70 ? (
                  <CheckCircle2 size={16} className="text-green-600" />
                ) : (
                  <AlertTriangle size={16} className="text-orange-500" />
                )}
                <span className={getHealthScore() >= 70 ? 'text-green-600' : 'text-orange-500'}>
                  {getHealthScore() >= 70 ? 'Excelente' : getHealthScore() >= 50 ? 'Aceptable' : 'Requiere atención'}
                </span>
              </div>
            </div>

            {/* Risk Level */}
            <div className={`card border-l-4 ${
              getRiskLevel().level === 'high' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-500' :
              getRiskLevel().level === 'medium' ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500' :
              'bg-gradient-to-br from-green-50 to-green-100 border-green-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Nivel de Riesgo</span>
                <AlertTriangle size={20} className={
                  getRiskLevel().level === 'high' ? 'text-red-600' :
                  getRiskLevel().level === 'medium' ? 'text-orange-500' :
                  'text-green-600'
                } />
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                getRiskLevel().level === 'high' ? 'text-red-600' :
                getRiskLevel().level === 'medium' ? 'text-orange-500' :
                'text-green-600'
              }`}>
                {getRiskLevel().level === 'high' ? 'ALTO' :
                 getRiskLevel().level === 'medium' ? 'MEDIO' : 'BAJO'}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{getRiskLevel().message}</p>
            </div>

            {/* Quality Trend */}
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Tendencia de Calidad</span>
                <Target size={20} className="text-purple-600" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                {getQualityTrend() === 'improving' && (
                  <>
                    <TrendingUp size={32} className="text-green-600" />
                    <span className="text-2xl font-bold text-green-600">Mejorando</span>
                  </>
                )}
                {getQualityTrend() === 'stable' && (
                  <>
                    <Activity size={32} className="text-blue-600" />
                    <span className="text-2xl font-bold text-blue-600">Estable</span>
                  </>
                )}
                {getQualityTrend() === 'declining' && (
                  <>
                    <TrendingDown size={32} className="text-red-600" />
                    <span className="text-2xl font-bold text-red-600">En Declive</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600">vs. promedio de proyectos</p>
            </div>

            {/* Test Efficiency */}
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Eficiencia de Testing</span>
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {stats ? ((stats.total_test_cases / (stats.total_user_stories || 1)) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-gray-600">
                {stats?.total_test_cases || 0} tests / {stats?.total_user_stories || 0} stories
              </p>
            </div>
          </div>

          {/* Comparison with Company Average */}
          <div className="card">
            <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-4`}>
              📊 Comparación con Promedio de Proyectos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Coverage Comparison */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Cobertura de Tests</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{coverage.toFixed(1)}%</span>
                  <span className="text-sm text-gray-500">vs {companyAvg.coverage.toFixed(1)}%</span>
                </div>
                {companyAvg.coverage > 0 && (
                  <div className={`flex items-center gap-1 text-sm ${getComparisonIndicator(coverage, companyAvg.coverage).color}`}>
                    {getComparisonIndicator(coverage, companyAvg.coverage).icon}
                    <span>
                      {getComparisonIndicator(coverage, companyAvg.coverage).percentage.toFixed(1)}%{' '}
                      {getComparisonIndicator(coverage, companyAvg.coverage).isGood ? 'mejor' : 'peor'}
                    </span>
                  </div>
                )}
              </div>

              {/* Bugs Comparison */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Bugs Totales</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{stats?.total_bugs || 0}</span>
                  <span className="text-sm text-gray-500">vs {companyAvg.bugs.toFixed(1)}</span>
                </div>
                {companyAvg.bugs > 0 && (
                  <div className={`flex items-center gap-1 text-sm ${getComparisonIndicator(stats?.total_bugs || 0, companyAvg.bugs, true).color}`}>
                    {getComparisonIndicator(stats?.total_bugs || 0, companyAvg.bugs, true).icon}
                    <span>
                      {getComparisonIndicator(stats?.total_bugs || 0, companyAvg.bugs, true).percentage.toFixed(1)}%{' '}
                      {getComparisonIndicator(stats?.total_bugs || 0, companyAvg.bugs, true).isGood ? 'menos' : 'más'}
                    </span>
                  </div>
                )}
              </div>

              {/* Stories Comparison */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">User Stories</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{stats?.total_user_stories || 0}</span>
                  <span className="text-sm text-gray-500">vs {companyAvg.stories.toFixed(1)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Tamaño {(stats?.total_user_stories || 0) > companyAvg.stories ? 'mayor' : 'menor'} al promedio
                </div>
              </div>

              {/* Tests Comparison */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Test Cases</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{stats?.total_test_cases || 0}</span>
                  <span className="text-sm text-gray-500">vs {companyAvg.tests.toFixed(1)}</span>
                </div>
                {companyAvg.tests > 0 && (
                  <div className={`flex items-center gap-1 text-sm ${getComparisonIndicator(stats?.total_test_cases || 0, companyAvg.tests).color}`}>
                    {getComparisonIndicator(stats?.total_test_cases || 0, companyAvg.tests).icon}
                    <span>
                      {getComparisonIndicator(stats?.total_test_cases || 0, companyAvg.tests).percentage.toFixed(1)}%{' '}
                      {getComparisonIndicator(stats?.total_test_cases || 0, companyAvg.tests).isGood ? 'más' : 'menos'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* QA/Dev: Standard Metric Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon="📝"
            label="User Stories"
            value={stats?.total_user_stories || 0}
            color="blue"
            onClick={() => navigate(`/projects/${projectId}/stories`)}
          />
          <MetricCard
            icon="✅"
            label="Test Cases"
            value={stats?.total_test_cases || 0}
            color="green"
            onClick={() => navigate(`/projects/${projectId}/tests`)}
          />
          <MetricCard
            icon="🐛"
            label="Bug Reports"
            value={stats?.total_bugs || 0}
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
      {stats?.stories_by_status && Object.keys(stats.stories_by_status).length > 0 && (
        <div className="card">
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-4`}>
            Stories by Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.stories_by_status).map(([status, count]) => (
              <div key={status} className="text-center">
                <p className={`${headingMedium.className} font-bold ${colors.gray.text900}`}>{count}</p>
                <p className={`${bodySmall.className} ${colors.gray.text600}`}>{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions - Manager sees only Refresh */}
      {!isManager && (
        <div className="card">
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-4`}>
            🎯 Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <span>📤</span>
              <span>Upload Excel</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}/stories`)}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <span>✨</span>
              <span>Generate Tests</span>
            </button>
            <button
              onClick={handleRefresh}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      )}

      {/* Reports Section */}
      <div className="card">
        <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-4`}>
          📊 Reports & Downloads
        </h2>
        <p className={`${body.className} ${colors.gray.text600} mb-4`}>Generate comprehensive reports for your team</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDownloadBugSummary}
            disabled={!stats || stats.total_bugs === 0}
            className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={stats?.total_bugs === 0 ? "No bugs to report" : "Download Bug Summary Report"}
          >
            <span>🐛</span>
            <span>Bug Summary Report</span>
            <span className={`${bodySmall.className} opacity-75`}>(for Dev Team)</span>
          </button>
          <button
            onClick={handleDownloadTestExecutionReport}
            disabled={!stats || stats.total_test_cases === 0}
            className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={stats?.total_test_cases === 0 ? "No test cases to report" : "Download Test Execution Report"}
          >
            <span>✅</span>
            <span>Test Execution Report</span>
            <span className={`${bodySmall.className} opacity-75`}>(for QA Manager)</span>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Last update timestamp */}
      {stats?.timestamp && (
        <p className={`${bodySmall.className} ${colors.gray.text500} text-center`}>
          Last updated: {new Date(stats.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};
