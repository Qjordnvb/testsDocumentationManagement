import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Bug } from 'lucide-react';
import { bugApi } from '@/entities/bug';
import type { CreateBugDTO, BugSeverity, BugPriority, BugType, Bug as BugEntity } from '@/entities/bug';
import type { ExecutionDetails } from '@/entities/test-execution';
import toast from 'react-hot-toast';

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Bug size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report Bug</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Document a defect found during testing
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50"
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Pre-filled from Execution #{executionDetails.execution_id}</p>
                    <p className="text-blue-700 mt-1">
                      Test Case: {testCaseId} • Environment: {executionDetails.environment}
                      {executionDetails.version && ` • Version: ${executionDetails.version}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bug Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Brief summary of the bug (e.g., 'Login button not working on mobile')"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Detailed description of the issue..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Steps to Reproduce <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {stepsToReproduce.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.stepsToReproduce ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={`Step ${index + 1}`}
                      />
                    </div>
                    {stepsToReproduce.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Step
                </button>
              </div>
              {errors.stepsToReproduce && (
                <p className="text-red-600 text-sm mt-1">{errors.stepsToReproduce}</p>
              )}
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Behavior <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.expectedBehavior ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="What should happen?"
                />
                {errors.expectedBehavior && (
                  <p className="text-red-600 text-sm mt-1">{errors.expectedBehavior}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Behavior <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.actualBehavior ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="What actually happens?"
                />
                {errors.actualBehavior && (
                  <p className="text-red-600 text-sm mt-1">{errors.actualBehavior}</p>
                )}
              </div>
            </div>

            {/* Severity & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Critical">🔴 Critical - System crash, data loss</option>
                  <option value="High">🟠 High - Major functionality broken</option>
                  <option value="Medium">🟡 Medium - Feature partially broken</option>
                  <option value="Low">🟢 Low - Minor issue, cosmetic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as BugPriority)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bug Type <span className="text-red-500">*</span>
              </label>
              <select
                value={bugType}
                onChange={(e) => setBugType(e.target.value as BugType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., QA, Staging, Production"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., 1.2.3"
                />
              </div>
            </div>

            {/* Browser & OS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Browser
                </label>
                <input
                  type="text"
                  value={browser}
                  onChange={(e) => setBrowser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Chrome 120, Firefox 121"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating System
                </label>
                <input
                  type="text"
                  value={os}
                  onChange={(e) => setOs(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Windows 11, macOS 14"
                />
              </div>
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Email or name of assignee"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin">⚙️</div>
                Creating Bug...
              </>
            ) : (
              <>
                <Bug size={18} />
                Create Bug Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
