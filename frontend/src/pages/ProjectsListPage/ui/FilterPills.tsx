/**
 * Filter Pills Component
 * Status filter pills with counts
 */

import type { ProjectFilterStatus } from '../model/useProjectsList';

interface FilterPillsProps {
  activeFilter: ProjectFilterStatus;
  onFilterChange: (filter: ProjectFilterStatus) => void;
  counts: {
    all: number;
    active: number;
    archived: number;
    completed: number;
  };
}

export const FilterPills = ({ activeFilter, onFilterChange, counts }: FilterPillsProps) => {
  const pills: Array<{ key: ProjectFilterStatus; label: string; count: number }> = [
    { key: 'all', label: 'Todos', count: counts.all },
    { key: 'active', label: 'Activos', count: counts.active },
    { key: 'archived', label: 'Pausados', count: counts.archived },
    { key: 'completed', label: 'Completados', count: counts.completed },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {pills.map((pill) => (
        <button
          key={pill.key}
          onClick={() => onFilterChange(pill.key)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${
              activeFilter === pill.key
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
            }
          `}
        >
          {pill.label} · {pill.count}
        </button>
      ))}
    </div>
  );
};
