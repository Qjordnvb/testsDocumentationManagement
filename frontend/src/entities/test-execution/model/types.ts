/**
 * Test Execution Types
 * Types for test execution history and results
 *
 * IMPORTANT: These types must match backend Pydantic models exactly
 * to ensure validation succeeds.
 */

export type TestStatus = 'NOT_RUN' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

/**
 * Gherkin keyword types - must match backend Literal type
 */
export type GherkinKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';

/**
 * Step execution result with strict validation
 * CRITICAL: scenario_name is REQUIRED (not optional) to prevent crashes in reports
 */
export interface StepExecutionResult {
  step_index: number;  // Must be >= 0 and unique within execution
  keyword: GherkinKeyword;  // Strict literal type
  text: string;  // Cannot be empty
  status: TestStatus;
  scenario_name: string;  // REQUIRED - used for grouping in reports
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
  bug_ids?: string[];  // Associated bug IDs
}

export interface ExecutionDetails extends ExecutionSummary {
  test_case_id: string;
  step_results: StepExecutionResult[];  // Must have at least 1 item
  evidence_files?: string[];  // Optional
  failure_reason?: string;
  bug_ids?: string[];  // Optional
}

/**
 * Request payload for creating a test execution
 * Used when sending data to POST /test-executions
 */
export interface CreateExecutionRequest {
  test_case_id: string;
  executed_by: string;
  status: TestStatus;
  environment?: string;
  version?: string;
  execution_time_seconds: number;  // Backend expects seconds, not minutes
  step_results: StepExecutionResult[];  // Min 1 item
  notes?: string;
  failure_reason?: string;
  evidence_files?: string[];
  bug_ids?: string[];
}

export interface ExecutionHistoryResponse {
  test_case_id: string;
  test_case_title: string;
  executions: ExecutionSummary[];
  total: number;
}
