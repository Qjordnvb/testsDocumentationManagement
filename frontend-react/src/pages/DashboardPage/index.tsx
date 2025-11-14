/**
 * Dashboard Page
 * Shows project metrics and quick actions
 */

import { useEffect } from 'react';
import { MetricCard } from '@/widgets/dashboard-stats/MetricCard';
import { useAppStore } from '@/app/providers/appStore';
import apiService from '@/shared/api/apiClient';

export const Dashboard = () => {
  const { stats, isLoadingStats, statsError, setStats, setIsLoadingStats, setStatsError } =
    useAppStore();

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const data = await apiService.getStats();
        setStats(data);
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : 'Failed to load stats');
      }
    };

    loadStats();

    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [setStats, setIsLoadingStats, setStatsError]);

  // Calculate coverage
  const coverage = stats
    ? stats.total_user_stories > 0
      ? Math.round((stats.total_test_cases / stats.total_user_stories) * 100)
      : 0
    : 0;

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
            onClick={() => window.location.reload()}
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your QA project metrics</p>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon="📝"
          label="User Stories"
          value={stats?.total_user_stories || 0}
          color="blue"
        />
        <MetricCard
          icon="✅"
          label="Test Cases"
          value={stats?.total_test_cases || 0}
          color="green"
        />
        <MetricCard
          icon="🐛"
          label="Bug Reports"
          value={stats?.total_bugs || 0}
          color="red"
        />
        <MetricCard
          icon="📊"
          label="Test Coverage"
          value={`${coverage}%`}
          color="purple"
        />
      </div>

      {/* Stories by status */}
      {stats?.stories_by_status && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn btn-primary flex items-center justify-center gap-2">
            <span>📤</span>
            <span>Upload Excel</span>
          </button>
          <button className="btn btn-secondary flex items-center justify-center gap-2">
            <span>✨</span>
            <span>Generate Tests</span>
          </button>
          <button className="btn btn-secondary flex items-center justify-center gap-2">
            <span>📄</span>
            <span>Export PDF</span>
          </button>
          <button className="btn btn-secondary flex items-center justify-center gap-2">
            <span>📊</span>
            <span>View Metrics</span>
          </button>
        </div>
      </div>

      {/* Last update timestamp */}
      {stats?.timestamp && (
        <p className="text-sm text-gray-500 text-center">
          Last updated: {new Date(stats.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};
