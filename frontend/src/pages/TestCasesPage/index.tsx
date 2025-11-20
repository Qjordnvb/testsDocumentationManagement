/**
 * Test Cases Page
 * View, edit, and manage test cases (project-scoped)
 * Grouped by User Story for better organization
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { testCaseApi } from '@/entities/test-case';
import { storyApi } from '@/entities/user-story';
import { useProject } from '@/app/providers/ProjectContext';
import type { TestCase } from '@/entities/test-case';
import type { UserStory } from '@/entities/user-story';
import { Modal } from '@/shared/ui/Modal';
import { GherkinEditor } from '@/shared/ui/GherkinEditor';
import { TestCaseFormModal } from '@/features/test-case-management/ui';
import { TestRunnerModal, ExecutionHistory, ExecutionDetailsModal } from '@/features/test-execution/ui';
import { ChevronDown, ChevronRight, FileCheck, Trash2, Eye, Search, Filter, PlayCircle, History } from 'lucide-react';

interface TestSuite {
  userStory: UserStory | null;
  userStoryId: string;
  testCases: TestCase[];
}

export const TestCasesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [gherkinTestCase, setGherkinTestCase] = useState<TestCase | null>(null);
  const [gherkinContent, setGherkinContent] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  // Test Runner Modal state
  const [runningTestCase, setRunningTestCase] = useState<TestCase | null>(null);
  const [showTestRunner, setShowTestRunner] = useState(false);

  // Expandable test case rows (for execution history)
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set());
  const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(null);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestType, setSelectedTestType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load data
  useEffect(() => {
    loadData();
  }, [projectId]); // Reload when projectId changes

  const loadData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const [tcData, usData] = await Promise.all([
        testCaseApi.getAll(projectId),
        storyApi.getAll(projectId)
      ]);
      setTestCases(tcData);
      setUserStories(usData);

      // Auto-expand all suites initially
      const allSuiteIds = new Set(tcData.map(tc => tc.user_story_id));
      setExpandedSuites(allSuiteIds);

      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Group test cases by user story with search and filters
  const testSuites = useMemo<TestSuite[]>(() => {
    // Filter test cases based on search and filters
    const filteredTests = testCases.filter(tc => {
      // Search filter (search in ID, title, description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          tc.id.toLowerCase().includes(query) ||
          tc.title.toLowerCase().includes(query) ||
          (tc.description && tc.description.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Test type filter
      if (selectedTestType !== 'ALL' && tc.test_type !== selectedTestType) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && tc.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && tc.priority !== selectedPriority) {
        return false;
      }

      return true;
    });

    // Group filtered tests by user story
    const grouped: { [key: string]: TestCase[] } = {};
    filteredTests.forEach(tc => {
      if (!grouped[tc.user_story_id]) {
        grouped[tc.user_story_id] = [];
      }
      grouped[tc.user_story_id].push(tc);
    });

    return Object.entries(grouped).map(([userStoryId, tcs]) => {
      const userStory = userStories.find(us => us.id === userStoryId) || null;
      return {
        userStory,
        userStoryId,
        testCases: tcs.sort((a, b) => a.id.localeCompare(b.id))
      };
    }).sort((a, b) => a.userStoryId.localeCompare(b.userStoryId));
  }, [testCases, userStories, searchQuery, selectedTestType, selectedStatus, selectedPriority]);

  // Paginate suites
  const paginatedSuites = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return testSuites.slice(startIndex, endIndex);
  }, [testSuites, currentPage, pageSize]);

  const totalPages = Math.ceil(testSuites.length / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTestType, selectedStatus, selectedPriority]);

  const toggleSuite = (suiteId: string) => {
    setExpandedSuites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suiteId)) {
        newSet.delete(suiteId);
      } else {
        newSet.add(suiteId);
      }
      return newSet;
    });
  };

  const toggleAllSuites = () => {
    if (expandedSuites.size === testSuites.length) {
      setExpandedSuites(new Set());
    } else {
      setExpandedSuites(new Set(testSuites.map(suite => suite.userStoryId)));
    }
  };

  const toggleTestCase = (testCaseId: string) => {
    setExpandedTestCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId);
      } else {
        newSet.add(testCaseId);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este test case?')) return;

    try {
      await testCaseApi.delete(id);
      await loadData();
      toast.success('Test case eliminado exitosamente');
    } catch (err: any) {
      console.error('Error deleting test case:', err);
      toast.error('Error al eliminar test case');
    }
  };

  const handleDeleteSuite = async (suite: TestSuite, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent suite collapse/expand

    const count = suite.testCases.length;
    const userStoryTitle = suite.userStory?.title || suite.userStoryId;

    if (!confirm(`¿Estás seguro de eliminar TODOS los ${count} test cases del suite "${userStoryTitle}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setLoading(true);
      const testCaseIds = suite.testCases.map(tc => tc.id);
      const result = await testCaseApi.batchDelete(testCaseIds);

      if (result.errors && result.errors.length > 0) {
        toast.error(`Suite eliminado parcialmente. ${result.deleted_count} eliminados. ${result.errors.length} errores.`);
      } else {
        toast.success(`Suite eliminado exitosamente. ${result.deleted_count} test cases eliminados.`);
      }

      await loadData();
    } catch (err: any) {
      console.error('Error deleting suite:', err);
      toast.error('Error al eliminar el suite de test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async (testCase: TestCase) => {
    try {
      // Load Gherkin content if needed
      const content = await testCaseApi.getGherkinContent(testCase.id);
      setGherkinContent(content);
      setRunningTestCase(testCase);
      setShowTestRunner(true);
    } catch (err: any) {
      console.error('Error loading test case:', err);
      toast.error('Error al cargar test case para ejecución');
    }
  };

  const handleOpenGherkin = async (testCase: TestCase) => {
    try {
      const content = await testCaseApi.getGherkinContent(testCase.id);
      setGherkinContent(content);
      setGherkinTestCase(testCase);
    } catch (err: any) {
      console.error('Error loading Gherkin content:', err);
      toast.error('Error al cargar el contenido Gherkin');
    }
  };

  const handleSaveGherkin = async (content: string) => {
    if (!gherkinTestCase) return;

    try {
      await testCaseApi.updateGherkinContent(gherkinTestCase.id, content);
      setGherkinContent(content);
      toast.success('Contenido Gherkin guardado exitosamente');
    } catch (err: any) {
      console.error('Error saving Gherkin content:', err);
      throw err; // Re-throw to let GherkinEditor handle the error
    }
  };

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
            {currentProject?.name || 'Proyecto'} - {testCases.length} test case{testCases.length !== 1 ? 's' : ''} en {testSuites.length} suite{testSuites.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn btn-secondary text-sm"
            onClick={toggleAllSuites}
          >
            {expandedSuites.size === testSuites.length ? 'Colapsar Todos' : 'Expandir Todos'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Crear Test Case Manual
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar test cases por ID, título o descripción..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Test Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedTestType}
                onChange={(e) => setSelectedTestType(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Todos los estados</option>
              <option value="NOT_RUN">Not Run</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="SKIPPED">Skipped</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Todas las prioridades</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || selectedTestType !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTestType('ALL');
                  setSelectedStatus('ALL');
                  setSelectedPriority('ALL');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || selectedTestType !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL') && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {testSuites.reduce((sum, suite) => sum + suite.testCases.length, 0)} de {testCases.length} test cases
            {testSuites.length < Object.keys(testCases.reduce((acc, tc) => ({ ...acc, [tc.user_story_id]: true }), {})).length && (
              <span> en {testSuites.length} suites</span>
            )}
          </div>
        )}
      </div>

      {/* Test Suites (Grouped by User Story) */}
      {testSuites.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {searchQuery || selectedTestType !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL'
              ? 'No se encontraron test cases'
              : 'No hay test cases'}
          </div>
          <p className="text-gray-500 text-sm">
            {searchQuery || selectedTestType !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL'
              ? 'Intenta ajustar los filtros o limpiarlos'
              : 'Genera test cases desde las user stories'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedSuites.map((suite) => {
            const isExpanded = expandedSuites.has(suite.userStoryId);
            const passedCount = suite.testCases.filter(tc => tc.status === 'PASSED').length;
            const failedCount = suite.testCases.filter(tc => tc.status === 'FAILED').length;
            const notRunCount = suite.testCases.filter(tc => !tc.status || tc.status === 'NOT_RUN').length;

            return (
              <div key={suite.userStoryId} className="card overflow-hidden border-l-4 border-l-blue-500">
                {/* Suite Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSuite(suite.userStoryId)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button className="text-gray-500 hover:text-gray-700">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {suite.userStory?.title || suite.userStoryId}
                        </h3>
                        <span className="text-sm text-gray-500 font-mono">
                          {suite.userStoryId}
                        </span>
                      </div>
                      {suite.userStory?.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {suite.userStory.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Test Count Badge */}
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {suite.testCases.length} test{suite.testCases.length !== 1 ? 's' : ''}
                    </div>

                    {/* Status Summary */}
                    <div className="flex gap-2 text-xs">
                      {passedCount > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          ✓ {passedCount}
                        </span>
                      )}
                      {failedCount > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                          ✗ {failedCount}
                        </span>
                      )}
                      {notRunCount > 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                          ○ {notRunCount}
                        </span>
                      )}
                    </div>

                    {/* Delete Suite Button */}
                    <button
                      onClick={(e) => handleDeleteSuite(suite, e)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={`Delete all ${suite.testCases.length} test cases`}
                      aria-label={`Delete suite ${suite.userStoryId}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Test Cases List (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              {/* Expand/Collapse */}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {suite.testCases.map((tc) => {
                            const isTestExpanded = expandedTestCases.has(tc.id);
                            return (
                              <>
                                <tr key={tc.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <button
                                      onClick={() => toggleTestCase(tc.id)}
                                      className="text-gray-400 hover:text-gray-600 transition-transform"
                                      title={isTestExpanded ? "Ocultar historial" : "Ver historial de ejecuciones"}
                                    >
                                      {isTestExpanded ? (
                                        <ChevronDown size={18} className="text-blue-600" />
                                      ) : (
                                        <ChevronRight size={18} />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                                    {tc.id}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {tc.title}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                      {tc.test_type || 'FUNCTIONAL'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      tc.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                                      tc.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {tc.status || 'NOT_RUN'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tc.created_date ? new Date(tc.created_date).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-3">
                                      <button
                                        onClick={() => handleRunTest(tc)}
                                        className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                                        title="Ejecutar Test"
                                        disabled={!tc.gherkin_file_path}
                                      >
                                        <PlayCircle size={16} />
                                      </button>
                                      <button
                                        onClick={() => setSelectedTestCase(tc)}
                                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                        title="Ver detalles"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      {tc.gherkin_file_path && (
                                        <button
                                          onClick={() => handleOpenGherkin(tc)}
                                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                          title="Ver/Editar Gherkin"
                                        >
                                          <FileCheck size={16} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDelete(tc.id)}
                                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                        title="Eliminar"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expandable Execution History Row */}
                                {isTestExpanded && (
                                  <tr key={`${tc.id}-history`}>
                                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                      <div className="max-w-5xl mx-auto">
                                        <div className="flex items-center gap-2 mb-4">
                                          <History size={18} className="text-blue-600" />
                                          <h4 className="font-semibold text-gray-900">
                                            Historial de Ejecuciones - {tc.title}
                                          </h4>
                                        </div>
                                        <ExecutionHistory
                                          testCaseId={tc.id}
                                          onSelectExecution={(executionId) => {
                                            setSelectedExecutionId(executionId);
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
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 bg-white rounded-lg mt-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, testSuites.length)}</span> de{' '}
                    <span className="font-medium">{testSuites.length}</span> suites
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Page size selector */}
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="5">5 por página</option>
                    <option value="10">10 por página</option>
                    <option value="25">25 por página</option>
                    <option value="50">50 por página</option>
                  </select>

                  {/* Page navigation */}
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simple modal to show test case details */}
      {selectedTestCase && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTestCase(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedTestCase.title}</h2>
              <button
                onClick={() => setSelectedTestCase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">ID</label>
                <p className="text-sm text-gray-900 font-mono">{selectedTestCase.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedTestCase.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedTestCase.test_type || 'FUNCTIONAL'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedTestCase.status || 'NOT_RUN'}</p>
                </div>
              </div>

              {selectedTestCase.gherkin_file_path && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Gherkin File</label>
                  <p className="text-sm text-blue-600 font-mono">{selectedTestCase.gherkin_file_path}</p>
                  <button
                    onClick={() => {
                      setSelectedTestCase(null);
                      handleOpenGherkin(selectedTestCase);
                    }}
                    className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                  >
                    Ver/Editar Gherkin →
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTestCase(null)}
                className="btn btn-secondary"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setEditingTestCase(selectedTestCase);
                  setSelectedTestCase(null);
                }}
                className="btn btn-primary"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gherkin Editor Modal */}
      {gherkinTestCase && (
        <Modal
          isOpen={!!gherkinTestCase}
          onClose={() => setGherkinTestCase(null)}
          title={`Gherkin: ${gherkinTestCase.title}`}
          size="xl"
        >
          <GherkinEditor
            testCaseId={gherkinTestCase.id}
            initialContent={gherkinContent}
            onSave={handleSaveGherkin}
            onCancel={() => setGherkinTestCase(null)}
          />
        </Modal>
      )}

      {/* Create Test Case Modal */}
      <TestCaseFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadData();
        }}
      />

      {/* Edit Test Case Modal */}
      <TestCaseFormModal
        isOpen={!!editingTestCase}
        onClose={() => setEditingTestCase(null)}
        onSuccess={() => {
          setEditingTestCase(null);
          loadData();
        }}
        testCase={editingTestCase || undefined}
      />

      {/* Test Runner Modal */}
      {runningTestCase && projectId && (
        <TestRunnerModal
          isOpen={showTestRunner}
          onClose={() => {
            setShowTestRunner(false);
            setRunningTestCase(null);
          }}
          testCaseId={runningTestCase.id}
          testCaseTitle={runningTestCase.title}
          gherkinContent={gherkinContent}
          projectId={projectId}
          onSave={() => {
            setShowTestRunner(false);
            setRunningTestCase(null);
            loadData(); // Reload to reflect updated status
          }}
        />
      )}

      {/* Execution Details Modal */}
      {selectedExecutionId && (
        <ExecutionDetailsModal
          executionId={selectedExecutionId}
          isOpen={showExecutionDetails}
          onClose={() => {
            setShowExecutionDetails(false);
            setSelectedExecutionId(null);
          }}
        />
      )}
    </div>
  );
};
