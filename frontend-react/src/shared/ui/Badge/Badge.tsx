/**
 * Badge Component - Design System
 * Reusable badge for status, priority, and labels
 */

import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700 border-gray-300',
  primary: 'bg-blue-100 text-blue-700 border-blue-300',
  success: 'bg-green-100 text-green-700 border-green-300',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  danger: 'bg-red-100 text-red-700 border-red-300',
  info: 'bg-purple-100 text-purple-700 border-purple-300',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}: BadgeProps) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

// Convenience components for common use cases

// Priority Badge
export const PriorityBadge = ({ priority }: { priority: 'Critical' | 'High' | 'Medium' | 'Low' }) => {
  const variantMap = {
    Critical: 'danger' as const,
    High: 'warning' as const,
    Medium: 'info' as const,
    Low: 'default' as const,
  };

  const iconMap = {
    Critical: '🔴',
    High: '🟠',
    Medium: '🟡',
    Low: '⚪',
  };

  return (
    <Badge variant={variantMap[priority]} icon={iconMap[priority]}>
      {priority}
    </Badge>
  );
};

// Status Badge
export const StatusBadge = ({
  status,
}: {
  status: 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Testing' | 'Done';
}) => {
  const variantMap = {
    'Backlog': 'default' as const,
    'To Do': 'info' as const,
    'In Progress': 'warning' as const,
    'In Review': 'primary' as const,
    'Testing': 'warning' as const,
    'Done': 'success' as const,
  };

  const iconMap = {
    'Backlog': '📋',
    'To Do': '📝',
    'In Progress': '⚙️',
    'In Review': '👀',
    'Testing': '🧪',
    'Done': '✅',
  };

  return (
    <Badge variant={variantMap[status]} icon={iconMap[status]}>
      {status}
    </Badge>
  );
};

// Test Status Badge
export const TestStatusBadge = ({ status }: { status: 'pending' | 'passed' | 'failed' | 'skipped' }) => {
  const variantMap = {
    pending: 'default' as const,
    passed: 'success' as const,
    failed: 'danger' as const,
    skipped: 'warning' as const,
  };

  const iconMap = {
    pending: '⏳',
    passed: '✅',
    failed: '❌',
    skipped: '⏭️',
  };

  const labelMap = {
    pending: 'Pending',
    passed: 'Passed',
    failed: 'Failed',
    skipped: 'Skipped',
  };

  return (
    <Badge variant={variantMap[status]} icon={iconMap[status]}>
      {labelMap[status]}
    </Badge>
  );
};

// Bug Severity Badge
export const BugSeverityBadge = ({
  severity,
}: {
  severity: 'Critical' | 'Major' | 'Minor' | 'Trivial';
}) => {
  const variantMap = {
    Critical: 'danger' as const,
    Major: 'warning' as const,
    Minor: 'info' as const,
    Trivial: 'default' as const,
  };

  const iconMap = {
    Critical: '🔴',
    Major: '🟠',
    Minor: '🟡',
    Trivial: '⚪',
  };

  return (
    <Badge variant={variantMap[severity]} icon={iconMap[severity]}>
      {severity}
    </Badge>
  );
};

// Bug Status Badge
export const BugStatusBadge = ({
  status,
}: {
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
}) => {
  const variantMap = {
    'Open': 'danger' as const,
    'In Progress': 'warning' as const,
    'Resolved': 'success' as const,
    'Closed': 'default' as const,
    'Rejected': 'info' as const,
  };

  const iconMap = {
    'Open': '🐛',
    'In Progress': '⚙️',
    'Resolved': '✅',
    'Closed': '🔒',
    'Rejected': '❌',
  };

  return (
    <Badge variant={variantMap[status]} icon={iconMap[status]}>
      {status}
    </Badge>
  );
};
