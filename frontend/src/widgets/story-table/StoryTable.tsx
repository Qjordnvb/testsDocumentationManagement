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
  isLoading?: boolean;
  onRefresh?: () => void;
}

const columnHelper = createColumnHelper<UserStory>();

export const StoryTable = ({ stories, onGenerateTests }: StoryTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});

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
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded transition-colors"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          );
        },
      }),
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => (
          <span className="font-mono text-xs text-gray-600">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Título',
        cell: (info) => (
          <div className="max-w-md">
            <p className="font-medium text-gray-900 truncate">{info.getValue()}</p>
          </div>
        ),
      }),
      columnHelper.accessor('acceptance_criteria', {
        header: 'Criterios',
        cell: (info) => {
          const criteria = info.getValue() || [];
          const completed = criteria.filter((c: { completed: boolean }) => c.completed).length;
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {completed}/{criteria.length}
              </span>
              {criteria.length > 0 && (
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(completed / criteria.length) * 100}%`,
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
          const colors = {
            Critical: 'bg-red-100 text-red-800',
            High: 'bg-orange-100 text-orange-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            Low: 'bg-gray-100 text-gray-800',
          };
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${colors[priority as keyof typeof colors] || colors.Medium}`}>
              {priority}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => {
          const status = info.getValue();
          const colors = {
            Backlog: 'bg-gray-100 text-gray-800',
            'To Do': 'bg-blue-100 text-blue-800',
            'In Progress': 'bg-purple-100 text-purple-800',
            'In Review': 'bg-yellow-100 text-yellow-800',
            Testing: 'bg-orange-100 text-orange-800',
            Done: 'bg-green-100 text-green-800',
          };
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status as keyof typeof colors] || colors.Backlog}`}>
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
    [onGenerateTests]
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar user stories..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                            <span className="text-gray-400">
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
            <tbody className="bg-white divide-y divide-gray-200">
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
                      <td colSpan={columns.length} className="px-4 py-4 bg-gray-50">
                        <div className="space-y-4 max-w-4xl">
                          {/* Description */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Descripción</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {row.original.description}
                            </p>
                          </div>

                          {/* Acceptance Criteria */}
                          {row.original.acceptance_criteria && row.original.acceptance_criteria.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Criterios de Aceptación ({row.original.acceptance_criteria.length})
                              </h4>
                              <ul className="space-y-2">
                                {row.original.acceptance_criteria.map((criterion: any, index: number) => (
                                  <li key={criterion.id || index} className="flex items-start gap-2">
                                    {criterion.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    )}
                                    <span className={`text-sm ${criterion.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                      {criterion.description}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Additional metadata */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {row.original.epic && (
                              <div>
                                <span className="font-semibold text-gray-700">Epic:</span>
                                <span className="ml-2 text-gray-600">{row.original.epic}</span>
                              </div>
                            )}
                            {row.original.sprint && (
                              <div>
                                <span className="font-semibold text-gray-700">Sprint:</span>
                                <span className="ml-2 text-gray-600">{row.original.sprint}</span>
                              </div>
                            )}
                            {row.original.story_points && (
                              <div>
                                <span className="font-semibold text-gray-700">Story Points:</span>
                                <span className="ml-2 text-gray-600">{row.original.story_points}</span>
                              </div>
                            )}
                            {row.original.assigned_to && (
                              <div>
                                <span className="font-semibold text-gray-700">Asignado a:</span>
                                <span className="ml-2 text-gray-600">{row.original.assigned_to}</span>
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
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
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
              <span className="text-sm text-gray-700">
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
