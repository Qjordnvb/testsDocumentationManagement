/**
 * Test Cases Page
 * View, edit, and manage test cases (project-scoped)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testCaseApi } from '@/entities/test-case';
import { useProject } from '@/app/providers/ProjectContext';
import type { TestCase } from '@/entities/test-case';
import { Modal } from '@/shared/ui/Modal';
import { GherkinEditor } from '@/shared/ui/GherkinEditor';
import { TestCaseFormModal } from '@/features/test-case-management/ui';

export const TestCasesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [gherkinTestCase, setGherkinTestCase] = useState<TestCase | null>(null);
  const [gherkinContent, setGherkinContent] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load test cases
  useEffect(() => {
    loadTestCases();
  }, [projectId]); // Reload when projectId changes

  const loadTestCases = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await testCaseApi.getAll(projectId);
      setTestCases(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading test cases:', err);
      setError('Error al cargar test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este test case?')) return;

    try {
      await testCaseApi.delete(id);
      await loadTestCases();
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
            {currentProject?.name || 'Proyecto'} - {testCases.length} test case{testCases.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Crear Test Case Manual
        </button>
      </div>

      {/* Test Cases Table */}
      {testCases.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No hay test cases</div>
          <p className="text-gray-500 text-sm">
            Genera test cases desde las user stories
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
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
                    User Story
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
                {testCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tc.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tc.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tc.user_story_id}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedTestCase(tc)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </button>
                      {tc.gherkin_file_path && (
                        <button
                          onClick={() => handleOpenGherkin(tc)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Gherkin
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <p className="text-sm text-gray-900">{selectedTestCase.id}</p>
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
          loadTestCases();
        }}
      />

      {/* Edit Test Case Modal */}
      <TestCaseFormModal
        isOpen={!!editingTestCase}
        onClose={() => setEditingTestCase(null)}
        onSuccess={() => {
          setEditingTestCase(null);
          loadTestCases();
        }}
        testCase={editingTestCase || undefined}
      />
    </div>
  );
};
