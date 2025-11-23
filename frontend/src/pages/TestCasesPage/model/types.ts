/**
 * Types for Test Cases Page
 */

import type { TestCase } from '@/entities/test-case';
import type { UserStory } from '@/entities/user-story';

export interface TestSuite {
  userStory: UserStory | null;
  userStoryId: string;
  testCases: TestCase[];
}

export interface TestCaseFilters {
  searchQuery: string;
  selectedTestType: string;
  selectedStatus: string;
  selectedPriority: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}
