/**
 * Project Entity - Types
 * Type definitions for Project entity
 */

export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string;
  team_members?: string[];
  status: ProjectStatus;
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
  created_date: string;
  updated_date: string;

  // Calculated metrics
  total_user_stories: number;
  total_test_cases: number;
  total_bugs: number;
  test_coverage: number;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  client?: string;
  team_members?: string[];
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  client?: string;
  team_members?: string[];
  status?: ProjectStatus;
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
}

export interface ProjectStats {
  project_id: string;
  project_name: string;
  total_user_stories: number;
  total_test_cases: number;
  total_bugs: number;
  stories_by_status: Record<string, number>;
  timestamp: string;
}
