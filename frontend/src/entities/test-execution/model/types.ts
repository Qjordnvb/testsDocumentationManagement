/**
 * Test Execution Types
 * Types for test execution history and results
 */

export type TestStatus = 'NOT_RUN' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

export interface StepExecutionResult {
  step_index: number;
  keyword: string;
  text: string;
  status: TestStatus;
  actual_result?: string;
  evidence_file?: string;
  comment?: string;
}

export interface ExecutionSummary {
  execution_id: number;
  executed_by: string;
  execution_date: string;
  status: TestStatus;
  environment: string;
  version?: string;
  execution_time_minutes: number;
  passed_steps: number;
  failed_steps: number;
  total_steps: number;
  evidence_count: number;
  notes?: string;
}

export interface ExecutionDetails extends ExecutionSummary {
  test_case_id: string;
  step_results: StepExecutionResult[];
  evidence_files: string[];
  failure_reason?: string;
  bug_ids: string[];
}

export interface ExecutionHistoryResponse {
  test_case_id: string;
  test_case_title: string;
  executions: ExecutionSummary[];
  total: number;
}
