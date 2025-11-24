/**
 * Test Cases Page Main Component
 * Complete UI with test cases table, actions, and modals
 */

import {
  FileCheck,
  Search,
  Filter,
  Play,
  Edit,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useTestCasesPage } from '../model';
import { useAuth } from '@/app/providers';
import { TestCaseFormModal } from '@/features/test-case-management/ui/TestCaseFormModal';
import { TestRunnerModal } from '@/features/test-execution/ui/TestRunnerModal';
import { ExecutionDetailsModal } from '@/features/test-execution/ui/ExecutionDetailsModal';
import { ExecutionHistory } from '@/features/test-execution/ui/ExecutionHistory';
import { GherkinEditor } from '@/shared/ui/GherkinEditor/GherkinEditor';
import { Badge, ConfirmModal } from '@/shared/ui';

export const TestCases = () => {
  const { hasRole } = useAuth();
  const isDev = hasRole('dev');
  const {
    projectId,
    currentProject,
    testCases,
    testSuites,
    paginatedSuites,
    loading,
    error,
    filters,
    setSearchQuery,
    setSelectedTestType,
    setSelectedStatus,
    setSelectedPriority,
    pagination,
    totalPages,
    setCurrentPage,
    toggleAllSuites,
    expandedSuites,
    toggleSuite,
    expandedTestCases,
    toggleTestCase,
    showCreateModal,
    setShowCreateModal,
    editingTestCase,
    setEditingTestCase,
    runningTestCase,
    showTestRunner,
    setShowTestRunner,
    selectedExecutionId,
    selectedExecutionTestCase,
    showExecutionDetails,
    setShowExecutionDetails,
    setSelectedExecutionId,
    setSelectedExecutionTestCase,
    gherkinTestCase,
    setGherkinTestCase,
    gherkinContent,
    handleDelete,
    handleDeleteSuite,
    handleRunTest,
    handleOpenGherkin,
    handleSaveGherkin,
    loadData,
    suiteRefs,
    highlightedSuite,
    deletingTestCaseId,
    setDeletingTestCaseId,
    deletingTestCaseBugCount,
    confirmDelete,
  } = useTestCasesPage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando test cases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
          <p className="text-gray-600 mt-1">
            {currentProject?.name || 'Proyecto'} - {testCases.length} test cases en {testSuites.length} suites
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary text-sm" onClick={toggleAllSuites}>
            {expandedSuites.size === testSuites.length ? 'Colapsar Todos' : 'Expandir Todos'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-1" />
            Crear Test Case Manual
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar test cases..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filters.selectedTestType}
                onChange={(e) => setSelectedTestType(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los tipos</option>
                <option value="FUNCTIONAL">Functional</option>
                <option value="UI">UI</option>
                <option value="API">API</option>
                <option value="INTEGRATION">Integration</option>
                <option value="SECURITY">Security</option>
                <option value="PERFORMANCE">Performance</option>
              </select>
            </div>

            <select
              value={filters.selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="ALL">Todos los estados</option>
              <option value="NOT_RUN">Not Run</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="SKIPPED">Skipped</option>
            </select>

            <select
              value={filters.selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="ALL">Todas las prioridades</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Suites Display */}
      {testSuites.length === 0 ? (
        <div className="card text-center py-16">
          <FileCheck size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No test cases found</h2>
          <p className="text-gray-600">No test cases match your filters or no test cases have been created yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedSuites.map((suite) => {
            const isExpanded = expandedSuites.has(suite.userStoryId);
            const isHighlighted = highlightedSuite === suite.userStoryId;

            return (
              <div
                key={suite.userStoryId}
                ref={(el) => {
                  if (el) suiteRefs.current[suite.userStoryId] = el;
                }}
                className={`card transition-all ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
              >
                {/* Suite Header */}
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg"
                  onClick={() => toggleSuite(suite.userStoryId)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button className="text-gray-500 hover:text-gray-700">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {suite.userStoryId}
                        </span>
                        <h3 className="font-semibold text-gray-900">
                          {suite.userStory?.title || 'User Story sin título'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {suite.testCases.length} test case{suite.testCases.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {!isDev && (
                    <button
                      onClick={(e) => handleDeleteSuite(suite, e)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Eliminar suite completo"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Test Cases Table */}
                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600 border-b">
                          <th className="pb-2 font-medium w-8"></th>
                          <th className="pb-2 font-medium w-32">ID</th>
                          <th className="pb-2 font-medium">Título</th>
                          <th className="pb-2 font-medium w-32">Tipo</th>
                          <th className="pb-2 font-medium w-32">Prioridad</th>
                          <th className="pb-2 font-medium w-32">Estado</th>
                          <th className="pb-2 font-medium w-48 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suite.testCases.map((testCase) => {
                          const isTestExpanded = expandedTestCases.has(testCase.id);

                          return (
                            <>
                              <tr
                                key={testCase.id}
                                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => toggleTestCase(testCase.id)}
                              >
                                <td className="py-3">
                                  <div className="text-gray-500">
                                    {isTestExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className="font-mono text-sm text-gray-700">{testCase.id}</span>
                                </td>
                                <td className="py-3">
                                  <div className="max-w-md">
                                    <p className="font-medium text-gray-900">{testCase.title}</p>
                                    {testCase.description && (
                                      <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                                        {testCase.description}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <Badge
                                    variant={
                                      testCase.test_type === 'FUNCTIONAL' ? 'primary' :
                                      testCase.test_type === 'UI' ? 'info' :
                                      testCase.test_type === 'API' ? 'success' :
                                      testCase.test_type === 'SECURITY' ? 'danger' : 'warning'
                                    }
                                    size="sm"
                                  >
                                    {testCase.test_type}
                                  </Badge>
                                </td>
                                <td className="py-3">
                                  <Badge
                                    variant={
                                      (testCase.priority || 'MEDIUM') === 'CRITICAL' ? 'danger' :
                                      testCase.priority === 'HIGH' ? 'warning' :
                                      testCase.priority === 'LOW' ? 'default' : 'info'
                                    }
                                    size="sm"
                                  >
                                    {testCase.priority || 'MEDIUM'}
                                  </Badge>
                                </td>
                                <td className="py-3">
                                  <Badge
                                    variant={
                                      testCase.status === 'PASSED' ? 'success' :
                                      testCase.status === 'FAILED' ? 'danger' :
                                      testCase.status === 'BLOCKED' ? 'warning' :
                                      testCase.status === 'SKIPPED' ? 'info' : 'default'
                                    }
                                    size="sm"
                                  >
                                    {testCase.status}
                                  </Badge>
                                </td>
                                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                                  {!isDev && (
                                    <div className="flex gap-1 justify-end">
                                      <button
                                        onClick={() => handleRunTest(testCase)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Ejecutar test"
                                      >
                                        <Play size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleOpenGherkin(testCase)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Ver/Editar Gherkin"
                                      >
                                        <FileText size={16} />
                                      </button>
                                      <button
                                        onClick={() => setEditingTestCase(testCase)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Editar test case"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(testCase.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar test case"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                              {/* Execution History Row */}
                              {isTestExpanded && (
                                <tr>
                                  <td colSpan={7} className="py-4 bg-gray-50">
                                    <div className="px-8">
                                      <ExecutionHistory
                                        testCaseId={testCase.id}
                                        onSelectExecution={(executionId) => {
                                          setSelectedExecutionId(executionId);
                                          setSelectedExecutionTestCase(testCase);
                                          setShowExecutionDetails(true);
                                        }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="py-2 px-4 text-sm text-gray-700">
                Página {pagination.currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === totalPages}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Test Case Modal */}
      {(showCreateModal || editingTestCase) && (
        <TestCaseFormModal
          isOpen={showCreateModal || !!editingTestCase}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTestCase(null);
          }}
          onSuccess={() => {
            loadData();
          }}
          testCase={editingTestCase || undefined}
        />
      )}

      {/* Test Runner Modal */}
      {showTestRunner && runningTestCase && projectId && (
        <TestRunnerModal
          isOpen={showTestRunner}
          onClose={() => {
            setShowTestRunner(false);
          }}
          testCaseId={runningTestCase.id}
          testCaseTitle={runningTestCase.title}
          gherkinContent={gherkinContent}
          projectId={projectId}
          userStoryId={runningTestCase.user_story_id}
          onSave={() => {
            loadData();
          }}
        />
      )}

      {/* Execution Details Modal */}
      {showExecutionDetails && selectedExecutionId && selectedExecutionTestCase && projectId && (
        <ExecutionDetailsModal
          isOpen={showExecutionDetails}
          onClose={() => {
            setShowExecutionDetails(false);
            setSelectedExecutionId(null);
            setSelectedExecutionTestCase(null);
          }}
          executionId={selectedExecutionId}
          projectId={projectId}
          testCaseTitle={selectedExecutionTestCase.title}
          userStoryId={selectedExecutionTestCase.user_story_id}
          onBugReported={() => {
            loadData();
          }}
        />
      )}

      {/* Gherkin Editor Modal */}
      {gherkinTestCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            <GherkinEditor
              testCaseId={gherkinTestCase.id}
              initialContent={gherkinContent}
              onSave={handleSaveGherkin}
              onCancel={() => setGherkinTestCase(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTestCaseId}
        onClose={() => setDeletingTestCaseId(null)}
        onConfirm={confirmDelete}
        title="⚠️ Eliminar Test Case"
        message={
          deletingTestCaseBugCount > 0
            ? `Este test case tiene ${deletingTestCaseBugCount} bug${deletingTestCaseBugCount > 1 ? 's' : ''} reportado${deletingTestCaseBugCount > 1 ? 's' : ''}.\n\n` +
              `Al eliminar este test case:\n` +
              `• Se eliminarán TODOS los ${deletingTestCaseBugCount} bugs asociados\n` +
              `• Se perderá toda la documentación de estos bugs\n` +
              `• Esta acción NO se puede deshacer\n\n` +
              `¿Confirmas la eliminación del test case y sus bugs?`
            : '¿Estás seguro de que deseas eliminar este test case? Esta acción no se puede deshacer.'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
