/**
 * Bug Report Entity - API
 * API functions for Bug Report operations
 */

import { api } from '@/shared/api/apiClient';
import type { BugReport, CreateBugReportDTO } from '../model/types';

export const bugApi = {
  getAll: async (): Promise<BugReport[]> => {
    const { data } = await api.get<{ bugs: BugReport[] }>('/bugs');
    return data.bugs;
  },

  getById: async (id: string): Promise<BugReport> => {
    const { data } = await api.get<BugReport>(`/bugs/${id}`);
    return data;
  },

  create: async (bug: CreateBugReportDTO): Promise<BugReport> => {
    const { data } = await api.post<BugReport>('/bugs', bug);
    return data;
  },

  update: async (id: string, updates: Partial<CreateBugReportDTO>): Promise<BugReport> => {
    const { data } = await api.put<BugReport>(`/bugs/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/bugs/${id}`);
  },
};
