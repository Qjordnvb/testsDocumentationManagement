import axios from 'axios';
import type { Bug, CreateBugDTO, UpdateBugDTO, BugFilters } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

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
  getById: async (bugId: string): Promise<Bug> => {
    const { data } = await api.get<Bug>(`/bugs/${bugId}`);
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
  update: async (bugId: string, updates: UpdateBugDTO): Promise<Bug> => {
    const { data } = await api.put<Bug>(`/bugs/${bugId}`, updates);
    return data;
  },

  /**
   * Delete a bug
   */
  delete: async (bugId: string): Promise<void> => {
    await api.delete(`/bugs/${bugId}`);
  },

  /**
   * Update bug status (convenience method)
   */
  updateStatus: async (bugId: string, status: Bug['status']): Promise<Bug> => {
    return bugApi.update(bugId, { status });
  },
};
