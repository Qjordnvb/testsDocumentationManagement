/**
 * Bug Report Entity - Store
 * Zustand store for managing bug reports state
 */

import { create } from 'zustand';
import type { BugReport, BugReportFilters } from './types';

interface BugReportState {
  bugs: BugReport[];
  selectedBug: BugReport | null;
  isLoading: boolean;
  error: string | null;
  filters: BugReportFilters;

  setBugs: (bugs: BugReport[]) => void;
  addBug: (bug: BugReport) => void;
  updateBug: (id: string, updates: Partial<BugReport>) => void;
  deleteBug: (id: string) => void;
  setSelectedBug: (bug: BugReport | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<BugReportFilters>) => void;
  clearFilters: () => void;
  getFilteredBugs: () => BugReport[];
}

export const useBugReportStore = create<BugReportState>((set, get) => ({
  bugs: [],
  selectedBug: null,
  isLoading: false,
  error: null,
  filters: {},

  setBugs: (bugs) => set({ bugs, isLoading: false, error: null }),
  addBug: (bug) => set((state) => ({ bugs: [bug, ...state.bugs] })),
  updateBug: (id, updates) => set((state) => ({
    bugs: state.bugs.map((bug) => (bug.id === id ? { ...bug, ...updates } : bug)),
  })),
  deleteBug: (id) => set((state) => ({
    bugs: state.bugs.filter((bug) => bug.id !== id),
  })),
  setSelectedBug: (bug) => set({ selectedBug: bug }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  clearFilters: () => set({ filters: {} }),

  getFilteredBugs: () => {
    const { bugs, filters } = get();
    let filtered = [...bugs];

    if (filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter((bug) => filters.severity!.includes(bug.severity));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((bug) => filters.status!.includes(bug.status));
    }

    if (filters.user_story_id) {
      filtered = filtered.filter((bug) => bug.user_story_id === filters.user_story_id);
    }

    if (filters.test_case_id) {
      filtered = filtered.filter((bug) => bug.test_case_id === filters.test_case_id);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((bug) =>
        bug.title.toLowerCase().includes(search) ||
        bug.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  },
}));
