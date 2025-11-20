/**
 * ConfirmModal - Reusable Confirmation Dialog
 *
 * A professional, customizable confirmation modal to replace window.confirm()
 * Supports different variants for different use cases
 */

import React from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export type ConfirmVariant = 'info' | 'warning' | 'danger' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          headerBg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          icon: <AlertTriangle size={24} />,
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'danger':
        return {
          headerBg: 'bg-gradient-to-r from-red-50 to-pink-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          icon: <XCircle size={24} />,
          buttonBg: 'bg-red-600 hover:bg-red-700',
        };
      case 'success':
        return {
          headerBg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          icon: <CheckCircle size={24} />,
          buttonBg: 'bg-green-600 hover:bg-green-700',
        };
      default: // info
        return {
          headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          icon: <Info size={24} />,
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b ${styles.headerBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${styles.iconBg} p-2 rounded-lg`}>
                <div className={styles.iconColor}>
                  {styles.icon}
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-white ${styles.buttonBg} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
