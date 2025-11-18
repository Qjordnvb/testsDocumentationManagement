/**
 * Upload Excel Feature - File Validation
 * Validates uploaded files before sending to backend
 */

const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates file extension
 */
export const validateFileExtension = (file: File): ValidationResult => {
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop();

  if (!extension) {
    return {
      isValid: false,
      error: 'El archivo no tiene una extensión válida',
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Solo se permiten archivos .${ALLOWED_EXTENSIONS.join(', .')}. Tu archivo: .${extension}`,
    };
  }

  return { isValid: true };
};

/**
 * Validates file size
 */
export const validateFileSize = (file: File): ValidationResult => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `El archivo no debe superar ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  return { isValid: true };
};

/**
 * Validates file completely
 */
export const validateFile = (file: File): ValidationResult => {
  // Check extension
  const extensionResult = validateFileExtension(file);
  if (!extensionResult.isValid) {
    return extensionResult;
  }

  // Check size
  const sizeResult = validateFileSize(file);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  return { isValid: true };
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
};
