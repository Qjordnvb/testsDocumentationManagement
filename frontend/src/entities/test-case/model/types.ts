/**
 * Test Case Entity - Types
 * Domain model types for Test Cases
 */

export type TestType = 'FUNCTIONAL' | 'INTEGRATION' | 'UI' | 'API' | 'E2E' | 'PERFORMANCE' | 'SECURITY' | 'REGRESSION' | 'SMOKE' | 'ACCESSIBILITY';
export type TestStatus = 'NOT_RUN' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

export interface TestStep {
  step_number: number;
  action: string;
  expected_result: string;
  actual_result?: string;
  status?: TestStatus;
}

export interface GherkinScenario {
  scenario_name: string;
  given: string[];
  when: string[];
  then: string[];
  tags?: string[];
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  user_story_id: string;
  test_type: TestType;
  priority?: string;
  status?: string;
  preconditions?: string;
  steps: TestStep[];
  expected_outcome: string;
  gherkin_scenario?: GherkinScenario;
  gherkin_file_path?: string;
  last_execution_status?: TestStatus;
  last_execution_date?: string;
  created_at?: string;
  created_date?: string;
  updated_at?: string;
}

// DTO types
export interface CreateTestCaseDTO {
  title: string;
  description: string;
  user_story_id: string;
  test_type: TestType;
  priority?: string;
  status?: string;
  preconditions?: string;
  steps?: TestStep[];
  expected_outcome?: string;
  gherkin_scenario?: GherkinScenario;
}

export interface UpdateTestCaseDTO extends Partial<CreateTestCaseDTO> {
  id: string;
}

// Execution types
export interface TestExecution {
  test_case_id: string;
  status: TestStatus;
  executed_by?: string;
  notes?: string;
  execution_date: string;
}

// Filter types
export interface TestCaseFilters {
  user_story_id?: string;
  test_type?: TestType[];
  status?: TestStatus[];
  search?: string;
}
