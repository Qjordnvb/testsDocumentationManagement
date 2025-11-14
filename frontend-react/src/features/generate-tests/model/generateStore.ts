/**
 * Generate Tests Feature - State Management
 * Zustand store for test generation state
 */

import { create } from 'zustand';
import type { TestCase } from '@/entities/test-case';

interface GenerateState {
  // Generation state
  isGenerating: boolean;
  generationError: string | null;
  generatedTests: TestCase[];

  // Configuration
  useAi: boolean;
  numScenarios: number;

  // Actions
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | null) => void;
  setGeneratedTests: (tests: TestCase[]) => void;
  setUseAi: (useAi: boolean) => void;
  setNumScenarios: (num: number) => void;
  resetGeneration: () => void;
}

export const useGenerateStore = create<GenerateState>((set) => ({
  // Initial state
  isGenerating: false,
  generationError: null,
  generatedTests: [],
  useAi: true,
  numScenarios: 3,

  // Actions
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setGenerationError: (error) =>
    set({ generationError: error, isGenerating: false }),

  setGeneratedTests: (tests) =>
    set({ generatedTests: tests, isGenerating: false, generationError: null }),

  setUseAi: (useAi) => set({ useAi }),

  setNumScenarios: (num) => set({ numScenarios: num }),

  resetGeneration: () =>
    set({
      isGenerating: false,
      generationError: null,
      generatedTests: [],
    }),
}));
