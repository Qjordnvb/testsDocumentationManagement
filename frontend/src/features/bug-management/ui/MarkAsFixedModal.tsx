/**
 * MarkAsFixedModal - DEV workflow modal for marking bug as Fixed
 * Requires fix_description (min 20 chars) + optional root_cause, workaround, and evidence files
 */

import React, { useState, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Paperclip, Image as ImageIcon, Upload } from 'lucide-react';
import { colors, borderRadius, getModalTypography, getComponentSpacing } from '@/shared/design-system/tokens';

interface MarkAsFixedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fixData: {
    fix_description: string;
    root_cause?: string;
    workaround?: string;
    evidence_files?: File[];
  }) => Promise<void>;
  bugId: string;
}

export const MarkAsFixedModal: React.FC<MarkAsFixedModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bugId,
}) => {
  const [fixDescription, setFixDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [workaround, setWorkaround] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalSpacing = getComponentSpacing('modal');
  const titleTypography = getModalTypography('modalTitle');
  const labelTypography = getModalTypography('formLabel');
  const bodyTypography = getModalTypography('formHelper');

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fixDescription.trim()) {
      newErrors.fixDescription = 'Fix description is required';
    } else if (fixDescription.trim().length < 20) {
      newErrors.fixDescription = 'Fix description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      // Allow images and common file types
      const validFiles = newFiles.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const isDoc = file.type.includes('document') || file.name.endsWith('.txt');
        return isImage || isPdf || isDoc;
      });

      if (validFiles.length !== newFiles.length) {
        alert('Some files were skipped. Only images, PDFs, and documents are allowed.');
      }

      setEvidenceFiles(prev => [...prev, ...validFiles]);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm({
        fix_description: fixDescription.trim(),
        root_cause: rootCause.trim() || undefined,
        workaround: workaround.trim() || undefined,
        evidence_files: evidenceFiles.length > 0 ? evidenceFiles : undefined,
      });

      // Reset form
      setFixDescription('');
      setRootCause('');
      setWorkaround('');
      setEvidenceFiles([]);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error marking bug as fixed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFixDescription('');
      setRootCause('');
      setWorkaround('');
      setEvidenceFiles([]);
      setErrors({});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div
        className={`bg-white ${borderRadius.xl} shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${modalSpacing.padding} border-b bg-gradient-to-r from-green-50 to-emerald-50`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${colors.status.success[100]} p-2 ${borderRadius.lg}`}>
                <CheckCircle2 size={24} className={colors.status.success.text600} />
              </div>
              <div>
                <h2 className={`${titleTypography.className} ${colors.gray.text900}`}>
                  Mark Bug as Fixed
                </h2>
                <p className={`${bodyTypography.className} ${colors.gray.text600} mt-1`}>
                  Document the fix for bug {bugId}
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
            {/* Info Alert */}
            <div className={`${colors.brand.primary[50]} border ${colors.brand.primary.border200} ${borderRadius.lg} p-4`}>
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className={`${colors.brand.primary.text600} mt-0.5 flex-shrink-0`} />
                <div>
                  <p className={`${bodyTypography.className} ${colors.brand.primary.text900} font-medium mb-1`}>
                    Required Information
                  </p>
                  <p className={`text-sm ${colors.brand.primary.text700}`}>
                    Explain what you fixed and how. This helps QA verify the fix and creates documentation for future reference.
                  </p>
                </div>
              </div>
            </div>

            {/* Fix Description */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Fix Description <span className={colors.status.error.text500}>*</span>
              </label>
              <textarea
                value={fixDescription}
                onChange={(e) => setFixDescription(e.target.value)}
                disabled={isSubmitting}
                rows={5}
                className={`w-full px-4 py-3 border ${borderRadius.lg} focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.fixDescription ? `${colors.status.error.border300} ${colors.status.error[50]}` : colors.gray.border300
                } ${isSubmitting ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''}`}
                placeholder="Describe the fix in detail:
- What was changed?
- Which files/modules were modified?
- How does this resolve the issue?

Example:
Fixed null pointer exception in UserService.login() method.
Added validation check for empty email field before database query.
Updated error handling to return proper HTTP 400 status."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.fixDescription ? (
                  <p className={`text-sm ${colors.status.error.text600}`}>{errors.fixDescription}</p>
                ) : (
                  <p className={`text-sm ${colors.gray.text500}`}>
                    Minimum 20 characters
                  </p>
                )}
                <p className={`text-sm ${fixDescription.length >= 20 ? colors.status.success.text600 : colors.gray.text500}`}>
                  {fixDescription.length} characters
                </p>
              </div>
            </div>

            {/* Root Cause */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Root Cause <span className={`text-sm ${colors.gray.text500} font-normal`}>(Optional)</span>
              </label>
              <textarea
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className={`w-full px-4 py-3 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  isSubmitting ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''
                }`}
                placeholder="What was the underlying cause of this bug?

Example:
Missing input validation in registration form.
Incorrect assumption about API response format.
Race condition in concurrent request handling."
              />
            </div>

            {/* Workaround */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Workaround <span className={`text-sm ${colors.gray.text500} font-normal`}>(Optional)</span>
              </label>
              <textarea
                value={workaround}
                onChange={(e) => setWorkaround(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className={`w-full px-4 py-3 border ${colors.gray.border300} ${borderRadius.lg} focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  isSubmitting ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''
                }`}
                placeholder="Is there a temporary workaround users can apply?

Example:
Clear browser cache and cookies before login.
Use incognito mode for the registration process.
Manually refresh the page after submitting."
              />
            </div>

            {/* Evidence Upload */}
            <div>
              <label className={`block ${labelTypography.className} ${colors.gray.text700} mb-2`}>
                Evidence / Screenshots <span className={`text-sm ${colors.gray.text500} font-normal`}>(Optional)</span>
              </label>
              <p className={`text-sm ${colors.gray.text600} mb-3`}>
                Upload screenshots or files that demonstrate the fix (images, PDFs, or documents)
              </p>

              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                disabled={isSubmitting}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border-2 border-dashed ${colors.gray.border300} ${borderRadius.lg} hover:border-green-400 hover:bg-green-50 transition-all flex items-center justify-center gap-2 ${colors.gray.text600} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Upload size={20} />
                <span className="font-medium">Click to upload files</span>
              </button>

              {/* File Preview */}
              {evidenceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className={`text-sm ${colors.gray.text700} font-medium`}>
                    Selected files ({evidenceFiles.length}):
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {evidenceFiles.map((file, index) => {
                      const isImage = file.type.startsWith('image/');
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 border ${colors.gray.border200} ${borderRadius.lg} bg-gray-50`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isImage ? (
                              <ImageIcon size={20} className={colors.status.success.text600} />
                            ) : (
                              <Paperclip size={20} className={colors.gray.text500} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${colors.gray.text900} truncate font-medium`}>
                                {file.name}
                              </p>
                              <p className={`text-xs ${colors.gray.text500}`}>
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            disabled={isSubmitting}
                            className={`${colors.status.error.text600} hover:bg-red-50 p-2 ${borderRadius.base} transition-colors disabled:opacity-50`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
            className={`px-5 py-2.5 text-white bg-green-600 hover:bg-green-700 ${borderRadius.lg} font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? 'Saving Fix...' : 'Save Fix & Mark as Fixed'}
          </button>
        </div>
      </div>
    </div>
  );
};
