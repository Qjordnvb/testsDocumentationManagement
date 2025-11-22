/**
 * ReportsPage - Generación y descarga de reportes
 * Permite descargar reportes de bugs, ejecuciones de tests y plan de pruebas
 */

import { useState } from 'react';
import { FileText, Download, Bug, CheckCircle, FileCheck, AlertCircle, Lock } from 'lucide-react';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import { apiService } from '@/shared/api/apiClient';
import toast from 'react-hot-toast';
import { Button } from '@/shared/ui/Button';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';

export const ReportsPage = () => {
  const { currentProject } = useProject();
  const { hasRole } = useAuth();
  const [loadingStates, setLoadingStates] = useState({
    bugSummary: false,
    testExecution: false,
    testPlanPdf: false,
    testPlanDocx: false,
  });

  // Typography presets
  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingMedium = getTypographyPreset('headingMedium');
  const headingLarge = getTypographyPreset('headingLarge');

  // DEV role cannot access reports
  if (hasRole('dev')) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="text-center">
          <Lock size={48} className={`mx-auto ${colors.gray.text400} mb-4`} />
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text700} mb-2`}>Acceso Restringido</h2>
          <p className={`${body.className} ${colors.gray.text500}`}>
            Los desarrolladores no tienen acceso a la generación de reportes.
            <br />
            Contacta a tu QA o Project Manager para obtener reportes.
          </p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="text-center">
          <AlertCircle size={48} className={`mx-auto ${colors.gray.text400} mb-4`} />
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text700} mb-2`}>No hay proyecto seleccionado</h2>
          <p className={`${body.className} ${colors.gray.text500}`}>Selecciona un proyecto para ver los reportes disponibles</p>
        </div>
      </div>
    );
  }

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
    setLoadingStates((prev) => ({ ...prev, bugSummary: true }));
    try {
      const blob = await apiService.downloadBugSummaryReport(currentProject.id);
      triggerDownload(blob, `Bug_Summary_${currentProject.name}_${new Date().toISOString().split('T')[0]}.docx`);
      toast.success('✅ Reporte de bugs descargado exitosamente');
    } catch (error) {
      console.error('Error downloading bug summary:', error);
      toast.error('❌ Error al descargar el reporte de bugs');
    } finally {
      setLoadingStates((prev) => ({ ...prev, bugSummary: false }));
    }
  };

  const handleDownloadTestExecutionSummary = async () => {
    setLoadingStates((prev) => ({ ...prev, testExecution: true }));
    try {
      const blob = await apiService.downloadTestExecutionSummary(currentProject.id);
      triggerDownload(blob, `Test_Execution_Summary_${currentProject.name}_${new Date().toISOString().split('T')[0]}.docx`);
      toast.success('✅ Reporte de ejecuciones descargado exitosamente');
    } catch (error) {
      console.error('Error downloading test execution summary:', error);
      toast.error('❌ Error al descargar el reporte de ejecuciones');
    } finally {
      setLoadingStates((prev) => ({ ...prev, testExecution: false }));
    }
  };

  const handleDownloadTestPlan = async (format: 'pdf' | 'docx') => {
    const key = format === 'pdf' ? 'testPlanPdf' : 'testPlanDocx';
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    try {
      const blob = await apiService.downloadTestPlan(currentProject.id, format);
      triggerDownload(blob, `Test_Plan_${currentProject.name}_${new Date().toISOString().split('T')[0]}.${format}`);
      toast.success(`✅ Plan de pruebas (${format.toUpperCase()}) descargado exitosamente`);
    } catch (error) {
      console.error(`Error downloading test plan (${format}):`, error);
      toast.error(`❌ Error al descargar el plan de pruebas (${format.toUpperCase()})`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${headingLarge.className} font-bold ${colors.gray.text900} flex items-center gap-3`}>
            <FileText size={32} className={colors.brand.primary.text600} />
            Reportes y Documentación
          </h1>
          <p className={`${body.className} ${colors.gray.text600} mt-2`}>
            Genera y descarga reportes de bugs, ejecuciones de tests y documentación del plan de pruebas
          </p>
        </div>
        <div className="text-right">
          <p className={`${bodySmall.className} ${colors.gray.text500}`}>Proyecto actual</p>
          <p className={`font-bold ${colors.gray.text800}`}>{currentProject.name}</p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bug Summary Report */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className={`${colors.status.error[100]} p-3 ${borderRadius.lg}`}>
              <Bug size={32} className={colors.status.error.text600} />
            </div>
            <div className="flex-1">
              <h3 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-2`}>Bug Summary Report</h3>
              <p className={`${bodySmall.className} ${colors.gray.text600} mb-4`}>
                Reporte completo de todos los bugs del proyecto, incluyendo severidad, prioridad,
                estado, asignación y estadísticas detalladas.
              </p>
              <div className={`flex items-center gap-2 ${bodySmall.className} ${colors.gray.text500} mb-4`}>
                <span className={`${colors.gray[100]} px-2 py-1 ${borderRadius.base}`}>Word (.docx)</span>
                <span>•</span>
                <span>Incluye tablas y gráficos</span>
              </div>
              <Button
                variant="danger"
                size="md"
                onClick={handleDownloadBugSummary}
                disabled={loadingStates.bugSummary}
                isLoading={loadingStates.bugSummary}
                leftIcon={!loadingStates.bugSummary ? <Download size={18} /> : undefined}
                className="w-full"
              >
                {loadingStates.bugSummary ? 'Generando reporte...' : 'Descargar Reporte de Bugs'}
              </Button>
            </div>
          </div>
        </div>

        {/* Test Execution Summary */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className={`${colors.status.success[100]} p-3 ${borderRadius.lg}`}>
              <CheckCircle size={32} className={colors.status.success.text600} />
            </div>
            <div className="flex-1">
              <h3 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-2`}>Test Execution Summary</h3>
              <p className={`${bodySmall.className} ${colors.gray.text600} mb-4`}>
                Resumen de todas las ejecuciones de pruebas, incluyendo resultados, evidencia,
                tiempo de ejecución y estadísticas de cobertura.
              </p>
              <div className={`flex items-center gap-2 ${bodySmall.className} ${colors.gray.text500} mb-4`}>
                <span className={`${colors.gray[100]} px-2 py-1 ${borderRadius.base}`}>Word (.docx)</span>
                <span>•</span>
                <span>Incluye métricas detalladas</span>
              </div>
              <Button
                variant="success"
                size="md"
                onClick={handleDownloadTestExecutionSummary}
                disabled={loadingStates.testExecution}
                isLoading={loadingStates.testExecution}
                leftIcon={!loadingStates.testExecution ? <Download size={18} /> : undefined}
                className="w-full"
              >
                {loadingStates.testExecution ? 'Generando reporte...' : 'Descargar Reporte de Ejecuciones'}
              </Button>
            </div>
          </div>
        </div>

        {/* Test Plan Document */}
        <div className="card hover:shadow-lg transition-shadow lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className={`${colors.brand.secondary[100]} p-3 ${borderRadius.lg}`}>
              <FileCheck size={32} className={colors.brand.primary.text600} />
            </div>
            <div className="flex-1">
              <h3 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-2`}>Test Plan Document</h3>
              <p className={`${bodySmall.className} ${colors.gray.text600} mb-4`}>
                Documento completo del plan de pruebas, incluyendo user stories, criterios de aceptación,
                test cases con escenarios Gherkin, estrategia de testing y cronograma.
              </p>
              <div className={`flex items-center gap-2 ${bodySmall.className} ${colors.gray.text500} mb-4`}>
                <span className={`${colors.gray[100]} px-2 py-1 ${borderRadius.base}`}>PDF o Word</span>
                <span>•</span>
                <span>Documento profesional completo</span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleDownloadTestPlan('pdf')}
                  disabled={loadingStates.testPlanPdf}
                  isLoading={loadingStates.testPlanPdf}
                  leftIcon={!loadingStates.testPlanPdf ? <Download size={18} /> : undefined}
                  className="flex-1"
                >
                  {loadingStates.testPlanPdf ? 'Generando PDF...' : 'Descargar PDF'}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleDownloadTestPlan('docx')}
                  disabled={loadingStates.testPlanDocx}
                  isLoading={loadingStates.testPlanDocx}
                  leftIcon={!loadingStates.testPlanDocx ? <Download size={18} /> : undefined}
                  className="flex-1"
                >
                  {loadingStates.testPlanDocx ? 'Generando Word...' : 'Descargar Word'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className={`${colors.status.info[50]} border ${colors.status.info.border200} ${borderRadius.lg} p-4`}>
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className={`${colors.brand.primary.text600} flex-shrink-0 mt-0.5`} />
          <div className={bodySmall.className}>
            <p className={`font-semibold ${colors.status.info.text900} mb-1`}>Información sobre los reportes</p>
            <ul className={`space-y-1 ${colors.gray.text600}`}>
              <li>• Los reportes se generan con la información actual del proyecto</li>
              <li>• Los archivos Word (.docx) incluyen tablas formateadas y son editables</li>
              <li>• Los archivos PDF incluyen diseño profesional para presentaciones</li>
              <li>• La generación puede tardar unos segundos dependiendo de la cantidad de datos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
