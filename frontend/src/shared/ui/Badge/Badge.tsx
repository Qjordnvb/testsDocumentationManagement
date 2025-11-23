/**
 * Badge Component - Design System
 * Reusable badge for status, priority, and labels
 *
 * Now uses centralized design tokens from @/shared/design-system/tokens
 */

import type { ReactNode } from 'react';
import {
  getBadgeVariantClasses,
  getComponentSpacing,
  borderRadius,
} from '@/shared/design-system/tokens';
import type { BadgeVariant } from '@/shared/design-system/tokens';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}: BadgeProps) => {
  // Get design tokens
  const variantClasses = getBadgeVariantClasses(variant);
  const sizeMap = {
    sm: 'badgeSmall',
    md: 'badgeMedium',
    lg: 'badgeLarge',
  };
  const spacing = getComponentSpacing(sizeMap[size]);

  // Font size mapping
  const fontSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const combinedClasses = `
    inline-flex items-center font-medium border
    ${borderRadius.full}
    ${spacing.padding}
    ${spacing.gap}
    ${fontSizeMap[size]}
    ${variantClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <span className={combinedClasses}>
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

// Role Badge
export const RoleBadge = ({
  role,
}: {
  role: 'admin' | 'qa' | 'dev' | 'manager';
}) => {
  const variantMap = {
    admin: 'danger' as const,
    qa: 'success' as const,
    dev: 'primary' as const,
    manager: 'warning' as const,
  };

  const iconMap = {
    admin: '🔑',
    qa: '🧪',
    dev: '💻',
    manager: '👔',
  };

  const labelMap = {
    admin: 'ADMIN',
    qa: 'QA',
    dev: 'DEV',
    manager: 'MANAGER',
  };

  return (
    <Badge variant={variantMap[role]} icon={iconMap[role]}>
      {labelMap[role]}
    </Badge>
  );
};
