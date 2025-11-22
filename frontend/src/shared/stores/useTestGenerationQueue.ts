/**
 * Test Generation Queue Store
 * Manages background test generation jobs with Celery
 */

import { create } from 'zustand';

export type JobStatus = 'queued' | 'pending' | 'generating' | 'completed' | 'failed';

export interface TestGenerationJob {
  taskId: string;
  storyId: string;
  storyTitle?: string;
  status: JobStatus;
  progress: number;
  message?: string;
  queuedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

interface TestGenerationQueueState {
  // Data
  jobs: Record<string, TestGenerationJob>; // taskId -> job
  activePolling: Set<string>; // Set of taskIds being polled
  onTestCasesSaved?: () => void; // Callback when test cases are saved

  // Actions
  addJob: (job: TestGenerationJob) => void;
  updateJob: (taskId: string, updates: Partial<TestGenerationJob>) => void;
  removeJob: (taskId: string) => void;
  clearCompletedJobs: () => void;
  setOnTestCasesSaved: (callback: () => void) => void;
  notifyTestCasesSaved: () => void;

  // Polling management
  startPolling: (taskId: string) => void;
  stopPolling: (taskId: string) => void;
  isPolling: (taskId: string) => boolean;

  // Computed
  getJobsByStory: (storyId: string) => TestGenerationJob[];
  getActiveJobs: () => TestGenerationJob[];
  getCompletedJobs: () => TestGenerationJob[];
  getJobByTaskId: (taskId: string) => TestGenerationJob | undefined;
  hasActiveJob: (storyId: string) => boolean;
  getActiveJobForStory: (storyId: string) => TestGenerationJob | undefined;
}

export const useTestGenerationQueue = create<TestGenerationQueueState>((set, get) => ({
  // Initial state
  jobs: {},
  activePolling: new Set(),

  // Actions
  addJob: (job) => set((state) => ({
    jobs: {
      ...state.jobs,
      [job.taskId]: job,
    },
  })),

  updateJob: (taskId, updates) => set((state) => {
    const existingJob = state.jobs[taskId];
    if (!existingJob) return state;

    return {
      jobs: {
        ...state.jobs,
        [taskId]: {
          ...existingJob,
          ...updates,
        },
      },
    };
  }),

  removeJob: (taskId) => set((state) => {
    const { [taskId]: removed, ...remainingJobs } = state.jobs;
    const newPolling = new Set(state.activePolling);
    newPolling.delete(taskId);

    return {
      jobs: remainingJobs,
      activePolling: newPolling,
    };
  }),

  clearCompletedJobs: () => set((state) => {
    const activeJobs: Record<string, TestGenerationJob> = {};

    Object.entries(state.jobs).forEach(([taskId, job]) => {
      if (job.status !== 'completed' && job.status !== 'failed') {
        activeJobs[taskId] = job;
      }
    });

    return { jobs: activeJobs };
  }),

  setOnTestCasesSaved: (callback) => set({ onTestCasesSaved: callback }),

  notifyTestCasesSaved: () => {
    const callback = get().onTestCasesSaved;
    if (callback) {
      callback();
    }
  },

  // Polling management
  startPolling: (taskId) => set((state) => {
    const newPolling = new Set(state.activePolling);
    newPolling.add(taskId);
    return { activePolling: newPolling };
  }),

  stopPolling: (taskId) => set((state) => {
    const newPolling = new Set(state.activePolling);
    newPolling.delete(taskId);
    return { activePolling: newPolling };
  }),

  isPolling: (taskId) => {
    return get().activePolling.has(taskId);
  },

  // Computed
  getJobsByStory: (storyId) => {
    return Object.values(get().jobs).filter((job) => job.storyId === storyId);
  },

  getActiveJobs: () => {
    return Object.values(get().jobs).filter(
      (job) => job.status === 'queued' || job.status === 'pending' || job.status === 'generating'
    );
  },

  getCompletedJobs: () => {
    return Object.values(get().jobs).filter(
      (job) => job.status === 'completed' || job.status === 'failed'
    );
  },

  getJobByTaskId: (taskId) => {
    return get().jobs[taskId];
  },

  hasActiveJob: (storyId) => {
    return Object.values(get().jobs).some(
      (job) => job.storyId === storyId &&
      (job.status === 'queued' || job.status === 'pending' || job.status === 'generating')
    );
  },

  getActiveJobForStory: (storyId) => {
    return Object.values(get().jobs).find(
      (job) => job.storyId === storyId &&
      (job.status === 'queued' || job.status === 'pending' || job.status === 'generating')
    );
  },
}));
