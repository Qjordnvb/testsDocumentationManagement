/**
 * Story Table Widget
 * Interactive table for displaying user stories with filters and actions
 * UPDATED: Added badge UI for test generation queue status
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
import { useAuth } from '@/app/providers';
import { useTestGenerationQueue } from '@/shared/stores';
import { ReviewTestCasesModal } from '@/features/generate-tests/ui/ReviewTestCasesModal';
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
  Loader2,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface StoryTableProps {
  stories: UserStory[];
  onGenerateTests: (story: UserStory) => void;
  onUpdateStory?: (storyId: string, updates: Partial<UserStory>) => Promise<void>;
  onViewTests?: (storyId: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const columnHelper = createColumnHelper<UserStory>();

export const StoryTable = ({ stories, onGenerateTests, onUpdateStory, onViewTests }: StoryTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Auth and Queue
  const { hasRole } = useAuth();
  const { getActiveJobForStory } = useTestGenerationQueue();

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
        cell: (info) => {
          const story = info.row.original;
          const activeJob = getActiveJobForStory(story.id);

          // Show badge if there's an active job
          if (activeJob) {
            const statusConfig = {
              queued: {
                icon: Clock,
                color: colors.gray.text600,
                bgColor: colors.gray[100],
                borderColor: colors.gray.border300,
                text: 'En cola',
                spin: false,
                clickable: false,
              },
              pending: {
                icon: Clock,
                color: colors.status.warning.text700,
                bgColor: colors.status.warning[50],
                borderColor: colors.status.warning.border200,
                text: 'Iniciando...',
                spin: false,
                clickable: false,
              },
              generating: {
                icon: Loader2,
                color: colors.brand.primary.text700,
                bgColor: colors.brand.primary[50],
                borderColor: colors.brand.primary.border200,
                text: `Generando ${activeJob.progress}%`,
                spin: true,
                clickable: false,
              },
              completed: {
                icon: CheckCircle2,
                color: colors.status.success.text700,
                bgColor: colors.status.success[50],
                borderColor: colors.status.success.border200,
                text: 'Listo para revisar',
                spin: false,
                clickable: true,
              },
              failed: {
                icon: AlertCircle,
                color: colors.status.error.text700,
                bgColor: colors.status.error[50],
                borderColor: colors.status.error.border200,
                text: 'Error',
                spin: false,
                clickable: true,
              },
            };

            const config = statusConfig[activeJob.status as keyof typeof statusConfig];
            const Icon = config.icon;

            return (
              <button
                onClick={() => {
                  if (config.clickable && activeJob.status === 'completed') {
                    setSelectedJob(activeJob);
                    setReviewModalOpen(true);
                  }
                }}
                disabled={!config.clickable}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 ${borderRadius.base} border
                  ${config.bgColor} border-[${config.borderColor}]
                  ${config.clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                  transition-opacity
                `}
              >
                <Icon
                  className={`w-4 h-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`}
                />
                <span className={`${bodySmall.className} font-medium ${config.color}`}>
                  {config.text}
                </span>
              </button>
            );
          }

          // No active job - check if test cases exist
          // Defensive check: verify array exists, has elements, and elements are valid strings
          const hasTestCases =
            story.test_case_ids &&
            Array.isArray(story.test_case_ids) &&
            story.test_case_ids.length > 0 &&
            story.test_case_ids.some(id => id && id.trim().length > 0);

          if (hasTestCases) {
            // Has test cases - show "View Tests" button (+ Generate if role allows)
            return (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (onViewTests) {
                      onViewTests(story.id);
                    } else {
                      // Fallback: Navigate to tests page filtered by this story
                      const currentPath = window.location.pathname;
                      const projectId = currentPath.match(/\/projects\/([^\/]+)/)?.[1] || 'PROJ-001';
                      window.location.href = `/projects/${projectId}/tests?story=${story.id}`;
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Ver Tests ({story.test_case_ids.length})
                </Button>
                {/* Only ADMIN and QA can generate tests */}
                {hasRole('admin', 'qa') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onGenerateTests(story)}
                    className="flex items-center gap-1"
                    title="Generar más test cases"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          }

          // No test cases yet - show generate button (only if role allows)
          // Only ADMIN and QA can generate tests
          if (!hasRole('admin', 'qa')) {
            return (
              <span className={`${bodySmall.className} ${colors.gray.text500} italic`}>
                Sin tests generados
              </span>
            );
          }

          return (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onGenerateTests(story)}
              className="flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Generar Tests
            </Button>
          );
        },
      }),
    ],
    [onGenerateTests, hasRole, bodySmall, body, getActiveJobForStory, onViewTests]
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
    <>
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

                          {/* Acceptance Criteria - Readonly for DEV, Editable for others */}
                          {row.original.acceptance_criteria && row.original.acceptance_criteria.length > 0 && (
                            <div>
                              <h4 className={`${bodySmall.className} font-semibold ${colors.gray.text900} mb-2`}>
                                Criterios de Aceptación ({row.original.acceptance_criteria.length})
                                {onUpdateStory && !hasRole('dev') && (
                                  <span className={`ml-2 ${colors.gray.text500} font-normal italic`}>
                                    (Click para marcar/desmarcar)
                                  </span>
                                )}
                                {hasRole('dev') && (
                                  <span className={`ml-2 ${colors.gray.text500} font-normal italic`}>
                                    (Solo lectura)
                                  </span>
                                )}
                              </h4>
                              <ul className="space-y-2">
                                {row.original.acceptance_criteria.map((criterion: any, index: number) => (
                                  <li
                                    key={criterion.id || index}
                                    onClick={() => !hasRole('dev') && onUpdateStory && toggleCriteria(row.original, index)}
                                    className={`flex items-start gap-2 ${!hasRole('dev') && onUpdateStory ? 'cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded-md transition-colors' : 'p-2 -ml-2'}`}
                                    title={!hasRole('dev') && onUpdateStory ? (criterion.completed ? 'Click para desmarcar' : 'Click para marcar como completado') : ''}
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

      {/* Review Test Cases Modal - Opens when clicking "Listo para revisar" badge */}
      {reviewModalOpen && selectedJob && selectedJob.result && (
        <ReviewTestCasesModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedJob(null);
          }}
          suggestedTests={selectedJob.result.suggested_test_cases || []}
          userStoryId={selectedJob.storyId}
          userStoryTitle={selectedJob.storyTitle || ''}
          onSuccess={() => {
            setReviewModalOpen(false);
            setSelectedJob(null);
          }}
        />
      )}
    </>
  );
};
