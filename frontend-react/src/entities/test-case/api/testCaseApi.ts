/**
 * Test Case Entity - API
 * API functions for Test Case operations
 */

import axios from 'axios';
import type { TestCase, CreateTestCaseDTO, TestExecution } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const testCaseApi = {
  getAll: async (): Promise<TestCase[]> => {
    const { data } = await api.get<{ test_cases: TestCase[] }>('/test-cases');
    return data.test_cases;
  },

  getById: async (id: string): Promise<TestCase> => {
    const { data } = await api.get<TestCase>(`/test-cases/${id}`);
    return data;
  },

  getByStoryId: async (storyId: string): Promise<TestCase[]> => {
    const { data } = await api.get<{ test_cases: TestCase[] }>(`/user-stories/${storyId}/test-cases`);
    return data.test_cases;
  },

  create: async (testCase: CreateTestCaseDTO): Promise<TestCase> => {
    const { data } = await api.post<TestCase>('/test-cases', testCase);
    return data;
  },

  update: async (id: string, updates: Partial<CreateTestCaseDTO>): Promise<TestCase> => {
    const { data } = await api.put<TestCase>(`/test-cases/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/test-cases/${id}`);
  },

  executeTest: async (execution: TestExecution): Promise<void> => {
    await api.post('/test-executions', execution);
  },

  generateTestCases: async (
    storyId: string,
    useAi = true,
    numScenarios = 3
  ): Promise<TestCase[]> => {
    const { data } = await api.post<{ test_cases: TestCase[] }>(
      `/generate-test-cases/${storyId}`,
      null,
      { params: { use_ai: useAi, num_scenarios: numScenarios } }
    );
    return data.test_cases;
  },

  getGherkinContent: async (id: string): Promise<string> => {
    const { data } = await api.get<{ gherkin_content: string }>(`/test-cases/${id}/gherkin`);
    return data.gherkin_content;
  },

  updateGherkinContent: async (id: string, content: string): Promise<void> => {
    await api.put(`/test-cases/${id}/gherkin`, { gherkin_content: content });
  },
};
