/**
 * Reports Page Business Logic
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import { apiService } from '@/shared/api/apiClient';

export const useReports = () => {
  const { currentProject } = useProject();
  const { hasRole } = useAuth();
  const [loadingStates, setLoadingStates] = useState({
    bugSummary: false,
    testExecution: false,
    testPlanPdf: false,
    testPlanDocx: false,
  });

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadBugSummary = async () => {
    if (!currentProject) return;
    setLoadingStates((prev) => ({ ...prev, bugSummary: true }));
    try {
      const blob = await apiService.downloadBugSummaryReport(currentProject.id);
      const filename = `Bug_Summary_${currentProject.name}_${new Date().toISOString().split('T')[0]}.docx`;
      triggerDownload(blob, filename);
      toast.success('✅ Reporte de bugs descargado exitosamente');
    } catch (error) {
      console.error('Error downloading bug summary:', error);
      toast.error('❌ Error al descargar el reporte de bugs');
    } finally {
      setLoadingStates((prev) => ({ ...prev, bugSummary: false }));
    }
  };

  const handleDownloadTestExecutionSummary = async () => {
    if (!currentProject) return;
    setLoadingStates((prev) => ({ ...prev, testExecution: true }));
    try {
      const blob = await apiService.downloadTestExecutionSummary(currentProject.id);
      const filename = `Test_Execution_Summary_${currentProject.name}_${new Date().toISOString().split('T')[0]}.docx`;
      triggerDownload(blob, filename);
      toast.success('✅ Reporte de ejecuciones descargado exitosamente');
    } catch (error) {
      console.error('Error downloading test execution summary:', error);
      toast.error('❌ Error al descargar el reporte de ejecuciones');
    } finally {
      setLoadingStates((prev) => ({ ...prev, testExecution: false }));
    }
  };

  const handleDownloadTestPlan = async (format: 'pdf' | 'docx') => {
    if (!currentProject) return;
    const key = format === 'pdf' ? 'testPlanPdf' : 'testPlanDocx';
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    try {
      const blob = await apiService.downloadTestPlan(currentProject.id, format);
      const filename = `Test_Plan_${currentProject.name}_${new Date().toISOString().split('T')[0]}.${format}`;
      triggerDownload(blob, filename);
      toast.success(`✅ Plan de pruebas (${format.toUpperCase()}) descargado exitosamente`);
    } catch (error) {
      console.error(`Error downloading test plan (${format}):`, error);
      toast.error(`❌ Error al descargar el plan de pruebas (${format.toUpperCase()})`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  return {
    currentProject,
    hasRole,
    loadingStates,
    handleDownloadBugSummary,
    handleDownloadTestExecutionSummary,
    handleDownloadTestPlan,
  };
};
