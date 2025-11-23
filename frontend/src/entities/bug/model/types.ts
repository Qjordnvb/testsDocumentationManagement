/**
 * Bug Report Types
 * Types for bug reporting and tracking
 */

// Match backend Pydantic enum VALUES (not keys)
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

export interface Bug {
  id: string;
  title: string;
  description: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  severity: BugSeverity;
  priority: BugPriority;
  bug_type: BugType;
  status: BugStatus;

  // Context
  environment: string;
  browser?: string;
  os?: string;
  version?: string;

  // Relationships
  project_id: string;
  user_story_id?: string;
  test_case_id?: string;
  scenario_name?: string;
  execution_id?: number;

  // Assignment
  reported_by: string;
  assigned_to?: string;
  verified_by?: string;

  // Dates
  reported_date: string;
  assigned_date?: string;
  fixed_date?: string;
  verified_date?: string;
  closed_date?: string;

  // Files
  document_path?: string;
  attachments?: string[];

  // Fix Documentation (for DEV)
  fix_description?: string;

  // External
  notion_page_id?: string;
  azure_bug_id?: string;
}

export interface CreateBugDTO {
  title: string;
  description: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  severity: BugSeverity;
  priority: BugPriority;
  bug_type: BugType;

  // Context
  environment: string;
  browser?: string;
  os?: string;
  version?: string;

  // Relationships
  project_id: string;
  user_story_id?: string;
  test_case_id?: string;
  scenario_name?: string;
  execution_id?: number;

  // Assignment
  reported_by: string;
  assigned_to?: string;

  // Evidence
  screenshots?: string[];
}

export interface UpdateBugDTO {
  title?: string;
  description?: string;
  steps_to_reproduce?: string[];
  expected_behavior?: string;
  actual_behavior?: string;
  severity?: BugSeverity;
  priority?: BugPriority;
  bug_type?: BugType;
  status?: BugStatus;

  // Context fields
  environment?: string;
  browser?: string;
  os?: string;
  version?: string;

  // Assignment
  assigned_to?: string;
  verified_by?: string;
}

export interface BugFilters {
  project_id: string;
  severity?: BugSeverity;
  priority?: BugPriority;
  status?: BugStatus;
  bug_type?: BugType;
  assigned_to?: string;
  reported_by?: string;
}

export interface ScenarioGroup {
  scenario_name: string;
  bug_count: number;
  bugs: Bug[];
}

export interface TestCaseGroup {
  test_case_id: string;
  test_case_title: string;
  total_bugs: number;
  scenarios: ScenarioGroup[];
}

export interface GroupedBugsResponse {
  grouped_bugs: TestCaseGroup[];
}
