/**
 * Gherkin Parser - Sprint 1 Scenario Support
 * Updated: 2024-11-19
 */

export interface GherkinStep {
  id: number;
  keyword: string; // Given, When, Then, And, But
  text: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
}

export interface GherkinScenario {
  scenarioIndex: number;
  scenarioName: string; // "Scenario: Registro exitoso con datos válidos"
  steps: GherkinStep[];
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  tags: string[]; // @smoke, @regression, etc.
}

export interface GherkinFeature {
  featureName: string;
  scenarios: GherkinScenario[];
}

/**
 * Parse Gherkin content into structured scenarios
 * Supports:
 * - Feature: declarations
 * - Scenario: and Scenario Outline:
 * - Tags (@smoke, @regression, etc.)
 * - Steps (Given, When, Then, And, But)
 */
export const parseGherkinContent = (content: string): GherkinFeature => {
  if (!content) {
    return { featureName: 'Unknown Feature', scenarios: [] };
  }

  const lines = content.split('\n');
  let featureName = 'Unknown Feature';
  const scenarios: GherkinScenario[] = [];

  let currentScenario: GherkinScenario | null = null;
  let currentTags: string[] = [];
  let stepIdCounter = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) return;

    // Feature declaration
    if (trimmed.startsWith('Feature:')) {
      featureName = trimmed.replace('Feature:', '').trim();
      return;
    }

    // Tags (@smoke, @regression, etc.)
    if (trimmed.startsWith('@')) {
      currentTags = trimmed.split(/\s+/).filter(t => t.startsWith('@'));
      return;
    }

    // Scenario or Scenario Outline
    if (trimmed.match(/^(Scenario|Scenario Outline):/)) {
      // Save previous scenario if exists
      if (currentScenario) {
        scenarios.push(currentScenario);
      }

      // Create new scenario
      currentScenario = {
        scenarioIndex: scenarios.length,
        scenarioName: trimmed,
        steps: [],
        status: 'pending',
        tags: [...currentTags]
      };
      currentTags = []; // Reset tags
      return;
    }

    // Steps (Given, When, Then, And, But)
    const stepMatch = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)/);
    if (stepMatch && currentScenario) {
      currentScenario.steps.push({
        id: stepIdCounter++,
        keyword: stepMatch[1],
        text: stepMatch[2],
        status: 'pending'
      });
    }
  });

  // Push last scenario
  if (currentScenario) {
    scenarios.push(currentScenario);
  }

  return {
    featureName,
    scenarios
  };
};

/**
 * Legacy function for backward compatibility
 * Returns a flat list of all steps across all scenarios
 */
export const parseGherkinContentFlat = (content: string): GherkinStep[] => {
  const feature = parseGherkinContent(content);
  const allSteps: GherkinStep[] = [];

  feature.scenarios.forEach(scenario => {
    allSteps.push(...scenario.steps);
  });

  return allSteps;
};

/**
 * Calculate scenario status based on its steps
 */
export const calculateScenarioStatus = (steps: GherkinStep[]): GherkinScenario['status'] => {
  if (steps.length === 0) return 'pending';

  const hasFailedStep = steps.some(s => s.status === 'failed');
  if (hasFailedStep) return 'failed';

  const allPassed = steps.every(s => s.status === 'passed');
  if (allPassed) return 'passed';

  const hasSkipped = steps.some(s => s.status === 'skipped');
  if (hasSkipped) return 'skipped';

  return 'pending';
};

/**
 * Calculate overall test case status from all scenarios
 */
export const calculateOverallStatus = (scenarios: GherkinScenario[]): 'PASSED' | 'FAILED' | 'IN_PROGRESS' | 'BLOCKED' => {
  if (scenarios.length === 0) return 'IN_PROGRESS';

  const hasFailedScenario = scenarios.some(s => s.status === 'failed');
  if (hasFailedScenario) return 'FAILED';

  const allPassed = scenarios.every(s => s.status === 'passed');
  if (allPassed) return 'PASSED';

  const hasInProgress = scenarios.some(s => s.status === 'pending');
  if (hasInProgress) return 'IN_PROGRESS';

  return 'BLOCKED';
};
