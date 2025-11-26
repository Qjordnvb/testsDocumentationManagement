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

  /**
   * Count bugs associated with a specific test case
   * Used before test case deletion to warn user about CASCADE delete
   */
  countByTestCase: async (testCaseId: string, projectId: string): Promise<number> => {
    const { data } = await api.get<{ test_case_id: string; project_id: string; bug_count: number }>(
      `/bugs/count-by-test-case/${testCaseId}`,
      { params: { project_id: projectId } }
    );
    return data.bug_count;
  },

  /**
   * Mark bug as In Progress (DEV workflow)
   */
  markAsInProgress: async (bugId: string, projectId: string): Promise<Bug> => {
    return bugApi.updateStatus(bugId, projectId, 'In Progress');
  },

  /**
   * Mark bug as Fixed with fix documentation (DEV workflow)
   * Supports optional file uploads for evidence
   */
  markAsFixed: async (
    bugId: string,
    projectId: string,
    fixData: {
      fix_description: string;
      root_cause?: string;
      workaround?: string;
      evidence_files?: File[];
    }
  ): Promise<Bug> => {
    // If there are files, use FormData
    if (fixData.evidence_files && fixData.evidence_files.length > 0) {
      const formData = new FormData();
      formData.append('fix_description', fixData.fix_description);

      if (fixData.root_cause) {
        formData.append('root_cause', fixData.root_cause);
      }

      if (fixData.workaround) {
        formData.append('workaround', fixData.workaround);
      }

      // Append each file
      fixData.evidence_files.forEach((file) => {
        formData.append('evidence_files', file);
      });

      const { data } = await api.patch<Bug>(
        `/bugs/${bugId}/mark-fixed`,
        formData,
        {
          params: { project_id: projectId },
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return data;
    } else {
      // No files - send as JSON
      const { data } = await api.patch<Bug>(
        `/bugs/${bugId}/mark-fixed`,
        {
          fix_description: fixData.fix_description,
          root_cause: fixData.root_cause,
          workaround: fixData.workaround,
        },
        { params: { project_id: projectId } }
      );
      return data;
    }
  },

  /**
   * Verify bug fix (QA workflow)
   */
  verifyFix: async (bugId: string, projectId: string): Promise<Bug> => {
    const { data } = await api.patch<Bug>(
      `/bugs/${bugId}/verify-fix`,
      {},
      { params: { project_id: projectId } }
    );
    return data;
  },

  /**
   * Reopen bug (QA workflow)
   */
  reopenBug: async (bugId: string, projectId: string, reason: string): Promise<Bug> => {
    const { data } = await api.patch<Bug>(
      `/bugs/${bugId}/reopen`,
      { reason },
      { params: { project_id: projectId } }
    );
    return data;
  },

  /**
   * Close bug (MANAGER/ADMIN workflow)
   */
  closeBug: async (bugId: string, projectId: string): Promise<Bug> => {
    return bugApi.updateStatus(bugId, projectId, 'Closed');
  },
};
