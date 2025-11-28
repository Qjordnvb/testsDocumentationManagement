export interface CoverageStats {
  total_stories: number;
  stories_with_tests: number;
  test_coverage_percent: number;
  stories_without_tests: Array<{
    id: string;
    title: string;
    priority: string;
    sprint?: string;
    status: string;
  }>;
  total_tests: number;
  executed_tests: number;
  execution_rate_percent: number;
  passed_tests: number;
  pass_rate_percent: number;
}
