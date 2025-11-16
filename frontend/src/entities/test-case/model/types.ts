/**
 * Test Case Entity - Types
 * Domain model types for Test Cases
 */

export type TestType = 'Functional' | 'Integration' | 'E2E' | 'Performance' | 'Security' | 'Regression';
export type TestStatus = 'pending' | 'passed' | 'failed' | 'skipped';

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
  preconditions?: string;
  steps: TestStep[];
  expected_outcome: string;
  gherkin_scenario?: GherkinScenario;
  last_execution_status?: TestStatus;
  last_execution_date?: string;
  created_at?: string;
  updated_at?: string;
}

// DTO types
export interface CreateTestCaseDTO {
  title: string;
  description: string;
  user_story_id: string;
  test_type: TestType;
  preconditions?: string;
  steps: TestStep[];
  expected_outcome: string;
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
