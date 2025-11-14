/**
 * User Story Entity - Types
 * Domain model types for User Stories
 */

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type Status = 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Testing' | 'Done';

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
  test_case_ids: string[];
  completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

// DTO types for creating/updating
export interface CreateUserStoryDTO {
  title: string;
  description: string;
  acceptance_criteria: AcceptanceCriteria[];
  priority: Priority;
  status: Status;
  epic?: string;
  sprint?: string;
  story_points?: number;
  assigned_to?: string;
}

export interface UpdateUserStoryDTO extends Partial<CreateUserStoryDTO> {
  id: string;
}

// Filter types
export interface UserStoryFilters {
  status?: Status[];
  priority?: Priority[];
  epic?: string;
  sprint?: string;
  search?: string;
}

// Sort types
export type UserStorySortField = 'title' | 'priority' | 'status' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface UserStorySort {
  field: UserStorySortField;
  direction: SortDirection;
}
