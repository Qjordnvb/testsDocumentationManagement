import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Bug } from 'lucide-react';
import { bugApi } from '@/entities/bug';
import type { CreateBugDTO, BugSeverity, BugPriority, BugType, Bug as BugEntity } from '@/entities/bug';
import type { ExecutionDetails } from '@/entities/test-execution';
import toast from 'react-hot-toast';
import { Button } from '@/shared/ui/Button';
import {
  colors,
  getModalTypography,
  getComponentSpacing,
  getComponentShadow,
  borderRadius,
  getSeverityClasses,
} from '@/shared/design-system/tokens';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (bug: BugEntity) => void;

  // Pre-fill data (optional)
  projectId: string;
  executionDetails?: ExecutionDetails;
  testCaseId?: string;
  testCaseTitle?: string;
  userStoryId?: string;
  scenarioName?: string;
}

export const BugReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  executionDetails,
  testCaseId,
  testCaseTitle,
  userStoryId,
  scenarioName,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState<string[]>(['']);
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('Medium');
  const [priority, setPriority] = useState<BugPriority>('Medium');
  const [bugType, setBugType] = useState<BugType>('Functional');
  const [environment, setEnvironment] = useState('QA');
  const [browser, setBrowser] = useState('');
  const [os, setOs] = useState('');
  const [version, setVersion] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill data when execution details are provided
  useEffect(() => {
    if (executionDetails && isOpen) {
      // Auto-fill environment and version from execution
      setEnvironment(executionDetails.environment || 'QA');
      setVersion(executionDetails.version || '');

      // Extract failed steps for "Steps to Reproduce"
      const failedSteps = executionDetails.step_results.filter(s => s.status === 'FAILED');
      if (failedSteps.length > 0) {
        const steps = failedSteps.map((step, idx) =>
          `${idx + 1}. ${step.keyword} ${step.text}`
        );
        setStepsToReproduce(steps.length > 0 ? steps : ['']);
      }

      // Suggest title based on test case
      if (testCaseTitle && !title) {
        setTitle(`Bug in: ${testCaseTitle}`);
      }

      // Pre-fill description with execution context
      if (!description) {
        setDescription(
          `Bug found during test execution #${executionDetails.execution_id}\n\n` +
          `Test Case: ${testCaseId}\n` +
          `Executed by: ${executionDetails.executed_by}\n` +
          `Date: ${new Date(executionDetails.execution_date).toLocaleString()}\n\n` +
          `Failed steps: ${failedSteps.length}/${executionDetails.total_steps}`
        );
      }
    }
  }, [executionDetails, isOpen, testCaseId, testCaseTitle, title, description]);

  const handleAddStep = () => {
    setStepsToReproduce([...stepsToReproduce, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (stepsToReproduce.length > 1) {
      setStepsToReproduce(stepsToReproduce.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...stepsToReproduce];
    newSteps[index] = value;
    setStepsToReproduce(newSteps);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    const validSteps = stepsToReproduce.filter(s => s.trim());
    if (validSteps.length === 0) {
      newErrors.stepsToReproduce = 'At least one step to reproduce is required';
    }

    if (!expectedBehavior.trim()) {
      newErrors.expectedBehavior = 'Expected behavior is required';
    }

    if (!actualBehavior.trim()) {
      newErrors.actualBehavior = 'Actual behavior is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const validSteps = stepsToReproduce.filter(s => s.trim());

      const bugData: CreateBugDTO = {
        title: title.trim(),
        description: description.trim(),
        steps_to_reproduce: validSteps,
        expected_behavior: expectedBehavior.trim(),
        actual_behavior: actualBehavior.trim(),
        severity,
        priority,
        bug_type: bugType,
        environment: environment.trim(),
        browser: browser.trim() || undefined,
        os: os.trim() || undefined,
        version: version.trim() || undefined,
        project_id: projectId,
        user_story_id: userStoryId,
        test_case_id: testCaseId,
        scenario_name: scenarioName,
        execution_id: executionDetails?.execution_id,
        reported_by: 'QA Tester', // TODO: Get from auth context
        assigned_to: assignedTo.trim() || undefined,
      };

      const createdBug = await bugApi.create(bugData);

      toast.success(`Bug ${createdBug.id} created successfully`);

      if (onSuccess) {
        onSuccess(createdBug);
      }

      handleClose();
    } catch (error: any) {
      console.error('Error creating bug:', error);
      toast.error(error.response?.data?.detail || 'Failed to create bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setStepsToReproduce(['']);
    setExpectedBehavior('');
    setActualBehavior('');
    setSeverity('Medium');
    setPriority('Medium');
    setBugType('Functional');
    setEnvironment('QA');
    setBrowser('');
    setOs('');
    setVersion('');
    setAssignedTo('');
    setErrors({});

    onClose();
  };

  if (!isOpen) return null;

  // Get design tokens
  const modalSpacing = getComponentSpacing('modal');
  const modalShadow = getComponentShadow('modal');
  const titleTypography = getModalTypography('modalTitle');
  const subtitleTypography = getModalTypography('modalSubtitle');
  const labelTypography = getModalTypography('label');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${colors.white} ${borderRadius.xl} ${modalShadow.elevated} w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`${modalSpacing.padding} border-b ${colors.status.error.gradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${colors.status.error[100]} ${modalSpacing.padding} ${borderRadius.lg}`}>
                <Bug size={24} className={colors.status.error.text600} />
              </div>
              <div>
                <h2 className={`${titleTypography.className} ${colors.gray.text900}`}>Report Bug</h2>
                <p className={`${subtitleTypography.className} ${colors.gray.text600} mt-1`}>
                  Document a defect found during testing
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`${colors.gray.text400} hover:${colors.gray.text600} p-2 ${borderRadius.full} hover:bg-white/50 transition-colors`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Context Info (if from execution) */}
            {executionDetails && (
              <div className={`${colors.brand.primary[50]} border ${colors.brand.primary.border200} ${borderRadius.lg} p-4`}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className={`${colors.brand.primary.text600} mt-0.5 flex-shrink-0`} />
                  <div className={subtitleTypography.className}>
                    <p className={`font-medium ${colors.brand.primary.text900}`}>Pre-filled from Execution #{executionDetails.execution_id}</p>
                    <p className={`${colors.brand.primary.text700} mt-1`}>
                      Test Case: {testCaseId} • Environment: {executionDetails.environment}
                      {executionDetails.version && ` • Version: ${executionDetails.version}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Bug Title <span className={colors.status.error.text500}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.title ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                }`}
                placeholder="Brief summary of the bug (e.g., 'Login button not working on mobile')"
              />
              {errors.title && (
                <p className={`${colors.status.error.text600} ${subtitleTypography.className} mt-1`}>{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Description <span className={colors.status.error.text500}>*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.description ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                }`}
                placeholder="Detailed description of the issue..."
              />
              {errors.description && (
                <p className={`${colors.status.error.text600} ${subtitleTypography.className} mt-1`}>{errors.description}</p>
              )}
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Steps to Reproduce <span className={colors.status.error.text500}>*</span>
              </label>
              <div className="space-y-2">
                {stepsToReproduce.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.stepsToReproduce ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                        }`}
                        placeholder={`Step ${index + 1}`}
                      />
                    </div>
                    {stepsToReproduce.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className={`px-3 py-2 ${colors.status.error.text600} hover:${colors.status.error[50]} ${borderRadius.lg} transition-colors`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddStep}
                  className={`${subtitleTypography.className} ${colors.brand.primary.text600} hover:${colors.brand.primary.text700} font-medium`}
                >
                  + Add Step
                </button>
              </div>
              {errors.stepsToReproduce && (
                <p className={`${colors.status.error.text600} ${subtitleTypography.className} mt-1`}>{errors.stepsToReproduce}</p>
              )}
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Expected Behavior <span className={colors.status.error.text500}>*</span>
                </label>
                <textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.expectedBehavior ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                  }`}
                  placeholder="What should happen?"
                />
                {errors.expectedBehavior && (
                  <p className={`${colors.status.error.text600} ${subtitleTypography.className} mt-1`}>{errors.expectedBehavior}</p>
                )}
              </div>

              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Actual Behavior <span className={colors.status.error.text500}>*</span>
                </label>
                <textarea
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.actualBehavior ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                  }`}
                  placeholder="What actually happens?"
                />
                {errors.actualBehavior && (
                  <p className={`${colors.status.error.text600} ${subtitleTypography.className} mt-1`}>{errors.actualBehavior}</p>
                )}
              </div>
            </div>

            {/* Severity & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Severity <span className={colors.status.error.text500}>*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                >
                  <option value="Critical">🔴 Critical - System crash, data loss</option>
                  <option value="High">🟠 High - Major functionality broken</option>
                  <option value="Medium">🟡 Medium - Feature partially broken</option>
                  <option value="Low">🟢 Low - Minor issue, cosmetic</option>
                </select>
              </div>

              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Priority <span className={colors.status.error.text500}>*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as BugPriority)}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                >
                  <option value="Urgent">⚡ Urgent - Fix immediately</option>
                  <option value="High">🔥 High - Fix in current sprint</option>
                  <option value="Medium">📌 Medium - Fix in next sprint</option>
                  <option value="Low">📋 Low - Fix when possible</option>
                </select>
              </div>
            </div>

            {/* Bug Type */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Bug Type <span className={colors.status.error.text500}>*</span>
              </label>
              <select
                value={bugType}
                onChange={(e) => setBugType(e.target.value as BugType)}
                className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              >
                <option value="Functional">Functional - Feature not working</option>
                <option value="UI/UX">UI/UX - Visual or layout issue</option>
                <option value="Performance">Performance - Slow or laggy</option>
                <option value="Security">Security - Security vulnerability</option>
                <option value="Compatibility">Compatibility - Browser/device issue</option>
                <option value="Data">Data - Data integrity issue</option>
                <option value="API">API - Backend/API error</option>
                <option value="Crash">Crash - Application crash</option>
              </select>
            </div>

            {/* Environment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Environment <span className={colors.status.error.text500}>*</span>
                </label>
                <input
                  type="text"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="e.g., QA, Staging, Production"
                />
              </div>

              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="e.g., 1.2.3"
                />
              </div>
            </div>

            {/* Browser & OS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Browser
                </label>
                <input
                  type="text"
                  value={browser}
                  onChange={(e) => setBrowser(e.target.value)}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="e.g., Chrome 120, Firefox 121"
                />
              </div>

              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Operating System
                </label>
                <input
                  type="text"
                  value={os}
                  onChange={(e) => setOs(e.target.value)}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="e.g., Windows 11, macOS 14"
                />
              </div>
            </div>

            {/* Assign To */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Assign To
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder="Email or name of assignee"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`${modalSpacing.padding} border-t ${colors.gray[50]} flex justify-end gap-3`}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Bug size={18} /> : undefined}
          >
            {isSubmitting ? 'Creating Bug...' : 'Create Bug Report'}
          </Button>
        </div>
      </div>
    </div>
  );
};
