/**
 * Generate Tests Feature - API
 * API functions for test generation
 */

import { testCaseApi } from '@/entities/test-case';
import type { TestCase } from '@/entities/test-case';

export interface GenerateTestsParams {
  storyId: string;
  useAi?: boolean;
  numScenarios?: number;
}

/**
 * Generates test cases for a user story using AI
 */
export const generateTests = async ({
  storyId,
  useAi = true,
  numScenarios = 3,
}: GenerateTestsParams): Promise<TestCase[]> => {
  return await testCaseApi.generateTestCases(storyId, useAi, numScenarios);
};
