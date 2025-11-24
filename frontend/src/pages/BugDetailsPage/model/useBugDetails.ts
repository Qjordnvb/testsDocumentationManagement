/**
 * Bug Details Page Business Logic
 * Manages bug details, test case info, and status updates
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bugApi } from '@/entities/bug';
import { testCaseApi } from '@/entities/test-case';
import { apiService } from '@/shared/api/apiClient';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import type { Bug, BugStatus } from '@/entities/bug';
import type { TestCase } from '@/entities/test-case';

export const useBugDetails = () => {
  const { projectId, bugId } = useParams<{ projectId: string; bugId: string }>();
  const { currentProject } = useProject();
  const { hasRole } = useAuth();
  const isDev = hasRole('dev');
  const navigate = useNavigate();

  // Data states
  const [bug, setBug] = useState<Bug | null>(null);
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modal states
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [gherkinContent, setGherkinContent] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load bug details
  useEffect(() => {
    loadBugDetails();
  }, [bugId]);

  const loadBugDetails = async () => {
    if (!bugId) return;

    try {
      setLoading(true);
      setError(null);
      const bugData = await bugApi.getById(bugId, projectId!);
      setBug(bugData);

      // Load test case if linked
      if (bugData.test_case_id) {
        try {
          const testCaseData = await testCaseApi.getById(bugData.test_case_id);
          setTestCase(testCaseData);

          // Load gherkin content
          if (testCaseData.gherkin_file_path) {
            const gherkin = await testCaseApi.getGherkinContent(testCaseData.id);
            setGherkinContent(gherkin);
          }
        } catch (err) {
          console.error('Error loading test case:', err);
          // Don't fail the whole page if test case load fails
        }
      }
    } catch (err: any) {
      console.error('Error loading bug details:', err);
      setError(err.message || 'Error al cargar bug');
      toast.error('Error al cargar detalles del bug');
    } finally {
      setLoading(false);
    }
  };

  // Update bug status
  const handleStatusChange = async (newStatus: BugStatus) => {
    if (!bug || !bugId) return;

    try {
      setUpdatingStatus(true);
      // Use devUpdate endpoint for DEV role (restricted to status, fix_description, screenshots)
      const updated = isDev
        ? await bugApi.devUpdate(bugId, projectId!, { status: newStatus })
        : await bugApi.updateStatus(bugId, projectId!, newStatus);
      setBug(updated);
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating bug status:', err);
      toast.error('Error al actualizar estado del bug');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle re-test
  const handleRetest = () => {
    if (!testCase) {
      toast.error('No se puede re-ejecutar: el bug no está vinculado a un test case');
      return;
    }

    if (!gherkinContent) {
      toast.error('No se puede re-ejecutar: el test case no tiene contenido Gherkin');
      return;
    }

    setShowTestRunner(true);
  };

  // Handle test execution completion with auto-status update
  const handleTestExecutionComplete = async () => {
    if (!testCase || !bugId) return;

    try {
      setShowTestRunner(false);

      // Get the latest execution for this test case
      const historyData = await apiService.getTestCaseExecutions(testCase.id);

      if (historyData && historyData.executions && historyData.executions.length > 0) {
        // Get the most recent execution (first in the array)
        const latestExecution = historyData.executions[0];

        // Auto-update bug status based on test result
        let newStatus: BugStatus | null = null;

        if (latestExecution.status === 'PASSED') {
          newStatus = 'Verified';
          toast.success('✅ Test passed! Bug status actualizado a Verified');
        } else if (latestExecution.status === 'FAILED') {
          newStatus = 'Reopened';
          toast.error('❌ Test failed! Bug status actualizado a Reopened');
        } else if (
          latestExecution.status === 'BLOCKED' ||
          latestExecution.status === 'SKIPPED'
        ) {
          toast(`⚠️ Test execution: ${latestExecution.status} - Bug status no cambiado`, {
            icon: '⚠️',
          });
        }

        // Update bug status if applicable
        if (newStatus && bug) {
          try {
            await bugApi.updateStatus(bugId, projectId!, newStatus);
          } catch (err) {
            console.error('Error updating bug status:', err);
            toast.error('Error al actualizar status del bug automáticamente');
          }
        }
      }

      // Reload bug details to show updated status
      await loadBugDetails();
    } catch (err) {
      console.error('Error handling test execution:', err);
      toast.error('Error al procesar resultado del test');
    }
  };

  // Handle fix description update (DEV only)
  const handleFixDescriptionUpdate = async (fixDescription: string) => {
    if (!bugId || !isDev) return;

    try {
      await bugApi.devUpdate(bugId, projectId!, { fix_description: fixDescription });
      toast.success('Descripción del fix guardada');
    } catch (err) {
      toast.error('Error al guardar descripción');
    }
  };

  // Handle screenshots upload (DEV only)
  const handleScreenshotsUpload = async (files: FileList) => {
    if (!bugId || !isDev) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      toast.loading('Subiendo evidencia...');
      await bugApi.devUpdate(bugId, projectId!, { screenshots: formData } as any);
      toast.dismiss();
      toast.success('Evidencia subida correctamente');

      // Reload bug to show new screenshots
      const updated = await bugApi.getById(bugId, projectId!);
      setBug(updated);
    } catch (err) {
      toast.dismiss();
      toast.error('Error al subir evidencia');
    }
  };

  // Handle edit success
  const handleEditSuccess = (updatedBug: Bug) => {
    setBug(updatedBug);
    setShowEditModal(false);
    toast.success('Bug actualizado exitosamente');
  };

  // Navigate back to bugs list
  const navigateBack = () => {
    navigate(`/projects/${projectId}/bugs`);
  };

  // Navigate to test cases
  const navigateToTests = () => {
    navigate(`/projects/${projectId}/tests`);
  };

  // Navigate to stories
  const navigateToStories = () => {
    navigate(`/projects/${projectId}/stories`);
  };

  return {
    // Data
    projectId,
    bugId,
    currentProject,
    bug,
    testCase,
    loading,
    error,
    updatingStatus,
    isDev,

    // Test runner
    showTestRunner,
    setShowTestRunner,
    gherkinContent,

    // Edit modal
    showEditModal,
    setShowEditModal,

    // Actions
    handleStatusChange,
    handleRetest,
    handleTestExecutionComplete,
    handleFixDescriptionUpdate,
    handleScreenshotsUpload,
    handleEditSuccess,
    navigateBack,
    navigateToTests,
    navigateToStories,
    loadBugDetails,
    setBug,
  };
};
