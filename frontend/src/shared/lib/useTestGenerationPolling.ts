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
    notifyTestCasesSaved,
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

          // ✅ SAVE TEST CASES TO DATABASE
          if (status.result?.suggested_test_cases && status.result?.story_id) {
            try {
              // Transform suggested test cases to batch format
              const testCasesToSave = status.result.suggested_test_cases.map((tc: any) => ({
                suggested_id: tc.suggested_id,
                title: tc.title,
                description: tc.description,
                user_story_id: status.result.story_id,
                test_type: tc.test_type,
                priority: tc.priority,
                status: tc.status,
                gherkin_content: tc.gherkin_content,
              }));

              // Call batch create endpoint (WITH AUTHENTICATION and multi-tenant isolation)
              const result = await apiService.createTestCasesBatch({
                user_story_id: status.result.story_id,
                test_cases: testCasesToSave,
              });

              console.log('✅ Test cases saved successfully:', result);

              toast.success(
                `Test Cases Saved! ${testCasesToSave.length} test cases created for ${job?.storyTitle || 'user story'}`,
                { duration: 5000 }
              );

              // Notify that test cases were saved (triggers refresh in StoriesPage)
              notifyTestCasesSaved();
            } catch (error: any) {
              console.error('❌ Error saving test cases:', error);

              const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';

              toast.error(
                `Failed to Save - ${errorMessage}`,
                { duration: 7000 }
              );
            }
          } else {
            // No test cases in result (shouldn't happen)
            toast('No Test Cases - Generation completed but no test cases were returned', {
              duration: 5000,
            });
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
