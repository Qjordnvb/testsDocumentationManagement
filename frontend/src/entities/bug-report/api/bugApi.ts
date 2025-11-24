/**
 * Bug Report Entity - API
 * API functions for Bug Report operations
 */

import { api } from '@/shared/api/apiClient';
import type { BugReport, CreateBugReportDTO } from '../model/types';

export const bugApi = {
  getAll: async (projectId?: string): Promise<BugReport[]> => {
    const params = projectId ? { project_id: projectId } : {};
    const { data } = await api.get<{ bugs: BugReport[] }>('/bugs', { params });
    return data.bugs;
  },

  getById: async (id: string, projectId: string): Promise<BugReport> => {
    const { data } = await api.get<BugReport>(`/bugs/${id}`, {
      params: { project_id: projectId }
    });
    return data;
  },

  create: async (bug: CreateBugReportDTO): Promise<BugReport> => {
    const { data } = await api.post<BugReport>('/bugs', bug);
    return data;
  },

  update: async (id: string, projectId: string, updates: Partial<CreateBugReportDTO>): Promise<BugReport> => {
    const { data } = await api.put<BugReport>(`/bugs/${id}`, updates, {
      params: { project_id: projectId }
    });
    return data;
  },

  delete: async (id: string, projectId: string): Promise<void> => {
    await api.delete(`/bugs/${id}`, {
      params: { project_id: projectId }
    });
  },
};
