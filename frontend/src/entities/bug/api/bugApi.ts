import { api } from '@/shared/api/apiClient';
import type { Bug, CreateBugDTO, UpdateBugDTO, BugFilters, GroupedBugsResponse } from '../model/types';

export const bugApi = {
  /**
   * Get all bugs for a project with optional filters
   */
  getAll: async (filters: BugFilters): Promise<Bug[]> => {
    const params = new URLSearchParams();
    params.append('project_id', filters.project_id);

    if (filters.severity) params.append('severity', filters.severity);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.status) params.append('status', filters.status);
    if (filters.bug_type) params.append('bug_type', filters.bug_type);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters.reported_by) params.append('reported_by', filters.reported_by);

    const { data } = await api.get<{ bugs: Bug[] }>(`/bugs?${params.toString()}`);
    return data.bugs;
  },

  /**
   * Get a specific bug by ID
   */
  getById: async (bugId: string, projectId: string): Promise<Bug> => {
    const { data } = await api.get<Bug>(`/bugs/${bugId}`, {
      params: { project_id: projectId }
    });
    return data;
  },

  /**
   * Create a new bug report
   */
  create: async (bugData: CreateBugDTO): Promise<Bug> => {
    const { data } = await api.post<Bug>('/bugs', bugData);
    return data;
  },

  /**
   * Update an existing bug
   */
  update: async (bugId: string, projectId: string, updates: UpdateBugDTO): Promise<Bug> => {
    const { data } = await api.put<Bug>(`/bugs/${bugId}`, updates, {
      params: { project_id: projectId }
    });
    return data;
  },

  /**
   * Delete a bug
   */
  delete: async (bugId: string, projectId: string): Promise<void> => {
    await api.delete(`/bugs/${bugId}`, {
      params: { project_id: projectId }
    });
  },

  /**
   * Update bug status (convenience method)
   */
  updateStatus: async (bugId: string, projectId: string, status: Bug['status']): Promise<Bug> => {
    return bugApi.update(bugId, projectId, { status });
  },

  /**
   * Dev-restricted update: only status, fix_description, screenshots
   */
  devUpdate: async (bugId: string, projectId: string, updates: { status?: Bug['status']; fix_description?: string; screenshots?: string[] }): Promise<Bug> => {
    const { data } = await api.patch<Bug>(`/bugs/${bugId}/dev-update`, updates, {
      params: { project_id: projectId }
    });
    return data;
  },

  /**
   * Get bugs grouped by test case and scenario
   */
  getGrouped: async (projectId: string): Promise<GroupedBugsResponse> => {
    const { data } = await api.get<GroupedBugsResponse>(`/bugs/grouped?project_id=${projectId}`);
    return data;
  },
};
