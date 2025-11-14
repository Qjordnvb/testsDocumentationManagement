/**
 * Zustand Global Store for QA Flow
 */

import { create } from 'zustand';
import type { DashboardStats } from '../types/api';

interface AppState {
  // Dashboard stats
  stats: DashboardStats | null;
  isLoadingStats: boolean;
  statsError: string | null;

  // Current project
  currentProject: string;

  // UI state
  sidebarCollapsed: boolean;

  // Actions
  setStats: (stats: DashboardStats) => void;
  setIsLoadingStats: (isLoading: boolean) => void;
  setStatsError: (error: string | null) => void;
  setCurrentProject: (project: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  stats: null,
  isLoadingStats: false,
  statsError: null,
  currentProject: 'QA Flow Project',
  sidebarCollapsed: false,

  // Actions
  setStats: (stats) => set({ stats, isLoadingStats: false, statsError: null }),

  setIsLoadingStats: (isLoading) => set({ isLoadingStats: isLoading }),

  setStatsError: (error) => set({ statsError: error, isLoadingStats: false }),

  setCurrentProject: (project) => set({ currentProject: project }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
