/**
 * Bug Badge Utilities
 * Pure functions for badge styling and icons
 */

import type { BugStatus, BugSeverity, BugPriority } from '@/entities/bug';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Bug as BugIcon,
} from 'lucide-react';

/**
 * Get CSS classes for status badge
 */
export const getStatusBadgeClass = (status: BugStatus): string => {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800';
    case 'Assigned':
      return 'bg-purple-100 text-purple-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Fixed':
      return 'bg-green-100 text-green-800';
    case 'Testing':
      return 'bg-indigo-100 text-indigo-800';
    case 'Verified':
      return 'bg-teal-100 text-teal-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    case 'Reopened':
      return 'bg-red-100 text-red-800';
    case "Won't Fix":
      return 'bg-gray-100 text-gray-600';
    case 'Duplicate':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS classes for severity badge
 */
export const getSeverityBadgeClass = (severity: BugSeverity): string => {
  switch (severity) {
    case 'Critical':
      return 'bg-red-600 text-white';
    case 'High':
      return 'bg-orange-500 text-white';
    case 'Medium':
      return 'bg-yellow-500 text-white';
    case 'Low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

/**
 * Get CSS classes for priority badge
 */
export const getPriorityBadgeClass = (priority: BugPriority): string => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-800 border border-red-300';
    case 'High':
      return 'bg-orange-100 text-orange-800 border border-orange-300';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case 'Low':
      return 'bg-green-100 text-green-800 border border-green-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get icon component for bug status
 */
export const getStatusIcon = (status: BugStatus) => {
  switch (status) {
    case 'Verified':
    case 'Closed':
      return <CheckCircle2 size={16} className="text-green-600" />;
    case 'Fixed':
      return <CheckCircle2 size={16} className="text-teal-600" />;
    case 'In Progress':
    case 'Testing':
      return <Clock size={16} className="text-yellow-600" />;
    case 'Reopened':
      return <AlertCircle size={16} className="text-red-600" />;
    case "Won't Fix":
    case 'Duplicate':
      return <XCircle size={16} className="text-gray-500" />;
    default:
      return <BugIcon size={16} className="text-blue-600" />;
  }
};

/**
 * Format date to Spanish locale
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
