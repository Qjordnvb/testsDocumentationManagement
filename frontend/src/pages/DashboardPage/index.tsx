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
import { projectApi, type ProjectStats } from '@/entities/project';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{statsError}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">
            {currentProject?.name || 'Dashboard'}
          </h1>
          <p className="text-gray-600 mt-2">Overview of your project metrics</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary flex items-center gap-2"
        >
          <span>🏠</span>
          <span>All Projects</span>
        </button>
      </div>

      {/* Metric cards grid */}
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

      {/* Stories by status */}
      {stats?.stories_by_status && Object.keys(stats.stories_by_status).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Stories by Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.stories_by_status).map(([status, count]) => (
              <div key={status} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
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

      {/* Reports Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Reports & Downloads
        </h2>
        <p className="text-gray-600 mb-4">Generate comprehensive reports for your team</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDownloadBugSummary}
            disabled={!stats || stats.total_bugs === 0}
            className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={stats?.total_bugs === 0 ? "No bugs to report" : "Download Bug Summary Report"}
          >
            <span>🐛</span>
            <span>Bug Summary Report</span>
            <span className="text-xs opacity-75">(for Dev Team)</span>
          </button>
          <button
            onClick={handleDownloadTestExecutionReport}
            disabled={!stats || stats.total_test_cases === 0}
            className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={stats?.total_test_cases === 0 ? "No test cases to report" : "Download Test Execution Report"}
          >
            <span>✅</span>
            <span>Test Execution Report</span>
            <span className="text-xs opacity-75">(for QA Manager)</span>
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
        <p className="text-sm text-gray-500 text-center">
          Last updated: {new Date(stats.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};
