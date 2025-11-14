/**
 * Bug Report Entity - Types
 * Domain model types for Bug Reports
 */

export type BugSeverity = 'Critical' | 'Major' | 'Minor' | 'Trivial';
export type BugStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  user_story_id?: string;
  test_case_id?: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  environment?: string;
  reported_by?: string;
  assigned_to?: string;
  attachments?: string[];
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
}

// DTO types
export interface CreateBugReportDTO {
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  user_story_id?: string;
  test_case_id?: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  environment?: string;
  reported_by?: string;
  assigned_to?: string;
}

export interface UpdateBugReportDTO extends Partial<CreateBugReportDTO> {
  id: string;
}

// Filter types
export interface BugReportFilters {
  severity?: BugSeverity[];
  status?: BugStatus[];
  user_story_id?: string;
  test_case_id?: string;
  search?: string;
}
