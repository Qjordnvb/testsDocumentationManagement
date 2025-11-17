/**
 * Test Cases Page
 * View, edit, and manage test cases (project-scoped)
 * Grouped by User Story for better organization
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testCaseApi } from '@/entities/test-case';
import { userStoryApi } from '@/entities/user-story';
import { useProject } from '@/app/providers/ProjectContext';
import type { TestCase } from '@/entities/test-case';
import type { UserStory } from '@/entities/user-story';
import { Modal } from '@/shared/ui/Modal';
import { GherkinEditor } from '@/shared/ui/GherkinEditor';
import { TestCaseFormModal } from '@/features/test-case-management/ui';
import { ChevronDown, ChevronRight, FileCheck, Trash2, Eye } from 'lucide-react';

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
        userStoryApi.getAll(projectId)
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

  // Group test cases by user story
  const testSuites = useMemo<TestSuite[]>(() => {
    const grouped: { [key: string]: TestCase[] } = {};

    testCases.forEach(tc => {
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
  }, [testCases, userStories]);

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este test case?')) return;

    try {
      await testCaseApi.delete(id);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting test case:', err);
      alert('Error al eliminar test case');
    }
  };

  const handleOpenGherkin = async (testCase: TestCase) => {
    try {
      const content = await testCaseApi.getGherkinContent(testCase.id);
      setGherkinContent(content);
      setGherkinTestCase(testCase);
    } catch (err: any) {
      console.error('Error loading Gherkin content:', err);
      alert('Error al cargar el contenido Gherkin');
    }
  };

  const handleSaveGherkin = async (content: string) => {
    if (!gherkinTestCase) return;

    try {
      await testCaseApi.updateGherkinContent(gherkinTestCase.id, content);
      setGherkinContent(content);
      alert('Contenido Gherkin guardado exitosamente');
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

      {/* Test Suites (Grouped by User Story) */}
      {testSuites.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No hay test cases</div>
          <p className="text-gray-500 text-sm">
            Genera test cases desde las user stories
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {testSuites.map((suite) => {
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
                  </div>
                </div>

                {/* Test Cases List (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
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
                          {suite.testCases.map((tc) => (
                            <tr key={tc.id} className="hover:bg-gray-50">
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
    </div>
  );
};
