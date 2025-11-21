import { useState, useEffect, useRef } from 'react';
import type { GherkinScenario, GherkinStep } from '@/shared/lib/gherkinParser';
import { calculateScenarioStatus, calculateOverallStatus } from '@/shared/lib/gherkinParser';

export const useTestRunner = (initialScenarios: GherkinScenario[]) => {
  const [scenarios, setScenarios] = useState<GherkinScenario[]>(initialScenarios);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Evidence map: stepId -> File
  const [evidenceMap, setEvidenceMap] = useState<Record<number, File>>({});

  // Track expanded scenarios (for UI)
  const [expandedScenarios, setExpandedScenarios] = useState<Set<number>>(
    new Set(initialScenarios.map((_, idx) => idx)) // All expanded by default
  );

  // Timer ref
  const timerRef = useRef<number | null>(null);

  // Load initial scenarios when they change
  useEffect(() => {
    if (initialScenarios.length > 0) {
      setScenarios(initialScenarios);
      // Auto-expand all scenarios
      setExpandedScenarios(new Set(initialScenarios.map((_, idx) => idx)));
    }
  }, [initialScenarios]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const startExecution = () => setIsRunning(true);

  const pauseExecution = () => setIsRunning(false);

  const toggleScenario = (scenarioIndex: number) => {
    setExpandedScenarios((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioIndex)) {
        newSet.delete(scenarioIndex);
      } else {
        newSet.add(scenarioIndex);
      }
      return newSet;
    });
  };

  const markStep = (scenarioIndex: number, stepId: number, status: 'passed' | 'failed') => {
    if (!isRunning) startExecution(); // Auto-start timer

    setScenarios((prevScenarios) =>
      prevScenarios.map((scenario, idx) => {
        if (idx !== scenarioIndex) return scenario;

        // Update step status with TOGGLE functionality
        // If step already has this status, reset to 'pending' (allows unchecking)
        const updatedSteps = scenario.steps.map((step: GherkinStep) => {
          if (step.id === stepId) {
            const newStatus: 'passed' | 'failed' | 'pending' =
              step.status === status ? 'pending' : status;
            return { ...step, status: newStatus };
          }
          return step;
        });

        // Note: We do NOT auto-skip subsequent steps when one fails
        // QA must be able to execute and mark all steps independently
        // A failed step doesn't prevent testing the remaining steps

        // Recalculate scenario status
        const newScenarioStatus = calculateScenarioStatus(updatedSteps);

        return {
          ...scenario,
          steps: updatedSteps,
          status: newScenarioStatus
        };
      })
    );

    // Pause execution if failed (to allow adding evidence)
    if (status === 'failed') {
      pauseExecution();
    }
  };

  const addEvidence = (stepId: number, file: File) => {
    setEvidenceMap((prev) => ({
      ...prev,
      [stepId]: file
    }));
  };

  const removeEvidence = (stepId: number) => {
    setEvidenceMap((prev) => {
      const newMap = { ...prev };
      delete newMap[stepId];
      return newMap;
    });
  };

  // Calculate overall execution status
  const executionStatus = calculateOverallStatus(scenarios);

  return {
    scenarios,
    isRunning,
    elapsedSeconds,
    executionStatus,
    evidenceMap,
    expandedScenarios,
    startExecution,
    pauseExecution,
    toggleScenario,
    markStep,
    addEvidence,
    removeEvidence
  };
};
