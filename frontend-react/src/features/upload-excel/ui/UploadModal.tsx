/**
 * Upload Excel Feature - UI Component
 * Modal for uploading Excel/CSV files with drag & drop
 */

import { useState, useCallback } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useUploadStore } from '../model/uploadStore';
import { uploadFile } from '../api/uploadFile';
import { validateFile, formatFileSize } from '../lib/fileValidator';
import { Upload, X, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadModal = ({ isOpen, onClose, onSuccess }: UploadModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const {
    isUploading,
    uploadProgress,
    uploadError,
    uploadedFile,
    setIsUploading,
    setUploadProgress,
    setUploadError,
    setUploadedFile,
    resetUpload,
  } = useUploadStore();

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle file
  const handleFile = (file: File) => {
    setUploadError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Archivo inválido');
      return;
    }

    setUploadedFile(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const response = await uploadFile(uploadedFile, (progress) => {
        setUploadProgress(progress);
      });

      // Success
      console.log('Upload successful:', response);

      // Close modal and refresh stories
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(
        error.response?.data?.detail || 'Error al subir el archivo'
      );
      setIsUploading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    resetUpload();
    onClose();
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Subir Excel/CSV">
      <div className="space-y-4">
        {/* Drop zone */}
        {!uploadedFile && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Arrastra y suelta tu archivo aquí, o{' '}
              <label htmlFor="file-upload" className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                selecciona un archivo
              </label>
            </p>
            <p className="text-xs text-gray-500">
              Formatos aceptados: .xlsx, .xls, .csv (máx. 10MB)
            </p>
          </div>
        )}

        {/* Selected file */}
        {uploadedFile && !isUploading && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <FileSpreadsheet className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile?.name}
                </p>
                <p className="text-xs text-gray-500">Subiendo...</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">{uploadProgress}%</p>
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!uploadedFile || isUploading}
          >
            {isUploading ? 'Subiendo...' : 'Subir archivo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
