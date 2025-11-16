/**
 * TypeScript interfaces for QA Flow API
 * Generated from Python Pydantic models
 */

// ==================== Enums ====================

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type Status =
  | 'Backlog'
  | 'To Do'
  | 'In Progress'
  | 'In Review'
  | 'Testing'
  | 'Done';

export type TestType =
  | 'Functional'
  | 'Integration'
  | 'UI'
  | 'API'
  | 'Regression'
  | 'Smoke'
  | 'End-to-End'
  | 'Performance'
  | 'Security'
  | 'Accessibility';

export type TestPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TestStatus =
  | 'Not Run'
  | 'Passed'
  | 'Failed'
  | 'Blocked'
  | 'Skipped';

export type BugSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type BugPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type BugStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Fixed'
  | 'Testing'
  | 'Verified'
  | 'Closed'
  | 'Reopened'
  | "Won't Fix"
  | 'Duplicate';

export type BugType =
  | 'Functional'
  | 'UI/UX'
  | 'Performance'
  | 'Security'
  | 'Compatibility'
  | 'Data'
  | 'API'
  | 'Crash';

// ==================== Models ====================

export interface AcceptanceCriteria {
  id?: string;
  description: string;
  completed: boolean;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: AcceptanceCriteria[];
  priority: Priority;
  status: Status;
  epic?: string;
  sprint?: string;
  story_points?: number;
  assigned_to?: string;
  created_date?: string;
  updated_date?: string;
  test_case_ids: string[];
  completion_percentage?: number;
}

export interface GherkinScenario {
  scenario_name: string;
  given_steps: string[];
  when_steps: string[];
  then_steps: string[];
  tags: string[];
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  user_story_id: string;
  test_type: TestType;
  priority: TestPriority;
  status: TestStatus;
  preconditions: string[];
  gherkin_scenarios: GherkinScenario[];
  estimated_time_minutes?: number;
  automated: boolean;
  created_date?: string;
  last_executed?: string;
  executed_by?: string;
  gherkin_file?: string;
}

export interface BugReport {
  id?: string;
  title: string;
  description: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  severity: BugSeverity;
  priority: BugPriority;
  bug_type: BugType;
  status: BugStatus;
  environment?: string;
  browser?: string;
  os?: string;
  version?: string;
  user_story_id?: string;
  test_case_id?: string;
  screenshots: string[];
  reported_by?: string;
  assigned_to?: string;
  reported_date?: string;
}

// ==================== API Response Types ====================

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

export interface AppInfoResponse {
  app: string;
  version: string;
  status: string;
}

export interface UploadResponse {
  message: string;
  user_stories: string[];  // Array of story IDs
  file_path: string;
  detected_columns: Record<string, string>;
}

export interface UserStoryListItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  completion_percentage: number;
}

export interface UserStoryDetail {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  epic?: string;
  sprint?: string;
  story_points?: number;
  completion_percentage: number;
}

export interface GenerateTestCasesResponse {
  message: string;
  test_case_id: string;
  gherkin_file: string;
  user_story_id: string;
}

export interface TestCaseListItem {
  id: string;
  title: string;
  user_story_id: string;
  test_type: string;
  status: string;
  gherkin_file: string;
}

export interface TestPlanResponse {
  message: string;
  files: {
    markdown?: string;
    pdf?: string;
  };
}

export interface BugTemplateResponse {
  message: string;
  file: string;
}

export interface CreateBugResponse {
  message: string;
  bug_id: string;
  document: string;
}

export interface DashboardStats {
  total_user_stories: number;
  total_test_cases: number;
  total_bugs: number;
  stories_by_status: Record<string, number>;
  timestamp: string;
}

// ==================== API Error ====================

export interface ApiError {
  detail: string;
}

// ==================== Form Types ====================

export interface UploadFileForm {
  file: File;
}

export interface GenerateTestsForm {
  story_id: string;
  use_ai: boolean;
  num_scenarios: number;
}

export interface GenerateTestPlanForm {
  project_name: string;
  format: 'markdown' | 'pdf' | 'both';
}

export interface CreateBugForm {
  title: string;
  description: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  severity: BugSeverity;
  priority: BugPriority;
  bug_type: BugType;
  environment?: string;
  browser?: string;
  os?: string;
  version?: string;
  user_story_id?: string;
  test_case_id?: string;
}
