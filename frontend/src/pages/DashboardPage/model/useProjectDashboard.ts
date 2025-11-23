/**
 * Project Dashboard business logic
 * Manages project stats, executive metrics, and company comparisons
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import {
  calculateHealthScoreFromStats,
  analyzeQualityTrend,
  calculateTestEfficiency,
  calculateCompanyAverages,
} from '@/entities/project';
import { useProjects, useProjectStats } from '@/shared/hooks';
import type { CompanyAverages, ExecutiveMetrics } from './types';

export const useProjectDashboard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const { hasRole } = useAuth();
  const isManager = hasRole('manager');

  // Fetch project stats
  const { stats, loading: isLoadingStats, error: statsError, reload } = useProjectStats(projectId);

  // Manager: Load all projects for comparison
  const { projects: allProjects } = useProjects({
    autoLoad: isManager,
  });

  // Upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Validate project
  useEffect(() => {
    if (!projectId) {
      navigate('/');
      toast.error('No se especificó un proyecto');
    }
  }, [projectId, navigate]);

  // Get coverage from backend
  const coverage = stats ? stats.test_coverage : 0;

  // Company averages for manager
  const companyAvg: CompanyAverages = useMemo(() => {
    if (!isManager || allProjects.length === 0) {
      return { coverage: 0, bugs: 0, stories: 0, tests: 0 };
    }

    const avg = calculateCompanyAverages(allProjects);
    return {
      coverage: avg.coverage,
      bugs: avg.bugs,
      stories: avg.stories,
      tests: avg.tests,
    };
  }, [isManager, allProjects]);

  // Manager Executive Metrics
  const executiveMetrics: ExecutiveMetrics = useMemo(() => {
    if (!stats) {
      return {
        healthScore: 0,
        riskLevel: 'low',
        riskMessage: 'No data',
        qualityTrend: 'stable',
        testEfficiency: 0,
      };
    }

    // Health Score
    const healthScore = calculateHealthScoreFromStats(stats, coverage);

    // Risk Level
    const criticalFactors: string[] = [];
    if (coverage < 50) criticalFactors.push('cobertura baja');
    if (stats.total_bugs > stats.total_user_stories * 0.3)
      criticalFactors.push('alto número de bugs');
    if (stats.total_test_cases < stats.total_user_stories)
      criticalFactors.push('pocos test cases');

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskMessage = 'Proyecto saludable';
    if (criticalFactors.length >= 2) {
      riskLevel = 'high';
      riskMessage = criticalFactors.join(', ');
    } else if (criticalFactors.length === 1) {
      riskLevel = 'medium';
      riskMessage = criticalFactors[0];
    }

    // Quality Trend
    const currentBugRatio =
      stats.total_bugs / (stats.total_user_stories || 1);
    const avgBugRatio = companyAvg.bugs / (companyAvg.stories || 1);
    const qualityTrend = analyzeQualityTrend(
      coverage,
      companyAvg.coverage,
      currentBugRatio,
      avgBugRatio
    );

    // Test Efficiency
    const testEfficiency = calculateTestEfficiency(
      stats.total_test_cases,
      stats.total_user_stories
    );

    return {
      healthScore,
      riskLevel,
      riskMessage,
      qualityTrend,
      testEfficiency,
    };
  }, [stats, coverage, companyAvg]);

  // Handle upload success
  const handleUploadSuccess = async () => {
    if (projectId) {
      await reload();
      toast.success('Datos actualizados correctamente');
    }
  };

  // Download reports
  const handleDownloadBugSummary = async () => {
    if (!projectId) return;

    try {
      toast.loading('Generating Bug Summary Report...');
      const response = await fetch(`/api/v1/projects/${projectId}/reports/bug-summary`);

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bug_Summary_${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Error downloading report');
    }
  };

  return {
    // Project data
    projectId,
    currentProject,
    stats,
    isLoadingStats,
    statsError,
    coverage,

    // Manager data
    isManager,
    companyAvg,
    executiveMetrics,

    // Upload modal
    uploadModalOpen,
    setUploadModalOpen,

    // Actions
    handleUploadSuccess,
    handleDownloadBugSummary,
    navigate,
  };
};
