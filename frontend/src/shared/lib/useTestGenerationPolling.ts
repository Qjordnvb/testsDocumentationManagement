/**
 * Polling Hook for Test Generation Jobs
 * Polls Celery task status every 2 seconds
 */

import { useEffect, useRef } from 'react';
import { useTestGenerationQueue } from '../stores';
import { apiService } from '../api';
import { toast } from 'sonner';

const POLLING_INTERVAL = 2000; // 2 seconds

export function useTestGenerationPolling() {
  const {
    jobs,
    updateJob,
    startPolling,
    stopPolling,
    isPolling,
    getActiveJobs,
  } = useTestGenerationQueue();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll a single job
  const pollJob = async (taskId: string) => {
    if (!isPolling(taskId)) {
      return; // Skip if not actively polling this job
    }

    try {
      const status = await apiService.getTestGenerationStatus(taskId);

      // Update job in store
      updateJob(taskId, {
        status: status.status,
        progress: status.progress,
        message: status.message,
        storyTitle: status.story_title,
        result: status.result,
        error: status.error,
      });

      // Stop polling if completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        stopPolling(taskId);

        // Show notification
        if (status.status === 'completed') {
          const job = jobs[taskId];
          toast.success('Test Cases Generated!', {
            description: `Ready for ${job?.storyTitle || 'user story'}`,
            duration: 5000,
          });

          // Mark as completed
          updateJob(taskId, {
            completedAt: new Date(),
          });
        } else {
          toast.error('Generation Failed', {
            description: status.error || 'An error occurred during generation',
            duration: 7000,
          });

          // Mark as failed
          updateJob(taskId, {
            completedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Error polling job ${taskId}:`, error);

      // On network error, keep polling (don't stop)
      // But show warning after 3 consecutive failures
      const job = jobs[taskId];
      const failureCount = (job as any)._failureCount || 0;

      if (failureCount >= 3) {
        toast.warning('Connection Issue', {
          description: 'Unable to check job status. Will keep trying...',
        });
      }

      updateJob(taskId, {
        ...(job as any),
        _failureCount: failureCount + 1,
      } as any);
    }
  };

  // Start polling all active jobs
  useEffect(() => {
    const activeJobs = getActiveJobs();

    if (activeJobs.length === 0) {
      // No active jobs, clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling for all active jobs
    activeJobs.forEach((job) => {
      if (!isPolling(job.taskId)) {
        startPolling(job.taskId);
      }
    });

    // Set up interval if not already running
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        const currentActiveJobs = getActiveJobs();
        currentActiveJobs.forEach((job) => {
          pollJob(job.taskId);
        });
      }, POLLING_INTERVAL);
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobs, getActiveJobs, isPolling, startPolling, updateJob]);

  return {
    activeJobsCount: getActiveJobs().length,
    pollJob,
  };
}
