/**
 * Test Case Entity - Store
 * Zustand store for managing test cases state
 */

import { create } from 'zustand';
import type { TestCase, TestCaseFilters } from './types';

interface TestCaseState {
  testCases: TestCase[];
  selectedTestCase: TestCase | null;
  isLoading: boolean;
  error: string | null;
  filters: TestCaseFilters;

  setTestCases: (testCases: TestCase[]) => void;
  addTestCase: (testCase: TestCase) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  setSelectedTestCase: (testCase: TestCase | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<TestCaseFilters>) => void;
  clearFilters: () => void;
  getFilteredTestCases: () => TestCase[];
}

export const useTestCaseStore = create<TestCaseState>((set, get) => ({
  testCases: [],
  selectedTestCase: null,
  isLoading: false,
  error: null,
  filters: {},

  setTestCases: (testCases) => set({ testCases, isLoading: false, error: null }),
  addTestCase: (testCase) => set((state) => ({
    testCases: [testCase, ...state.testCases]
  })),
  updateTestCase: (id, updates) => set((state) => ({
    testCases: state.testCases.map((tc) =>
      tc.id === id ? { ...tc, ...updates } : tc
    ),
  })),
  deleteTestCase: (id) => set((state) => ({
    testCases: state.testCases.filter((tc) => tc.id !== id),
  })),
  setSelectedTestCase: (testCase) => set({ selectedTestCase: testCase }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  clearFilters: () => set({ filters: {} }),

  getFilteredTestCases: () => {
    const { testCases, filters } = get();
    let filtered = [...testCases];

    if (filters.user_story_id) {
      filtered = filtered.filter((tc) => tc.user_story_id === filters.user_story_id);
    }

    if (filters.test_type && filters.test_type.length > 0) {
      filtered = filtered.filter((tc) => filters.test_type!.includes(tc.test_type));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((tc) =>
        tc.last_execution_status && filters.status!.includes(tc.last_execution_status)
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((tc) =>
        tc.title.toLowerCase().includes(search) ||
        tc.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  },
}));
