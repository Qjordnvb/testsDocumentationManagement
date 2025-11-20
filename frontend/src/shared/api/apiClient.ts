/**
 * API Service for QA Flow
 * Centralized Axios client with typed endpoints
 */

import axios, { AxiosError } from 'axios';
import type {
  AppInfoResponse,
  HealthCheckResponse,
  UploadResponse,
  UserStoryListItem,
  UserStoryDetail,
  GenerateTestCasesResponse,
  TestCaseListItem,
  TestPlanResponse,
  BugTemplateResponse,
  CreateBugResponse,
  DashboardStats,
  ApiError,
  BugReport,
} from '../types/api';

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for AI operations
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
);

// ==================== Health & Info ====================

export const apiService = {
  // Get app info
  getAppInfo: async (): Promise<AppInfoResponse> => {
    const { data } = await api.get<AppInfoResponse>('/');
    return data;
  },

  // Health check
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const { data } = await api.get<HealthCheckResponse>('/health');
    return data;
  },

  // ==================== User Stories ====================

  // Upload Excel/CSV file with user stories
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Get all user stories
  getUserStories: async (): Promise<UserStoryListItem[]> => {
    const { data } = await api.get<UserStoryListItem[]>('/user-stories');
    return data;
  },

  // Get specific user story
  getUserStory: async (storyId: string): Promise<UserStoryDetail> => {
    const { data } = await api.get<UserStoryDetail>(`/user-stories/${storyId}`);
    return data;
  },

  // ==================== Test Cases ====================

  // Generate test cases for a user story
  generateTestCases: async (
    storyId: string,
    useAi: boolean = true,
    numScenarios: number = 3
  ): Promise<GenerateTestCasesResponse> => {
    const { data } = await api.post<GenerateTestCasesResponse>(
      `/generate-test-cases/${storyId}`,
      null,
      {
        params: {
          use_ai: useAi,
          num_scenarios: numScenarios,
        },
      }
    );
    return data;
  },

  // Get all test cases
  getTestCases: async (): Promise<TestCaseListItem[]> => {
    const { data } = await api.get<TestCaseListItem[]>('/test-cases');
    return data;
  },

  // ==================== Test Plans ====================

  // Generate test plan
  generateTestPlan: async (
    projectName: string,
    format: 'markdown' | 'pdf' | 'both' = 'both'
  ): Promise<TestPlanResponse> => {
    const { data } = await api.post<TestPlanResponse>(
      '/generate-test-plan',
      null,
      {
        params: {
          project_name: projectName,
          format: format,
        },
      }
    );
    return data;
  },

  // ==================== Bug Reports ====================

  // Generate bug report template
  generateBugTemplate: async (): Promise<BugTemplateResponse> => {
    const { data } = await api.post<BugTemplateResponse>('/generate-bug-template');
    return data;
  },

  // Create bug report
  createBugReport: async (bug: BugReport): Promise<CreateBugResponse> => {
    const { data } = await api.post<CreateBugResponse>('/create-bug-report', bug);
    return data;
  },

  // ==================== Statistics ====================

  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/stats');
    return data;
  },


  // ==================== Test Execution (NUEVO - SPRINT 1) ====================

  // Guardar una ejecución de prueba
  createTestExecution: async (payload: any): Promise<any> => {
    const { data } = await api.post('/test-executions', payload);
    return data;
  },

  // Subir evidencia (screenshot/video)
  uploadEvidence: async (file: File, projectId: string, entityType: 'execution' | 'bug'): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    // Nota: Los params van en la URL o query params según tu backend endpoints/executions.py
    const { data } = await api.post('/upload-evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { project_id: projectId, entity_type: entityType }
    });
    return data;
  },

  // Get execution history for a test case
  getTestCaseExecutions: async (testCaseId: string, limit: number = 10): Promise<any> => {
    const { data } = await api.get(`/test-cases/${testCaseId}/executions`, {
      params: { limit }
    });
    return data;
  },

  // Get detailed execution information
  getExecutionDetails: async (executionId: number): Promise<any> => {
    const { data } = await api.get(`/test-executions/${executionId}`);
    return data;
  },

  // Get evidence file URL
  getEvidenceUrl: (filePath: string): string => {
    return `/api/v1/evidence/${filePath}`;
  },

  // ==================== File Downloads ====================

  // Download generated file
  downloadFile: async (filename: string): Promise<Blob> => {
    const { data } = await api.get(`/download/${filename}`, {
      responseType: 'blob',
    });
    return data;
  },

  // ==================== Reports ====================

  // Download Bug Summary Report (Word)
  downloadBugSummaryReport: async (projectId: string): Promise<Blob> => {
    const { data } = await api.get(`/projects/${projectId}/reports/bug-summary`, {
      responseType: 'blob',
    });
    return data;
  },

  // Download Test Execution Summary Report (Word)
  downloadTestExecutionSummary: async (projectId: string): Promise<Blob> => {
    const { data } = await api.get(`/projects/${projectId}/reports/test-execution-summary`, {
      responseType: 'blob',
    });
    return data;
  },

  // Generate and download Test Plan Document
  downloadTestPlan: async (projectId: string, format: 'pdf' | 'docx' = 'pdf'): Promise<Blob> => {
    const { data } = await api.post(
      `/generate-test-plan`,
      null,
      {
        params: { project_id: projectId, format },
        responseType: 'blob',
      }
    );
    return data;
  },
};

export default apiService;
