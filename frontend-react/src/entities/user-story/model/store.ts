/**
 * User Story Entity - Store
 * Zustand store for managing user stories state
 */

import { create } from 'zustand';
import type { UserStory, UserStoryFilters, UserStorySort } from './types';

interface UserStoryState {
  // Data
  stories: UserStory[];
  selectedStory: UserStory | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Filters & Sort
  filters: UserStoryFilters;
  sort: UserStorySort;

  // Actions
  setStories: (stories: UserStory[]) => void;
  addStory: (story: UserStory) => void;
  updateStory: (id: string, updates: Partial<UserStory>) => void;
  deleteStory: (id: string) => void;

  setSelectedStory: (story: UserStory | null) => void;

  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  setFilters: (filters: Partial<UserStoryFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: UserStorySort) => void;

  // Computed
  getFilteredStories: () => UserStory[];
}

const defaultSort: UserStorySort = {
  field: 'created_at',
  direction: 'desc',
};

export const useUserStoryStore = create<UserStoryState>((set, get) => ({
  // Initial state
  stories: [],
  selectedStory: null,
  isLoading: false,
  error: null,
  filters: {},
  sort: defaultSort,

  // Actions
  setStories: (stories) => set({ stories, isLoading: false, error: null }),

  addStory: (story) => set((state) => ({
    stories: [story, ...state.stories]
  })),

  updateStory: (id, updates) => set((state) => ({
    stories: state.stories.map((story) =>
      story.id === id ? { ...story, ...updates } : story
    ),
    selectedStory: state.selectedStory?.id === id
      ? { ...state.selectedStory, ...updates }
      : state.selectedStory,
  })),

  deleteStory: (id) => set((state) => ({
    stories: state.stories.filter((story) => story.id !== id),
    selectedStory: state.selectedStory?.id === id ? null : state.selectedStory,
  })),

  setSelectedStory: (story) => set({ selectedStory: story }),

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),

  clearFilters: () => set({ filters: {} }),

  setSort: (sort) => set({ sort }),

  // Computed
  getFilteredStories: () => {
    const { stories, filters, sort } = get();

    let filtered = [...stories];

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((story) => filters.status!.includes(story.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((story) => filters.priority!.includes(story.priority));
    }

    if (filters.epic) {
      filtered = filtered.filter((story) => story.epic === filters.epic);
    }

    if (filters.sprint) {
      filtered = filtered.filter((story) => story.sprint === filters.sprint);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((story) =>
        story.title.toLowerCase().includes(search) ||
        story.description.toLowerCase().includes(search)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue === bValue) return 0;

      const comparison = aValue! < bValue! ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  },
}));
