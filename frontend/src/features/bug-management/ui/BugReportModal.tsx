import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Bug, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bugApi } from '@/entities/bug';
import type { CreateBugDTO, UpdateBugDTO, BugSeverity, BugPriority, BugType, Bug as BugEntity } from '@/entities/bug';
import type { ExecutionDetails } from '@/entities/test-execution';
import toast from 'react-hot-toast';
import { Button } from '@/shared/ui/Button';
import {
  colors,
  getModalTypography,
  getComponentSpacing,
  getComponentShadow,
  borderRadius,

} from '@/shared/design-system/tokens';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (bug: BugEntity) => void;

  // Mode: 'create', 'readonly', or 'edit'
  mode?: 'create' | 'readonly' | 'edit';
  existingBugId?: string; // If mode='readonly' or 'edit', load this bug

  // Pre-fill data (optional for create mode)
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
  mode = 'create',
  existingBugId,
  projectId,
  executionDetails,
  testCaseId,
  testCaseTitle,
  userStoryId,
  scenarioName,
}) => {
  const navigate = useNavigate();
  const isReadonly = mode === 'readonly';
  const isEditMode = mode === 'edit';
  const shouldLoadExistingBug = (isReadonly || isEditMode) && existingBugId;

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
  const [attachments, setAttachments] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBug, setIsLoadingBug] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if we've already pre-filled the form to prevent re-execution
  const hasPreFilledRef = useRef(false);
  // Track if we've already loaded the bug to prevent duplicate loads
  const hasLoadedBugRef = useRef(false);

  // Load existing bug in readonly or edit mode
  useEffect(() => {
    // Prevent duplicate loads - only load once when modal opens
    if (hasLoadedBugRef.current || !shouldLoadExistingBug || !isOpen) {
      return;
    }

    console.log(`📖 Loading existing bug (${mode} mode):`, existingBugId);
    hasLoadedBugRef.current = true; // Mark as loaded immediately to prevent race conditions
    setIsLoadingBug(true);

    bugApi.getById(existingBugId)
      .then((bug) => {
        console.log('✅ Bug loaded:', bug);

          // Populate all fields with bug data
          setTitle(bug.title);
          setDescription(bug.description);
          setStepsToReproduce(bug.steps_to_reproduce || ['']);
          setExpectedBehavior(bug.expected_behavior);
          setActualBehavior(bug.actual_behavior);
          setSeverity(bug.severity);
          setPriority(bug.priority);
          setBugType(bug.bug_type);
          setEnvironment(bug.environment);
          setBrowser(bug.browser || '');
          setOs(bug.os || '');
          setVersion(bug.version || '');
          setAssignedTo(bug.assigned_to || '');
          // Load attachments/screenshots
          setAttachments(bug.attachments || []);
        })
        .catch((error) => {
          console.error('❌ Error loading bug:', error);
          toast.error('Error al cargar el bug');
        })
        .finally(() => {
          setIsLoadingBug(false);
        });
  }, [isReadonly, existingBugId, isOpen, mode]);

  // Reset flags when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasPreFilledRef.current = false;
      hasLoadedBugRef.current = false;
    }
  }, [isOpen]);

  // Pre-fill data when execution details are provided (create mode ONLY)
  // Only run once when modal opens in create mode, not on subsequent re-renders
  useEffect(() => {
    console.log('🔍 BugReportModal useEffect - Props:', {
      isOpen,
      mode,
      hasExecutionDetails: !!executionDetails,
      hasPreFilled: hasPreFilledRef.current,
      scenarioName,
      testCaseTitle,
      testCaseId
    });

    // Only pre-fill in CREATE mode when modal first opens
    // Don't run if:
    // - Already pre-filled (prevents re-execution)
    // - Not in create mode
    // - Modal is not open
    // - No execution details
    if (hasPreFilledRef.current || !isOpen || mode !== 'create' || !executionDetails) {
      return;
    }

    console.log('🔄 Pre-filling bug form with execution details...');
    hasPreFilledRef.current = true; // Mark as pre-filled

    // Auto-fill environment and version from execution
    setEnvironment(executionDetails.environment || 'QA');
    setVersion(executionDetails.version || '');

    // Extract failed steps for "Steps to Reproduce"
    const failedSteps = executionDetails.step_results.filter(s => s.status === 'FAILED');
    if (failedSteps.length > 0) {
      const steps = failedSteps.map((step) =>
        `${step.keyword} ${step.text}${step.actual_result ? ` - Actual: ${step.actual_result}` : ''}`
      );
      setStepsToReproduce(steps.length > 0 ? steps : ['']);
    } else {
      setStepsToReproduce(['']);
    }

    // Suggest title based on scenario name and test case (ALWAYS)
    if (scenarioName && testCaseTitle) {
      setTitle(`Bug in Scenario: ${scenarioName}`);
    } else if (testCaseTitle) {
      setTitle(`Bug in: ${testCaseTitle}`);
    } else if (scenarioName) {
      setTitle(`Bug in: ${scenarioName}`);
    }

    // Pre-fill description with comprehensive execution context (ALWAYS)
    let descriptionText = `Bug found during test execution #${executionDetails.execution_id}\n\n`;

    if (scenarioName) {
      descriptionText += `📋 Scenario: ${scenarioName}\n`;
    }
    if (testCaseId) {
      descriptionText += `🧪 Test Case: ${testCaseId}\n`;
    }
    descriptionText += `👤 Executed by: ${executionDetails.executed_by}\n`;
    descriptionText += `📅 Date: ${new Date(executionDetails.execution_date).toLocaleString()}\n`;
    descriptionText += `🌍 Environment: ${executionDetails.environment}\n`;
    if (executionDetails.version) {
      descriptionText += `📦 Version: ${executionDetails.version}\n`;
    }
    descriptionText += `\n❌ Failed steps: ${failedSteps.length}/${executionDetails.total_steps}\n`;

    if (failedSteps.length > 0 && failedSteps[0].actual_result) {
      descriptionText += `\n🔴 First Failed Result: ${failedSteps[0].actual_result}`;
    }

    setDescription(descriptionText);

    // Extract and populate evidence files/attachments from step results
    const evidenceFiles: string[] = [];
    if (executionDetails.step_results) {
      executionDetails.step_results.forEach(step => {
        if (step.evidence_file) {
          evidenceFiles.push(step.evidence_file);
        }
      });
    }
    setAttachments(evidenceFiles);
    console.log('📸 Pre-populated attachments:', evidenceFiles);
  }, [isOpen, mode, executionDetails, scenarioName, testCaseTitle, testCaseId]);

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

      let resultBug: BugEntity;

      if (isEditMode && existingBugId) {
        // Update existing bug - Use UpdateBugDTO (only allowed fields)
        const updateData: UpdateBugDTO = {
          title: title.trim(),
          description: description.trim(),
          steps_to_reproduce: validSteps,
          expected_behavior: expectedBehavior.trim(),
          actual_behavior: actualBehavior.trim(),
          severity,
          priority,
          bug_type: bugType,
          assigned_to: assignedTo.trim() || undefined,
        };

        console.log('📝 Updating bug with data:', updateData);
        resultBug = await bugApi.update(existingBugId, updateData);
        toast.success(`Bug ${resultBug.id} updated successfully`);
      } else {
        // Create new bug - Use CreateBugDTO (all fields including context)
        const createData: CreateBugDTO = {
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
          execution_id: executionDetails?.execution_id && executionDetails.execution_id > 0 ? executionDetails.execution_id : undefined,
          reported_by: 'QA Tester', // TODO: Get from auth context
          assigned_to: assignedTo.trim() || undefined,
          screenshots: attachments.length > 0 ? attachments : undefined,
        };

        console.log('📤 Creating bug with data:', createData);
        console.log('📸 Evidence files from attachments state:', attachments);
        resultBug = await bugApi.create(createData);
        toast.success(`Bug ${resultBug.id} created successfully`);
      }

      if (onSuccess) {
        onSuccess(resultBug);
      }

      handleClose();
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} bug:`, error);
      toast.error(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} bug report`);
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
    setAttachments([]);
    setErrors({});

    onClose();
  };

  if (!isOpen) return null;

  // Get design tokens
  const modalSpacing = getComponentSpacing('modal');
  const modalShadow = getComponentShadow('modal');
  const titleTypography = getModalTypography('modalTitle');
  const subtitleTypography = getModalTypography('modalSectionTitle');
  const labelTypography = getModalTypography('formLabel');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${colors.white} ${borderRadius.xl} ${modalShadow.base} w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`${modalSpacing.padding} border-b ${colors.status.error.gradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${colors.status.error[100]} ${modalSpacing.padding} ${borderRadius.lg}`}>
                <Bug size={24} className={colors.status.error.text600} />
              </div>
              <div>
                <h2 className={`${titleTypography.className} ${colors.gray.text900}`}>
                  {isReadonly ? 'Bug Details' : isEditMode ? 'Update Bug' : 'Report Bug'}
                </h2>
                <p className={`${subtitleTypography.className} ${colors.gray.text600} mt-1`}>
                  {isReadonly
                    ? 'View bug report details'
                    : isEditMode
                    ? 'Update the bug report information'
                    : 'Document a defect found during testing'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`${colors.gray.text400} hover:text-gray-600 p-2 ${borderRadius.full} hover:bg-white/50 transition-colors`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Edit Button (Readonly mode only) */}
          {isReadonly && existingBugId && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  navigate(`/bugs/${existingBugId}`);
                  handleClose();
                }}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white ${borderRadius.lg} hover:bg-blue-700 transition-colors`}
              >
                <ExternalLink size={16} />
                Edit in Bug Details Page
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {isLoadingBug ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading bug details...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Context Info (if from execution) */}
              {executionDetails && (
              <div className={`${colors.brand.primary[50]} border ${colors.brand.primary.border200} ${borderRadius.lg} p-4`}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className={`${colors.brand.primary.text600} mt-0.5 flex-shrink-0`} />
                  <div className={subtitleTypography.className}>
                    <p className={`font-medium ${colors.brand.primary.text900} mb-1`}>Pre-filled from Execution #{executionDetails.execution_id}</p>
                    {scenarioName && (
                      <p className={`${colors.brand.primary.text900} font-semibold mb-1`}>
                        📋 Scenario: {scenarioName}
                      </p>
                    )}
                    <p className={`${colors.brand.primary.text700}`}>
                      {testCaseId && `Test Case: ${testCaseId} • `}
                      Environment: {executionDetails.environment}
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
                disabled={isReadonly}
                className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.title ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                } ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                disabled={isReadonly}
                rows={4}
                className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.description ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                } ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                        disabled={isReadonly}
                        className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.stepsToReproduce ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                        } ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder={`Step ${index + 1}`}
                      />
                    </div>
                    {!isReadonly && stepsToReproduce.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className={`px-3 py-2 ${colors.status.error.text600} hover:bg-red-50 ${borderRadius.lg} transition-colors`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {!isReadonly && (
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className={`${subtitleTypography.className} ${colors.brand.primary.text600} hover:text-blue-700 font-medium`}
                  >
                    + Add Step
                  </button>
                )}
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
                  disabled={isReadonly}
                  rows={3}
                  className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.expectedBehavior ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                  } ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                  disabled={isReadonly}
                  rows={3}
                  className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.actualBehavior ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                  } ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                  disabled={isReadonly}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                  disabled={isReadonly}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                disabled={isReadonly}
                className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                  disabled={isReadonly}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                  disabled={isReadonly}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                  disabled={isReadonly}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                  disabled={isReadonly}
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                disabled={isReadonly}
                className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-red-500 focus:border-transparent ${isReadonly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="Email or name of assignee"
              />
            </div>

            {/* Evidence/Attachments - Display only */}
            {attachments.length > 0 && (
              <div>
                <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                  Evidence / Screenshots ({attachments.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.map((attachment, index) => (
                    <div key={index} className={`relative ${borderRadius.lg} overflow-hidden border ${colors.gray.border300}`}>
                      <img
                        src={attachment.startsWith('http') ? attachment : `/api/v1/evidence/${attachment}`}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(attachment.startsWith('http') ? attachment : `/api/v1/evidence/${attachment}`, '_blank')}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1">
                        Evidence {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </form>

        {/* Footer */}
        <div className={`${modalSpacing.padding} border-t ${colors.gray[50]} flex justify-end gap-3`}>
          {isReadonly ? (
            <>
              {/* Readonly mode: Only Close and View Details buttons */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  if (existingBugId) {
                    navigate(`/projects/${projectId}/bugs/${existingBugId}`);
                  }
                }}
                leftIcon={<ExternalLink size={18} />}
              >
                View Full Details
              </Button>
            </>
          ) : (
            <>
              {/* Create/Edit mode: Cancel and Create/Update buttons */}
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
                {isSubmitting
                  ? (isEditMode ? 'Updating Bug...' : 'Creating Bug...')
                  : (isEditMode ? 'Update Bug Report' : 'Create Bug Report')
                }
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
