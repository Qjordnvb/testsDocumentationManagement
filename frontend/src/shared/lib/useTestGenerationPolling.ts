/**
 * Polling Hook for Test Generation Jobs
 * Polls Celery task status every 2 seconds
 */

import { useEffect, useRef } from 'react';
import { useTestGenerationQueue } from '../stores';
import { apiService } from '../api';
import toast from 'react-hot-toast';

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

  const intervalRef = useRef<number | null>(null);

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

          // ✅ TEST CASES READY FOR REVIEW (NO AUTO-SAVE)
          // User must click "Listo para revisar" badge to open ReviewTestCasesModal and save
          if (status.result?.suggested_test_cases && status.result?.story_id) {
            const testCaseCount = status.result.suggested_test_cases.length;

            toast.success(
              `✅ Generación completa! ${testCaseCount} test case${testCaseCount !== 1 ? 's' : ''} listo${testCaseCount !== 1 ? 's' : ''} para revisar.\nClick en el badge "Listo para revisar" para ver y guardar.`,
              { duration: 6000 }
            );

            console.log(`✅ Test cases ready for review (${testCaseCount}):`, status.result.suggested_test_cases);
          } else {
            // No test cases in result (shouldn't happen)
            toast.error(
              'Generación completada pero no se generaron test cases. Intenta nuevamente.',
              { duration: 5000 }
            );
          }

          // Mark as completed
          updateJob(taskId, {
            completedAt: new Date(),
          });
        } else {
          toast.error(
            `Generation Failed - ${status.error || 'An error occurred during generation'}`,
            { duration: 7000 }
          );

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
        toast('Connection Issue - Unable to check job status. Will keep trying...', {
          duration: 4000,
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
