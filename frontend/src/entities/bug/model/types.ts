/**
 * Bug Report Types
 * Types for bug reporting and tracking
 */

export type BugSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type BugPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type BugStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'FIXED'
  | 'TESTING'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REOPENED'
  | 'WONT_FIX'
  | 'DUPLICATE';

export type BugType =
  | 'FUNCTIONAL'
  | 'UI'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'COMPATIBILITY'
  | 'DATA'
  | 'API'
  | 'CRASH';

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
  execution_id?: number;

  // Assignment
  reported_by: string;
  assigned_to?: string;
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
