/**
 * Bugs Page Main Component
 */

import { Bug as BugIcon, List, LayoutGrid } from 'lucide-react';
import { SkeletonTable, FormError } from '@/shared/ui';
import { useBugs } from '../model';
import { FiltersSection } from './FiltersSection';
import { BugsListView } from './BugsListView';
import { BugsGroupedView } from './BugsGroupedView';
import { SummaryStats } from './SummaryStats';

export const BugsPage = () => {
  const {
    currentProject,
    filteredBugs,
    groupedBugs,
    loading,
    error,
    viewMode,
    setViewMode,
    expandedTestCases,
    expandedScenarios,
    toggleTestCase,
    toggleScenario,
    searchQuery,
    setSearchQuery,
    selectedSeverity,
    setSelectedSeverity,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    selectedType,
    setSelectedType,
    resetFilters,
    activeFiltersCount,
    stats,
    handleBugClick,
  } = useBugs();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <SkeletonTable rows={8} columns={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <FormError message={`Error: ${error}`} variant="box" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BugIcon size={32} className="text-red-600" />
            Bug Reports
          </h1>
          <p className="text-gray-600 mt-1">
            {currentProject?.name || 'Current Project'} - {filteredBugs.length} bugs
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
              <span className="text-sm font-medium">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'grouped'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid size={16} />
              <span className="text-sm font-medium">Agrupado</span>
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              💡 <span className="font-medium">Tip:</span> Reporta bugs desde las ejecuciones de
              test
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FiltersSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={setSelectedSeverity}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        activeFiltersCount={activeFiltersCount}
        resetFilters={resetFilters}
      />

      {/* Bugs View - List or Grouped */}
      {viewMode === 'list' ? (
        <BugsListView
          bugs={filteredBugs}
          activeFiltersCount={activeFiltersCount}
          onBugClick={handleBugClick}
        />
      ) : (
        <BugsGroupedView
          groupedBugs={groupedBugs}
          expandedTestCases={expandedTestCases}
          expandedScenarios={expandedScenarios}
          onToggleTestCase={toggleTestCase}
          onToggleScenario={toggleScenario}
          onBugClick={handleBugClick}
        />
      )}

      {/* Summary Stats */}
      <SummaryStats
        total={stats.total}
        open={stats.open}
        testing={stats.testing}
        closed={stats.closed}
      />
    </div>
  );
};
