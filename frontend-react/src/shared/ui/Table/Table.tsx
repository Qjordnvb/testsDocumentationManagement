/**
 * Table Component - Design System
 * Reusable table components with consistent styling
 */

import type { ReactNode, HTMLAttributes } from 'react';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const Table = ({ children, className = '', ...props }: TableProps) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHead = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({
  children,
  clickable = false,
  className = '',
  ...props
}: {
  children: ReactNode;
  clickable?: boolean;
  className?: string;
} & HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`
      ${clickable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </tr>
);

export const TableHeader = ({ children, className = '', ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = '', colSpan, ...props }: { children: ReactNode; className?: string; colSpan?: number } & HTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`} colSpan={colSpan} {...props}>
    {children}
  </td>
);

// Empty state for tables
export const TableEmpty = ({ message = 'No data available', icon = '📭' }: { message?: string; icon?: string }) => (
  <TableRow>
    <TableCell colSpan={999} className="text-center py-12">
      <div className="flex flex-col items-center justify-center text-gray-400">
        <span className="text-6xl mb-4">{icon}</span>
        <p className="text-lg">{message}</p>
      </div>
    </TableCell>
  </TableRow>
);

// Loading state for tables
export const TableLoading = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <TableCell key={j}>
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);
