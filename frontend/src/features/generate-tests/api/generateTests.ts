/**
 * Generate Tests Feature - API
 * API functions for test generation
 */

import axios from 'axios';
import { testCaseApi } from '@/entities/test-case';
import type { TestCase } from '@/entities/test-case';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s for AI generation
});

export interface GenerateTestsParams {
  storyId: string;
  useAi?: boolean;
  numScenarios?: number;
}

export interface PreviewTestsParams {
  storyId: string;
  numTestCases?: number;
  scenariosPerTest?: number;
  testTypes?: string[];
  useAi?: boolean;
}

export interface SuggestedTestCase {
  suggested_id: string;
  title: string;
  description: string;
  test_type: string;
  priority: string;
  status: string;
  scenarios_count: number;
  gherkin_content?: string;
  can_edit: boolean;
  can_delete: boolean;
}

export interface PreviewResponse {
  user_story_id: string;
  user_story_title: string;
  suggested_test_cases: SuggestedTestCase[];
  total_suggested: number;
  can_edit_before_save: boolean;
  can_add_more: boolean;
}

export interface BatchCreateParams {
  test_cases: Array<{
    id?: string;
    title: string;
    description: string;
    user_story_id: string;
    test_type: string;
    priority: string;
    status: string;
    gherkin_content?: string;
  }>;
}

/**
 * Preview test cases (does NOT save to database)
 * QA will review before saving
 */
export const previewTests = async ({
  storyId,
  numTestCases = 5,
  scenariosPerTest = 3,
  testTypes = ['FUNCTIONAL', 'UI'],
  useAi = true,
}: PreviewTestsParams): Promise<PreviewResponse> => {
  const params = new URLSearchParams({
    num_test_cases: numTestCases.toString(),
    scenarios_per_test: scenariosPerTest.toString(),
    use_ai: useAi.toString(),
  });

  // Add test types as multiple query params
  testTypes.forEach(type => params.append('test_types', type));

  const { data } = await api.post<PreviewResponse>(
    `/generate-test-cases/${storyId}/preview?${params.toString()}`
  );

  return data;
};

/**
 * Create multiple test cases at once (after QA review)
 */
export const batchCreateTestCases = async (
  params: BatchCreateParams
): Promise<{ created_count: number; test_cases: TestCase[] }> => {
  const { data } = await api.post('/test-cases/batch', params);
  return data;
};

/**
 * Generates test cases for a user story using AI (OLD - direct save)
 * Use previewTests + batchCreateTestCases for new workflow
 */
export const generateTests = async ({
  storyId,
  useAi = true,
  numScenarios = 3,
}: GenerateTestsParams): Promise<TestCase[]> => {
  return await testCaseApi.generateTestCases(storyId, useAi, numScenarios);
};
