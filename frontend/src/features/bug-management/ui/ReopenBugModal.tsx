/**
 * ReopenBugModal - QA workflow modal for reopening a Fixed bug
 * Requires reason (min 10 chars) - stored in notes field
 */

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { colors, borderRadius, getModalTypography, getComponentSpacing } from '@/shared/design-system/tokens';

interface ReopenBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bugId: string;
}

export const ReopenBugModal: React.FC<ReopenBugModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bugId,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const modalSpacing = getComponentSpacing('modal');
  const titleTypography = getModalTypography('modalTitle');
  const labelTypography = getModalTypography('formLabel');
  const bodyTypography = getModalTypography('formHelper');

  if (!isOpen) return null;

  const validate = (): boolean => {
    if (!reason.trim()) {
      setError('Reason is required');
      return false;
    }
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm(reason.trim());

      // Reset form
      setReason('');
      setError('');
      onClose();
    } catch (error) {
      console.error('Error reopening bug:', error);
      setError('Failed to reopen bug. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div
        className={`bg-white ${borderRadius.xl} shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${modalSpacing.padding} border-b bg-gradient-to-r from-orange-50 to-red-50`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${colors.orange[100]} p-2 ${borderRadius.lg}`}>
                <AlertCircle size={24} className={colors.orange.text600} />
              </div>
              <div>
                <h2 className={`${titleTypography.className} ${colors.gray.text900}`}>
                  Reopen Bug
                </h2>
                <p className={`${bodyTypography.className} ${colors.gray.text600} mt-1`}>
                  Bug {bugId} - Fix verification failed
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className={`${colors.gray.text400} hover:text-gray-600 p-1 ${borderRadius.full} transition-colors disabled:opacity-50`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Warning Alert */}
            <div className={`${colors.status.warning[50]} border ${colors.status.warning.border200} ${borderRadius.lg} p-4`}>
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className={`${colors.status.warning.text600} mt-0.5 flex-shrink-0`} />
                <div>
                  <p className={`${bodyTypography.className} ${colors.status.warning.text900} font-medium mb-1`}>
                    Fix Still Not Working?
                  </p>
                  <p className={`text-sm ${colors.status.warning.text700}`}>
                    Explain why the fix didn't resolve the issue. The developer will receive your feedback and work on it again.
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Reason for Reopening <span className={colors.status.error.text500}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                rows={6}
                className={`w-full px-4 py-3 border ${borderRadius.lg} focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  error ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                } ${isSubmitting ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''}`}
                placeholder="Explain why the fix didn't work:
- What still doesn't work?
- What did you test?
- What was the outcome?
- Any error messages?

Example:
Retested login functionality in Chrome. The issue persists:
- Still getting null pointer exception on empty email
- Error appears in console: 'Cannot read property email of undefined'
- Expected: Proper validation message
- Actual: Page crashes

Please verify the validation was added to the correct form field."
              />
              <div className="flex justify-between items-center mt-1">
                {error ? (
                  <p className={`text-sm ${colors.status.error.text600}`}>{error}</p>
                ) : (
                  <p className={`text-sm ${colors.gray.text500}`}>
                    Minimum 10 characters - Be specific to help the developer
                  </p>
                )}
                <p className={`text-sm ${reason.length >= 10 ? colors.status.success.text600 : colors.gray.text500}`}>
                  {reason.length} characters
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`${modalSpacing.padding} border-t ${colors.gray[50]} flex justify-end gap-3`}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className={`px-5 py-2.5 ${colors.gray.text700} bg-white border ${colors.gray.border300} hover:bg-gray-50 ${borderRadius.lg} font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-5 py-2.5 text-white bg-orange-600 hover:bg-orange-700 ${borderRadius.lg} font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? 'Reopening Bug...' : 'Reopen Bug'}
          </button>
        </div>
      </div>
    </div>
  );
};
