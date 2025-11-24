/**
 * Types for Project Dashboard
 */

export interface CompanyAverages {
  coverage: number;
  bugs: number;
  stories: number;
  tests: number;
}

export interface ExecutiveMetrics {
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskMessage: string;
  qualityTrend: 'improving' | 'stable' | 'declining';
  testEfficiency: number;
}
