/**
 * Generate Tests Feature - Test Formatting
 * Utilities for formatting test case data
 */

import type { TestCase } from '@/entities/test-case';

/**
 * Formats Gherkin scenario for display
 */
export const formatGherkinScenario = (scenario: string): string => {
  return scenario
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
};

/**
 * Extracts scenario title from Gherkin
 */
export const extractScenarioTitle = (scenario: string): string => {
  const lines = scenario.split('\n');
  const scenarioLine = lines.find((line) => line.trim().startsWith('Scenario:'));

  if (scenarioLine) {
    return scenarioLine.replace('Scenario:', '').trim();
  }

  return 'Test Scenario';
};

/**
 * Counts steps in a Gherkin scenario
 */
export const countGherkinSteps = (scenario: string): number => {
  const lines = scenario.split('\n');
  return lines.filter(
    (line) =>
      line.trim().startsWith('Given') ||
      line.trim().startsWith('When') ||
      line.trim().startsWith('Then') ||
      line.trim().startsWith('And')
  ).length;
};

/**
 * Validates Gherkin format
 */
export const isValidGherkin = (scenario: string): boolean => {
  const hasScenario = scenario.includes('Scenario:');
  const hasGiven = scenario.includes('Given');
  const hasWhen = scenario.includes('When');
  const hasThen = scenario.includes('Then');

  return hasScenario && hasGiven && hasWhen && hasThen;
};

/**
 * Groups test cases by test type
 */
export const groupTestsByType = (
  tests: TestCase[]
): Record<string, TestCase[]> => {
  return tests.reduce((acc, test) => {
    const type = test.test_type || 'Functional';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(test);
    return acc;
  }, {} as Record<string, TestCase[]>);
};

/**
 * Formats test case summary
 */
export const formatTestSummary = (tests: TestCase[]): string => {
  const total = tests.length;
  const byType = groupTestsByType(tests);

  const functional = byType.Functional?.length || 0;
  const integration = byType.Integration?.length || 0;
  const e2e = byType.E2E?.length || 0;

  return `${total} test cases generados (Funcional: ${functional}, Integración: ${integration}, E2E: ${e2e})`;
};
