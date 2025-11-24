/**
 * Test Cases Page business logic
 * Manages test cases, user stories, filters, pagination, and test execution
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { testCaseApi } from '@/entities/test-case';
import { storyApi } from '@/entities/user-story';
import { useProject } from '@/app/providers/ProjectContext';
import type { TestCase } from '@/entities/test-case';
import type { UserStory } from '@/entities/user-story';
import type { TestSuite, TestCaseFilters, PaginationState } from './types';

export const useTestCasesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Data states
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [gherkinTestCase, setGherkinTestCase] = useState<TestCase | null>(null);
  const [gherkinContent, setGherkinContent] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  // Test Runner states
  const [runningTestCase, setRunningTestCase] = useState<TestCase | null>(null);
  const [showTestRunner, setShowTestRunner] = useState(false);

  // Execution history states
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set());
  const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(null);
  const [selectedExecutionTestCase, setSelectedExecutionTestCase] = useState<TestCase | null>(null);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);

  // Suite expansion states
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  // Filters
  const [filters, setFilters] = useState<TestCaseFilters>({
    searchQuery: '',
    selectedTestType: 'ALL',
    selectedStatus: 'ALL',
    selectedPriority: 'ALL',
  });

  // Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
  });

  // Highlight and scroll
  const [highlightedSuite, setHighlightedSuite] = useState<string | null>(null);
  const suiteRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
    }
  }, [projectId, currentProject, navigate]);

  // Load data
  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const [tcData, usData] = await Promise.all([
        testCaseApi.getAll(projectId),
        storyApi.getAll(projectId),
      ]);
      setTestCases(tcData);
      setUserStories(usData);

      // Check if we're filtering by a specific story
      const storyIdFromUrl = searchParams.get('story');

      if (storyIdFromUrl) {
        // Only expand the specific suite from URL parameter
        setExpandedSuites(new Set([storyIdFromUrl]));
      } else {
        // Keep all suites collapsed by default
        setExpandedSuites(new Set());
      }

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
    const filteredTests = testCases.filter((tc) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          tc.id.toLowerCase().includes(query) ||
          tc.title.toLowerCase().includes(query) ||
          (tc.description && tc.description.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Test type filter
      if (filters.selectedTestType !== 'ALL' && tc.test_type !== filters.selectedTestType) {
        return false;
      }

      // Status filter
      if (filters.selectedStatus !== 'ALL' && tc.status !== filters.selectedStatus) {
        return false;
      }

      // Priority filter
      if (filters.selectedPriority !== 'ALL' && tc.priority !== filters.selectedPriority) {
        return false;
      }

      return true;
    });

    // Group filtered tests by user story
    const grouped: { [key: string]: TestCase[] } = {};
    filteredTests.forEach((tc) => {
      if (!grouped[tc.user_story_id]) {
        grouped[tc.user_story_id] = [];
      }
      grouped[tc.user_story_id].push(tc);
    });

    return Object.entries(grouped)
      .map(([userStoryId, tcs]) => {
        const userStory = userStories.find((us) => us.id === userStoryId) || null;
        return {
          userStory,
          userStoryId,
          testCases: tcs.sort((a, b) => a.id.localeCompare(b.id)),
        };
      })
      .sort((a, b) => a.userStoryId.localeCompare(b.userStoryId));
  }, [testCases, userStories, filters]);

  // Paginate suites
  const paginatedSuites = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return testSuites.slice(startIndex, endIndex);
  }, [testSuites, pagination]);

  const totalPages = Math.ceil(testSuites.length / pagination.pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [filters.searchQuery, filters.selectedTestType, filters.selectedStatus, filters.selectedPriority]);

  // Scroll to and highlight specific suite when coming from URL
  useEffect(() => {
    const storyIdFromUrl = searchParams.get('story');

    if (storyIdFromUrl && !loading && testSuites.length > 0) {
      setHighlightedSuite(storyIdFromUrl);

      setTimeout(() => {
        const suiteElement = suiteRefs.current[storyIdFromUrl];
        if (suiteElement) {
          suiteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      setTimeout(() => {
        setHighlightedSuite(null);
      }, 3000);
    }
  }, [searchParams, loading, testSuites]);

  // Toggle functions
  const toggleSuite = (suiteId: string) => {
    setExpandedSuites((prev) => {
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
      setExpandedSuites(new Set(testSuites.map((suite) => suite.userStoryId)));
    }
  };

  const toggleTestCase = (testCaseId: string) => {
    setExpandedTestCases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId);
      } else {
        newSet.add(testCaseId);
      }
      return newSet;
    });
  };

  // Handlers
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
    event.stopPropagation();

    const count = suite.testCases.length;
    const userStoryTitle = suite.userStory?.title || suite.userStoryId;

    if (
      !confirm(
        `¿Estás seguro de eliminar TODOS los ${count} test cases del suite "${userStoryTitle}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const testCaseIds = suite.testCases.map((tc) => tc.id);
      const result = await testCaseApi.batchDelete(testCaseIds);

      if (result.errors && result.errors.length > 0) {
        toast.error(
          `Suite eliminado parcialmente. ${result.deleted_count} eliminados. ${result.errors.length} errores.`
        );
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
      throw err;
    }
  };

  // Filter setters
  const setSearchQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const setSelectedTestType = (testType: string) => {
    setFilters((prev) => ({ ...prev, selectedTestType: testType }));
  };

  const setSelectedStatus = (status: string) => {
    setFilters((prev) => ({ ...prev, selectedStatus: status }));
  };

  const setSelectedPriority = (priority: string) => {
    setFilters((prev) => ({ ...prev, selectedPriority: priority }));
  };

  // Pagination setters
  const setCurrentPage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const setPageSize = (size: number) => {
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
  };

  return {
    // Data
    projectId,
    currentProject,
    testCases,
    userStories,
    testSuites,
    paginatedSuites,
    loading,
    error,

    // Filters
    filters,
    setSearchQuery,
    setSelectedTestType,
    setSelectedStatus,
    setSelectedPriority,

    // Pagination
    pagination,
    totalPages,
    setCurrentPage,
    setPageSize,

    // Suite states
    expandedSuites,
    toggleSuite,
    toggleAllSuites,
    highlightedSuite,
    suiteRefs,

    // Test case states
    expandedTestCases,
    toggleTestCase,

    // Modals
    showCreateModal,
    setShowCreateModal,
    editingTestCase,
    setEditingTestCase,
    selectedTestCase,
    setSelectedTestCase,

    // Gherkin editor
    gherkinTestCase,
    setGherkinTestCase,
    gherkinContent,
    setGherkinContent,

    // Test runner
    runningTestCase,
    showTestRunner,
    setShowTestRunner,

    // Execution details
    selectedExecutionId,
    setSelectedExecutionId,
    selectedExecutionTestCase,
    setSelectedExecutionTestCase,
    showExecutionDetails,
    setShowExecutionDetails,

    // Handlers
    handleDelete,
    handleDeleteSuite,
    handleRunTest,
    handleOpenGherkin,
    handleSaveGherkin,
    loadData,
  };
};
