/**
 * Types for Manager Dashboard
 */

export interface GlobalStats {
  totalProjects: number;
  activeProjects: number;
  totalStories: number;
  totalTests: number;
  totalBugs: number;
  avgCoverage: number;
}

export interface FilterState {
  showOnlyActive: boolean;
  showOnlyAtRisk: boolean;
  searchQuery: string;
}

export type BreakdownType = 'stories' | 'tests' | 'bugs' | null;
