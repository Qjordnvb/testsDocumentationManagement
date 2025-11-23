/**
 * Project calculations and metrics
 * Pure functions for project health, risk assessment, and quality metrics
 */

import type { Project, ProjectStats } from '../model/types';

/**
 * Calculate project health score (0-100)
 * Formula: 40% coverage + 30% bug ratio + 30% test execution rate
 */
export const calculateHealthScore = (project: {
  test_coverage: number;
  total_bugs: number;
  total_user_stories: number;
  total_test_cases: number;
}): number => {
  const coverageScore = (project.test_coverage / 100) * 40;
  const bugScore = Math.max(
    0,
    (1 - project.total_bugs / (project.total_user_stories || 1)) * 30
  );
  const testScore = Math.max(
    0,
    ((project.total_test_cases / (project.total_user_stories || 1)) / 3) * 30
  );
  return Math.min(100, coverageScore + bugScore + testScore);
};

/**
 * Calculate health score from project stats
 */
export const calculateHealthScoreFromStats = (
  stats: ProjectStats,
  coverage: number
): number => {
  const coverageScore = (coverage / 100) * 40;
  const bugScore = Math.max(
    0,
    (1 - stats.total_bugs / (stats.total_user_stories || 1)) * 30
  );
  const testScore = Math.max(
    0,
    ((stats.total_test_cases / (stats.total_user_stories || 1)) / 3) * 30
  );
  return Math.min(100, coverageScore + bugScore + testScore);
};

/**
 * Risk level assessment
 */
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskAssessment {
  level: RiskLevel;
  message: string;
  factors: string[];
}

export const assessRiskLevel = (project: {
  test_coverage: number;
  total_bugs: number;
  total_user_stories: number;
  total_test_cases: number;
}): RiskAssessment => {
  const criticalFactors: string[] = [];

  if (project.test_coverage < 50) {
    criticalFactors.push('cobertura baja');
  }
  if (project.total_bugs > project.total_user_stories * 0.3) {
    criticalFactors.push('alto número de bugs');
  }
  if (project.total_test_cases < project.total_user_stories) {
    criticalFactors.push('pocos test cases');
  }

  if (criticalFactors.length >= 2) {
    return {
      level: 'high',
      message: criticalFactors.join(', '),
      factors: criticalFactors,
    };
  }
  if (criticalFactors.length === 1) {
    return {
      level: 'medium',
      message: criticalFactors[0],
      factors: criticalFactors,
    };
  }
  return {
    level: 'low',
    message: 'Proyecto saludable',
    factors: [],
  };
};

/**
 * Quality trend analysis
 */
export type QualityTrend = 'improving' | 'stable' | 'declining';

export const analyzeQualityTrend = (
  currentCoverage: number,
  avgCoverage: number,
  currentBugRatio: number,
  avgBugRatio: number
): QualityTrend => {
  const coverageDiff = currentCoverage - avgCoverage;
  const bugDiff = currentBugRatio - avgBugRatio;

  if (coverageDiff > 10 && bugDiff < -0.1) return 'improving';
  if (coverageDiff < -10 || bugDiff > 0.2) return 'declining';
  return 'stable';
};

/**
 * Test efficiency calculation
 */
export const calculateTestEfficiency = (
  totalTestCases: number,
  totalUserStories: number
): number => {
  if (totalUserStories === 0) return 0;
  return (totalTestCases / totalUserStories) * 100;
};

/**
 * Company average calculations
 */
export interface CompanyAverages {
  coverage: number;
  bugs: number;
  stories: number;
  tests: number;
  healthScore: number;
}

export const calculateCompanyAverages = (projects: Project[]): CompanyAverages => {
  if (projects.length === 0) {
    return { coverage: 0, bugs: 0, stories: 0, tests: 0, healthScore: 0 };
  }

  const totalCoverage = projects.reduce((sum, p) => sum + p.test_coverage, 0);
  const totalBugs = projects.reduce((sum, p) => sum + p.total_bugs, 0);
  const totalStories = projects.reduce((sum, p) => sum + p.total_user_stories, 0);
  const totalTests = projects.reduce((sum, p) => sum + p.total_test_cases, 0);
  const totalHealth = projects.reduce((sum, p) => sum + calculateHealthScore(p), 0);

  return {
    coverage: totalCoverage / projects.length,
    bugs: totalBugs / projects.length,
    stories: totalStories / projects.length,
    tests: totalTests / projects.length,
    healthScore: totalHealth / projects.length,
  };
};

/**
 * Comparison indicator for metrics
 */
export interface ComparisonIndicator {
  diff: number;
  percentage: number;
  isGood: boolean;
  direction: 'up' | 'down' | 'neutral';
}

export const getComparisonIndicator = (
  current: number,
  average: number,
  lowerIsBetter: boolean = false
): ComparisonIndicator => {
  const diff = current - average;
  const percentage = average > 0 ? (diff / average) * 100 : 0;
  const isGood = lowerIsBetter ? diff < 0 : diff > 0;

  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (Math.abs(diff) > 0.01) {
    direction = diff > 0 ? 'up' : 'down';
  }

  return {
    diff: Math.abs(diff),
    percentage: Math.abs(percentage),
    isGood,
    direction,
  };
};

/**
 * Filter projects at risk
 */
export const getProjectsAtRisk = (projects: Project[]): Project[] => {
  return projects.filter((project) => {
    const risk = assessRiskLevel(project);
    return risk.level === 'high' || risk.level === 'medium';
  });
};

/**
 * Get top performing projects by health score
 */
export const getTopProjects = (projects: Project[], limit: number = 3): Project[] => {
  return [...projects]
    .sort((a, b) => calculateHealthScore(b) - calculateHealthScore(a))
    .slice(0, limit);
};

/**
 * Filter active projects
 */
export const getActiveProjects = (projects: Project[]): Project[] => {
  return projects.filter((p) => p.status === 'active');
};
