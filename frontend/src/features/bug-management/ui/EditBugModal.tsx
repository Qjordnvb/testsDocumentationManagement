import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { bugApi } from '@/entities/bug';
import type { Bug, BugSeverity, BugPriority, BugType, UpdateBugDTO } from '@/entities/bug';
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
  onSuccess?: (bug: Bug) => void;
  bug: Bug;
}

export const EditBugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  bug,
}) => {
  // Form state - initialize with bug data
  const [title, setTitle] = useState(bug.title);
  const [description, setDescription] = useState(bug.description);
  const [stepsToReproduce, setStepsToReproduce] = useState<string[]>(bug.steps_to_reproduce);
  const [expectedBehavior, setExpectedBehavior] = useState(bug.expected_behavior);
  const [actualBehavior, setActualBehavior] = useState(bug.actual_behavior);
  const [severity, setSeverity] = useState<BugSeverity>(bug.severity);
  const [priority, setPriority] = useState<BugPriority>(bug.priority);
  const [bugType, setBugType] = useState<BugType>(bug.bug_type);
  const [assignedTo, setAssignedTo] = useState(bug.assigned_to || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when bug changes
  useEffect(() => {
    if (bug && isOpen) {
      setTitle(bug.title);
      setDescription(bug.description);
      setStepsToReproduce(bug.steps_to_reproduce);
      setExpectedBehavior(bug.expected_behavior);
      setActualBehavior(bug.actual_behavior);
      setSeverity(bug.severity);
      setPriority(bug.priority);
      setBugType(bug.bug_type);
      setAssignedTo(bug.assigned_to || '');
    }
  }, [bug, isOpen]);

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

      const updates: UpdateBugDTO = {
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

      const updatedBug = await bugApi.update(bug.id, updates);

      toast.success(`Bug ${updatedBug.id} updated successfully`);

      if (onSuccess) {
        onSuccess(updatedBug);
      }

      handleClose();
    } catch (error: any) {
      console.error('Error updating bug:', error);
      toast.error(error.response?.data?.detail || 'Failed to update bug');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
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
        <div className={`${modalSpacing.padding} border-b ${colors.brand.primary.gradient}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`${titleTypography.className} ${colors.gray.text900}`}>Edit Bug Report</h2>
              <p className={`${subtitleTypography.className} ${colors.gray.text600} mt-1`}>
                Modify bug details - {bug.id}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`${colors.gray.text400} hover:text-gray-600 p-2 ${borderRadius.full} hover:bg-white/50 transition-colors`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Title */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Bug Title <span className={colors.status.error.text500}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                }`}
                placeholder="Brief summary of the bug"
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
                className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                        className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.stepsToReproduce ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                        }`}
                        placeholder={`Step ${index + 1}`}
                      />
                    </div>
                    {stepsToReproduce.length > 1 && (
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
                <button
                  type="button"
                  onClick={handleAddStep}
                  className={`${subtitleTypography.className} ${colors.brand.primary.text600} hover:text-blue-700 font-medium`}
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
                  className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                  className={`w-full px-4 py-2 border ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                  className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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

            {/* Assign To */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Assign To
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className={`w-full px-4 py-2 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Save size={18} /> : undefined}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
