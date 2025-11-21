/**
 * Story Table Widget
 * Interactive table for displaying user stories with filters and actions
 */

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type ExpandedState,
} from '@tanstack/react-table';
import type { UserStory } from '@/entities/user-story';
import { Button } from '@/shared/ui/Button';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface StoryTableProps {
  stories: UserStory[];
  onGenerateTests: (story: UserStory) => void;
  onUpdateStory?: (storyId: string, updates: Partial<UserStory>) => Promise<void>;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const columnHelper = createColumnHelper<UserStory>();

export const StoryTable = ({ stories, onGenerateTests, onUpdateStory }: StoryTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Typography presets
  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');

  // Toggle acceptance criteria completed status
  const toggleCriteria = async (story: UserStory, criterionIndex: number) => {
    if (!onUpdateStory) return;

    const updatedCriteria = [...story.acceptance_criteria];
    updatedCriteria[criterionIndex] = {
      ...updatedCriteria[criterionIndex],
      completed: !updatedCriteria[criterionIndex].completed
    };

    try {
      await onUpdateStory(story.id, { acceptance_criteria: updatedCriteria });
    } catch (error) {
      console.error('Error updating criterion:', error);
    }
  };

  // Define columns
  const columns = useMemo<ColumnDef<UserStory, any>[]>(
    () => [
      columnHelper.display({
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            row.toggleExpanded();
          };

          return (
            <button
              onClick={handleClick}
              className={`flex items-center justify-center w-8 h-8 hover:bg-gray-100 ${borderRadius.base} transition-colors`}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className={`w-4 h-4 ${colors.gray.text600}`} />
              ) : (
                <ChevronRightIcon className={`w-4 h-4 ${colors.gray.text600}`} />
              )}
            </button>
          );
        },
      }),
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => (
          <span className={`font-mono ${bodySmall.className} ${colors.gray.text600}`}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Título',
        cell: (info) => (
          <div className="max-w-md">
            <p className={`font-medium ${colors.gray.text900} truncate`}>{info.getValue()}</p>
          </div>
        ),
      }),
      columnHelper.accessor('acceptance_criteria', {
        header: 'Criterios',
        cell: (info) => {
          const criteria = info.getValue() || [];
          const completed = criteria.filter((c: { completed: boolean }) => c.completed).length;
          const percentage = criteria.length > 0 ? (completed / criteria.length) * 100 : 0;

          return (
            <div className="flex items-center gap-2" title={`${completed} de ${criteria.length} criterios completados (${percentage.toFixed(0)}%)`}>
              {/* Contador con color dinámico */}
              <span className={`${bodySmall.className} font-semibold ${
                completed === 0 ? 'text-gray-400' :
                percentage === 100 ? 'text-green-600' :
                'text-blue-600'
              }`}>
                {completed}/{criteria.length}
              </span>

              {/* Barra de progreso con mejor visualización */}
              {criteria.length > 0 && (
                <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                  <div
                    className={`h-full transition-all duration-300 ${
                      percentage === 100 ? 'bg-green-500' :
                      percentage > 0 ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('priority', {
        header: 'Prioridad',
        cell: (info) => {
          const priority = info.getValue();
          const priorityColors = {
            Critical: `${colors.status.error[100]} ${colors.status.error.text800}`,
            High: `bg-orange-100 text-orange-800`,
            Medium: `${colors.status.warning[100]} ${colors.status.warning.text800}`,
            Low: `${colors.gray[100]} ${colors.gray.text800}`,
          };
          return (
            <span className={`px-2 py-1 ${bodySmall.className} font-medium ${borderRadius.base} ${priorityColors[priority as keyof typeof priorityColors] || priorityColors.Medium}`}>
              {priority}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => {
          const status = info.getValue();
          const statusColors = {
            Backlog: `${colors.gray[100]} ${colors.gray.text800}`,
            'To Do': `${colors.status.info[100]} ${colors.status.info.text800}`,
            'In Progress': `bg-purple-100 text-purple-800`,
            'In Review': `${colors.status.warning[100]} ${colors.status.warning.text800}`,
            Testing: `bg-orange-100 text-orange-800`,
            Done: `${colors.status.success[100]} ${colors.status.success.text800}`,
          };
          return (
            <span className={`px-2 py-1 ${bodySmall.className} font-medium ${borderRadius.base} ${statusColors[status as keyof typeof statusColors] || statusColors.Backlog}`}>
              {status}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Acciones',
        cell: (info) => (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onGenerateTests(info.row.original)}
            className="flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            Generar Tests
          </Button>
        ),
      }),
    ],
    [onGenerateTests, bodySmall, body]
  );

  const table = useReactTable({
    data: stories,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.gray.text400}`} />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar user stories..."
            className={`w-full pl-9 pr-4 py-2 ${bodySmall.className} border ${colors.gray.border300} ${borderRadius.lg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={`border ${colors.gray.border200} ${borderRadius.lg} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={colors.gray[50]}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left ${bodySmall.className} font-medium ${colors.gray.text500} uppercase tracking-wider`}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'flex items-center gap-2 cursor-pointer select-none'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className={colors.gray.text400}>
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronsUpDown className="w-4 h-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className={`${colors.white} divide-y ${colors.gray.divider200}`}>
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && (
                    <tr>
                      <td colSpan={columns.length} className={`px-4 py-4 ${colors.gray[50]}`}>
                        <div className="space-y-4 max-w-4xl">
                          {/* Description */}
                          <div>
                            <h4 className={`${bodySmall.className} font-semibold ${colors.gray.text900} mb-2`}>Descripción</h4>
                            <p className={`${bodySmall.className} ${colors.gray.text700} whitespace-pre-wrap`}>
                              {row.original.description}
                            </p>
                          </div>

                          {/* Acceptance Criteria - Checkeables */}
                          {row.original.acceptance_criteria && row.original.acceptance_criteria.length > 0 && (
                            <div>
                              <h4 className={`${bodySmall.className} font-semibold ${colors.gray.text900} mb-2`}>
                                Criterios de Aceptación ({row.original.acceptance_criteria.length})
                                {onUpdateStory && (
                                  <span className={`ml-2 ${colors.gray.text500} font-normal italic`}>
                                    (Click para marcar/desmarcar)
                                  </span>
                                )}
                              </h4>
                              <ul className="space-y-2">
                                {row.original.acceptance_criteria.map((criterion: any, index: number) => (
                                  <li
                                    key={criterion.id || index}
                                    onClick={() => onUpdateStory && toggleCriteria(row.original, index)}
                                    className={`flex items-start gap-2 ${onUpdateStory ? 'cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded-md transition-colors' : ''}`}
                                    title={onUpdateStory ? (criterion.completed ? 'Click para desmarcar' : 'Click para marcar como completado') : ''}
                                  >
                                    {criterion.completed ? (
                                      <CheckCircle2 className={`w-4 h-4 ${colors.status.success.text600} mt-0.5 flex-shrink-0`} />
                                    ) : (
                                      <Circle className={`w-4 h-4 ${colors.gray.text400} mt-0.5 flex-shrink-0`} />
                                    )}
                                    <span className={`${bodySmall.className} ${criterion.completed ? `${colors.gray.text500} line-through` : colors.gray.text700}`}>
                                      {criterion.description}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Additional metadata */}
                          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${bodySmall.className}`}>
                            {row.original.epic && (
                              <div>
                                <span className={`font-semibold ${colors.gray.text700}`}>Epic:</span>
                                <span className={`ml-2 ${colors.gray.text600}`}>{row.original.epic}</span>
                              </div>
                            )}
                            {row.original.sprint && (
                              <div>
                                <span className={`font-semibold ${colors.gray.text700}`}>Sprint:</span>
                                <span className={`ml-2 ${colors.gray.text600}`}>{row.original.sprint}</span>
                              </div>
                            )}
                            {row.original.story_points && (
                              <div>
                                <span className={`font-semibold ${colors.gray.text700}`}>Story Points:</span>
                                <span className={`ml-2 ${colors.gray.text600}`}>{row.original.story_points}</span>
                              </div>
                            )}
                            {row.original.assigned_to && (
                              <div>
                                <span className={`font-semibold ${colors.gray.text700}`}>Asignado a:</span>
                                <span className={`ml-2 ${colors.gray.text600}`}>{row.original.assigned_to}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-4 py-3 ${colors.gray[50]} border-t ${colors.gray.border200}`}>
          <div className="flex items-center justify-between">
            <div className={`${bodySmall.className} ${colors.gray.text700}`}>
              Mostrando{' '}
              <span className="font-medium">
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              de{' '}
              <span className="font-medium">
                {table.getFilteredRowModel().rows.length}
              </span>{' '}
              resultados
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className={`${bodySmall.className} ${colors.gray.text700}`}>
                Página{' '}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex + 1}
                </span>{' '}
                de{' '}
                <span className="font-medium">{table.getPageCount()}</span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
