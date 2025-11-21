/**
 * Modal Component - Design System
 * Reusable modal dialog with backdrop and animations
 *
 * Now uses centralized design tokens from @/shared/design-system/tokens
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../Button';
import {
  getComponentSpacing,
  getComponentShadow,
  getModalTypography,
  containerWidth,
  borderRadius,
  colors,
  gap,
} from '@/shared/design-system/tokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}: ModalProps) => {
  // Get design tokens
  const headerSpacing = getComponentSpacing('modalHeader');
  const bodySpacing = getComponentSpacing('modalBody');
  const footerSpacing = getComponentSpacing('modalFooter');
  const shadow = getComponentShadow('modal');
  const titleTypography = getModalTypography('modalTitle');

  const sizeMap = {
    sm: containerWidth.md,
    md: containerWidth.lg,
    lg: containerWidth['2xl'],
    xl: containerWidth['4xl'],
    full: containerWidth['7xl'],
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white ${borderRadius.xl} ${shadow.base}
          ${sizeMap[size]} w-full mx-4 max-h-[90vh]
          flex flex-col animate-fade-in-up
        `.replace(/\s+/g, ' ').trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between ${headerSpacing.padding} border-b ${colors.gray.border200}`}>
            {title && (
              <h2 id="modal-title" className={`${titleTypography.className} ${colors.gray.text900}`}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  ${colors.gray.text400} hover:text-gray-600
                  transition-colors p-1 ${borderRadius.lg} hover:bg-gray-100
                `.replace(/\s+/g, ' ').trim()}
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`${bodySpacing.padding} overflow-y-auto flex-1`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`
            ${footerSpacing.padding} ${footerSpacing.gap}
            border-t ${colors.gray.border200}
            flex items-center justify-end
          `.replace(/\s+/g, ' ').trim()}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Convenience component for modal footer with Cancel/Confirm buttons
export const ModalFooter = ({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  isLoading = false,
  confirmVariant = 'primary' as const,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
  confirmVariant?: 'primary' | 'danger' | 'success';
}) => (
  <>
    <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
      {cancelText}
    </Button>
    <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
      {confirmText}
    </Button>
  </>
);
