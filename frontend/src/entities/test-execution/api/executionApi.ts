/**
 * Test Execution API
 * API calls for test execution operations with client-side validation
 */

import axios from 'axios';
import type {
  CreateExecutionRequest,
  ExecutionDetails,
  ExecutionHistoryResponse,
  StepExecutionResult,
  GherkinKeyword,
} from '../model/types';

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

/**
 * Validation error class for execution data
 */
export class ExecutionValidationError extends Error {
  public field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ExecutionValidationError';
    this.field = field;
  }
}

/**
 * Validate step execution results BEFORE sending to backend
 * This provides immediate feedback to the user instead of waiting for backend validation
 */
function validateStepResults(stepResults: StepExecutionResult[]): void {
  // 1. Must have at least one step
  if (!stepResults || stepResults.length === 0) {
    throw new ExecutionValidationError('Must have at least one step result', 'step_results');
  }

  // 2. Validate each step
  const stepIndices = new Set<number>();
  const validKeywords: GherkinKeyword[] = ['Given', 'When', 'Then', 'And', 'But'];

  stepResults.forEach((step, index) => {
    // Validate step_index
    if (step.step_index < 0) {
      throw new ExecutionValidationError(
        `Step ${index}: step_index must be >= 0 (got ${step.step_index})`,
        `step_results[${index}].step_index`
      );
    }

    // Check for duplicate step_index
    if (stepIndices.has(step.step_index)) {
      throw new ExecutionValidationError(
        `Step ${index}: duplicate step_index ${step.step_index}`,
        `step_results[${index}].step_index`
      );
    }
    stepIndices.add(step.step_index);

    // Validate keyword
    if (!validKeywords.includes(step.keyword)) {
      throw new ExecutionValidationError(
        `Step ${index}: keyword must be one of: ${validKeywords.join(', ')} (got "${step.keyword}")`,
        `step_results[${index}].keyword`
      );
    }

    // Validate text (cannot be empty)
    if (!step.text || step.text.trim() === '') {
      throw new ExecutionValidationError(
        `Step ${index}: text cannot be empty`,
        `step_results[${index}].text`
      );
    }

    // Validate scenario_name (REQUIRED)
    if (!step.scenario_name || step.scenario_name.trim() === '') {
      throw new ExecutionValidationError(
        `Step ${index}: scenario_name is required and cannot be empty`,
        `step_results[${index}].scenario_name`
      );
    }
  });

  // 3. Ensure at least one scenario_name exists
  const scenarios = new Set(stepResults.map(s => s.scenario_name).filter(Boolean));
  if (scenarios.size === 0) {
    throw new ExecutionValidationError(
      'All steps must have a scenario_name',
      'step_results'
    );
  }
}

/**
 * Validate create execution request
 */
function validateExecutionRequest(data: CreateExecutionRequest): void {
  // Validate test_case_id
  if (!data.test_case_id || data.test_case_id.trim() === '') {
    throw new ExecutionValidationError('test_case_id is required', 'test_case_id');
  }

  // Validate executed_by
  if (!data.executed_by || data.executed_by.trim() === '') {
    throw new ExecutionValidationError('executed_by is required', 'executed_by');
  }

  // Validate execution_time_seconds
  if (data.execution_time_seconds < 0) {
    throw new ExecutionValidationError(
      'execution_time_seconds must be >= 0',
      'execution_time_seconds'
    );
  }

  // Validate step_results
  validateStepResults(data.step_results);
}

/**
 * Create a test execution
 * Validates data before sending to backend
 */
export const createExecution = async (
  data: CreateExecutionRequest
): Promise<{ message: string; execution_id: number; status: string }> => {
  try {
    // Client-side validation BEFORE sending
    validateExecutionRequest(data);

    // Send to backend
    const response = await api.post<{ message: string; execution_id: number; status: string }>(
      '/test-executions',
      data
    );

    return response.data;
  } catch (error) {
    // Re-throw validation errors
    if (error instanceof ExecutionValidationError) {
      throw error;
    }

    // Handle API errors
    if (error instanceof Error) {
      throw new Error(`Failed to create execution: ${error.message}`);
    }

    throw new Error('Failed to create execution: Unknown error');
  }
};

/**
 * Get execution history for a test case
 */
export const getExecutionHistory = async (
  testCaseId: string
): Promise<ExecutionHistoryResponse> => {
  const response = await api.get<ExecutionHistoryResponse>(
    `/test-executions/test-cases/${testCaseId}`
  );
  return response.data;
};

/**
 * Get execution details by ID
 */
export const getExecutionDetails = async (
  executionId: number
): Promise<ExecutionDetails> => {
  const response = await api.get<ExecutionDetails>(
    `/test-executions/${executionId}`
  );
  return response.data;
};

/**
 * Export all API functions
 */
export const executionApi = {
  createExecution,
  getExecutionHistory,
  getExecutionDetails,
  validateStepResults,  // Export for testing
  validateExecutionRequest,  // Export for testing
};
