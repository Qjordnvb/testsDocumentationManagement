// orchestrator/services/AIWithMCPService.ts
// Servicio que permite a la IA usar MCP como brazos para navegar e interactuar

import { MCPClientService } from './McpClientService';
import { MCPManager } from './MCPManager';
import { ILlmService, AINavigationDecision } from '../llms/ILlmService';
import { AIResponse, TestStep, PageObjectDefinition, LocatorDefinition } from '../types/types';
import { UniversalMcpExtractor } from './UniversalMcpExtractor';
import { buildNavigationDecisionPrompt, buildTestGenerationPrompt } from '../prompts/unified-ai-prompts';

export interface MCPInteractionStep {
  step: string;
  action: 'navigate' | 'click' | 'type' | 'wait' | 'observe';
  element?: {
    role: string;
    name: string;
    ref: string;
  };
  params?: any[];
  result?: {
    success: boolean;
    newUrl?: string;
    newElements?: any[];
    screenshot?: string;
    error?: string;
  };
}

export interface AIExplorationResult {
  steps: MCPInteractionStep[];
  finalContext: any;
  generatedSelectors: any[];
  learnings: string[];
}

export class AIWithMCPService {
  private mcpClient: MCPClientService;
  private llmService: ILlmService;

  /**
   * Constructor con dependency injection para MCPManager
   * @param llmService - Servicio LLM para IA
   * @param mcpClient - Instancia MCP compartida (opcional, usa MCPManager por defecto)
   */
  constructor(llmService: ILlmService, mcpClient?: MCPClientService) {
    this.llmService = llmService;

    if (mcpClient) {
      // Usar instancia MCP inyectada (para shared singleton)
      this.mcpClient = mcpClient;
      console.log('✅ [AIWithMCPService] Usando instancia MCP compartida (inyectada)');
    } else {
      // Fallback: usar MCPManager singleton
      this.mcpClient = MCPManager.getInstance().getMCPClient();
      console.log('✅ [AIWithMCPService] Usando instancia MCP compartida (MCPManager)');
    }
  }

  /**
   * FUNCIÓN PRINCIPAL: IA EXPLORA CON MCP Y DEVUELVE JSON PARA GENERADORES
   */
  async generateAIResponseWithMCP(
    userStory: string[],
    baseUrl: string,
    testPath: string
  ): Promise<AIResponse> {

    console.log('\n🚀 [AI-MCP] INICIANDO GENERACIÓN COMPLETA CON MCP...\n');

    // 1. IA explora usando MCP como brazos
    const exploration = await this.exploreUserStoryWithMCP(userStory, baseUrl, testPath);

    // 2. IA convierte experiencia a JSON que esperan los generadores
    const aiResponse = await this.generateFinalAIResponse(exploration, userStory);

    console.log('\n✅ [AI-MCP] JSON FINAL GENERADO PARA LOS GENERADORES');
    console.log(`   - PageObject: ${aiResponse.pageObject.className}`);
    console.log(`   - Locators: ${aiResponse.pageObject.locators.length}`);
    console.log(`   - TestSteps: ${aiResponse.testSteps.length}`);

    return aiResponse;
  }

  /**
   * LA IA EXPLORA LA HISTORIA DE USUARIO USANDO MCP COMO BRAZOS
   * AHORA ES PÚBLICO PARA USO DESDE INDEX.TS
   */
  public async exploreUserStoryWithMCP(
    userStory: string[],
    baseUrl: string,
    testPath: string
  ): Promise<AIExplorationResult> {

    console.log('\n🧠 [AI-MCP] LA IA INICIARÁ EXPLORACIÓN CON MCP COMO BRAZOS...\n');

    // 1. Verificar que MCP esté conectado (no iniciarlo de nuevo)
    if (!this.mcpClient.isConnected()) {
      console.log('⚠️ [AI-MCP] MCP no conectado, usando servidor compartido...');
      // No iniciar nuevo servidor, usar el singleton compartido
    } else {
      console.log('🤖 [AI-MCP] MCP listo como brazos de la IA (usando instancia compartida)');
    }

    const fullUrl = `${baseUrl}${testPath}`;
    const steps: MCPInteractionStep[] = [];

    try {
      // 2. IA NAVEGA (paso 1 siempre es navegación)
      console.log(`🎯 [AI-MCP] IA NAVEGANDO A: ${fullUrl}`);

      const navStep: MCPInteractionStep = {
        step: userStory[0], // "DADO que estoy en..."
        action: 'navigate'
      };

      // Verificar si ya estamos en la página correcta (para evitar navegación duplicada)
      let initialContext = await this.mcpClient.getCompleteContext();

      if (!initialContext.pageInfo?.url?.includes(testPath)) {
        console.log(`🔄 [AI-MCP] Navegando a nueva URL: ${fullUrl}`);
        await this.mcpClient.navigateToUrl(fullUrl);
        await this.waitAndObserve(3000);
        initialContext = await this.mcpClient.getCompleteContext();
      } else {
        console.log(`✅ [AI-MCP] Ya estamos en la página correcta: ${initialContext.pageInfo.url}`);
      }
      navStep.result = {
        success: true,
        newUrl: initialContext.pageInfo.url,
        newElements: initialContext.interactiveElements,
        screenshot: initialContext.screenshot?.toString('base64')
      };

      steps.push(navStep);
      console.log(`✅ [AI-MCP] IA navegó exitosamente. Elementos disponibles: ${initialContext.interactiveElements.length}`);

      // 3. IA PROCESA CADA PASO DE LA HISTORIA INTERACTIVAMENTE
      for (let i = 1; i < userStory.length; i++) {
        const userStep = userStory[i];
        console.log(`\n🤔 [AI-MCP] IA ANALIZANDO PASO ${i + 1}: "${userStep}"`);

        // Obtener contexto completo (ARIA + HTML)
        const currentContext = await this.mcpClient.getCompleteContext();

        // IA DECIDE QUE HACER basado en el paso y elementos disponibles
        const aiDecision = await this.askAIWhatToDo(
          userStep,
          currentContext,
          steps
        );

        console.log(`🎯 [AI-MCP] IA DECIDIÓ: ${aiDecision.action} ${aiDecision.element?.name || ''}`);
        console.log(`📋 [AI-MCP] Decisión completa:`, JSON.stringify(aiDecision, null, 2));

        // EJECUTAR LA DECISIÓN DE LA IA USANDO MCP
        const executionResult = await this.executeMCPAction(aiDecision);

        const step: MCPInteractionStep = {
          step: userStep,
          action: aiDecision.action,
          element: aiDecision.element,
          params: aiDecision.params,
          result: executionResult
        };

        steps.push(step);

        if (executionResult.success) {
          console.log(`✅ [AI-MCP] ACCIÓN EXITOSA: ${aiDecision.action}`);
        } else {
          console.log(`❌ [AI-MCP] ACCIÓN FALLÓ: ${executionResult.error}`);
        }
      }

      // 4. CONTEXTO FINAL DESPUÉS DE TODA LA EXPLORACIÓN
      const finalContext = await this.mcpClient.getCompleteContext();

      // 5. IA GENERA SELECTORES BASADOS EN LA EXPERIENCIA REAL
      const generatedSelectors = await this.generateSelectorsFromExperience(steps);

      // 6. IA APRENDE DE LA EXPERIENCIA
      const learnings = await this.extractLearnings(steps);

      console.log('\n🎉 [AI-MCP] EXPLORACIÓN COMPLETADA');
      console.log(`   - Pasos ejecutados: ${steps.length}`);
      console.log(`   - Selectores generados: ${generatedSelectors.length}`);
      console.log(`   - Aprendizajes: ${learnings.length}`);

      return {
        steps,
        finalContext,
        generatedSelectors,
        learnings
      };

    } finally {
      // No cerrar MCP - es compartido y manejado por MCPManager
      console.log('🏁 [AI-MCP] Exploración completada (MCP sigue disponible para otros usos)');
    }
  }

  /**
   * IA DECIDE QUÉ ACCIÓN TOMAR BASADA EN EL PASO ACTUAL
   */
  private async askAIWhatToDo(
    userStep: string,
    currentContext: any,
    previousSteps: MCPInteractionStep[]
  ): Promise<AINavigationDecision> {

    // Usar el prompt unificado de navegación
    const prompt = buildNavigationDecisionPrompt(userStep, currentContext, previousSteps);

    try {
      // NUEVO: Usar el método específico para decisiones de navegación
      const response = await this.llmService.getNavigationDecisionFromIA(prompt);

      if (response) {
        console.log(`✅ [AI-MCP] IA decidió: ${response.action} ${response.element?.name || ''}`);
        return response;
      }

      return {
        action: 'observe',
        reasoning: 'No response from AI'
      };

    } catch (error) {
      console.error('Error obteniendo decisión de IA:', error);
      return {
        action: 'observe',
        reasoning: 'Error en análisis, observando estado actual'
      };
    }
  }

  /**
   * EJECUTA LA ACCIÓN DECIDIDA POR LA IA USANDO MCP
   */
  private async executeMCPAction(decision: AINavigationDecision): Promise<any> {
    try {
      const mcpClient = (this.mcpClient as any).mcpClient;

      switch (decision.action) {
        case 'click':
          if (decision.element && decision.element.ref) {
            console.log(`🔨 [AI-MCP] Ejecutando click en: ${decision.element.name} (ref: ${decision.element.ref})`);
            await mcpClient.callTool({
              name: 'browser_click',
              arguments: {
                element: decision.element.name || 'unknown',
                ref: decision.element.ref.toString()
              }
            });
          } else {
            console.warn('⚠️ [AI-MCP] Click: elemento o ref faltante');
            console.warn('   Decisión recibida:', JSON.stringify(decision, null, 2));
          }
          break;

        case 'type':
          if (decision.element && decision.element.ref && decision.params && decision.params[0]) {
            console.log(`⌨️ [AI-MCP] Escribiendo en: ${decision.element.name} (ref: ${decision.element.ref}) - texto: "${decision.params[0]}"`);
            await mcpClient.callTool({
              name: 'browser_type',
              arguments: {
                element: decision.element.name || 'unknown',
                ref: decision.element.ref.toString(),
                text: decision.params[0]
              }
            });
          } else {
            console.warn('⚠️ [AI-MCP] Type: elemento, ref o parámetros faltantes');
            console.warn('   Decisión recibida:', JSON.stringify(decision, null, 2));
            console.warn('   Element:', decision.element);
            console.warn('   Params:', decision.params);
          }
          break;

        case 'wait':
          await mcpClient.callTool({
            name: 'browser_wait_for',
            arguments: { time: (decision.params && decision.params[0]) || 2000 }
          });
          break;

        case 'observe':
          // Solo observar, no hacer nada
          break;
      }

      // ✅ DETECCIÓN INMEDIATA DE ELEMENTOS DINÁMICOS (como toast de error)
      if (decision.action === 'click') {
        console.log('⚡ [POST-CLICK] Detectando elementos dinámicos inmediatamente...');
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms es suficiente para que aparezca el toast

        // CAPTURAR ELEMENTOS DINÁMICOS INMEDIATAMENTE (antes de otros delays)
        console.log('🔍 [POST-CLICK] Capturando contexto dinámico ahora...');
        const quickDynamicContext = await this.mcpClient.getCompleteContext();
        console.log(`📊 [POST-CLICK] Elementos detectados inmediatamente: ${quickDynamicContext.interactiveElements?.length || 0}`);

        // Almacenar elementos dinámicos para usar después
        (this as any).capturedDynamicElements = quickDynamicContext.interactiveElements || [];
      }

      // Esperar un momento más y tomar screenshot
      await this.waitAndObserve(800);

      const newContext = await this.mcpClient.getCompleteContext();

      // ✅ COMBINAR con elementos dinámicos capturados inmediatamente post-click
      const capturedDynamic = (this as any).capturedDynamicElements || [];
      if (capturedDynamic.length > 0) {
        console.log(`🔄 [POST-CLICK] Usando ${capturedDynamic.length} elementos dinámicos capturados`);
        // Añadir elementos dinámicos capturados al contexto
        newContext.interactiveElements = [...(newContext.interactiveElements || []), ...capturedDynamic];
      }

      return {
        success: true,
        newUrl: newContext.pageInfo.url,
        newElements: newContext.interactiveElements,
        screenshot: newContext.screenshot?.toString('base64')
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * ESPERA Y OBSERVA CAMBIOS
   */
  private async waitAndObserve(ms: number): Promise<void> {
    const mcpClient = (this.mcpClient as any).mcpClient;
    await mcpClient.callTool({
      name: 'browser_wait_for',
      arguments: { time: ms }
    });
  }

  /**
   * GENERA SELECTORES BASADOS EN LA EXPERIENCIA REAL
   * ✅ AHORA REUTILIZA LA LÓGICA AVANZADA DE McpClientService
   */
  private async generateSelectorsFromExperience(steps: MCPInteractionStep[]): Promise<any[]> {
    const selectors: any[] = [];

    for (const step of steps) {
      if (step.element && step.result?.success) {
        // ✅ REUTILIZAR la lógica avanzada de McpClientService.generatePlaywrightSelectors()
        // Esto nos da 5 selectores priorizados con reasoning automáticamente
        const advancedSelectors = (this.mcpClient as any).generatePlaywrightSelectors(step.element);

        const elementSelectors = {
          name: step.element.name ? step.element.name.replace(/\s+/g, '') : 'unknownElement',
          elementType: step.element.role || 'button',
          actions: [step.action],
          selectors: advancedSelectors, // ✅ Usar selectores avanzados con priority y reason
          // ✅ NO hardcodear waitBefore - McpClientService ya lo maneja inteligentemente
          validateAfter: step.action === 'click' || step.action === 'type'
        };

        selectors.push(elementSelectors);
      }
    }

    return selectors;
  }


  /**
   * EXTRAE APRENDIZAJES DE LA EXPLORACIÓN
   */
  private async extractLearnings(steps: MCPInteractionStep[]): Promise<string[]> {
    const learnings: string[] = [];

    for (const step of steps) {
      if (step.result?.success) {
        learnings.push(`✅ ${step.action} en ${step.element?.name} funcionó correctamente`);
      } else {
        learnings.push(`❌ ${step.action} en ${step.element?.name} falló: ${step.result?.error}`);
      }
    }

    return learnings;
  }

  /**
   * CONVIERTE LA EXPERIENCIA MCP AL JSON EXACTO QUE ESPERAN LOS GENERADORES
   * AHORA ES PÚBLICO PARA USO DESDE INDEX.TS
   */
  public async generateFinalAIResponse(
    explorationResult: AIExplorationResult,
    originalUserStory: string[]
  ): Promise<AIResponse> {

    console.log('\n🧠 [AI-MCP] GENERANDO JSON FINAL PARA GENERADORES...');

    // Obtener elementos universales del contexto final
    const extractor = new UniversalMcpExtractor(this.mcpClient);
    const universalElements = await extractor.extractUniversalElements();
    
    console.log(`📊 [AI-MCP] Elementos universales extraídos: ${universalElements.length}`);
    console.log(`🔍 [AI-MCP] Primeros 3 elementos:`, universalElements.slice(0, 3).map(el => ({
      name: el.name,
      role: el.role,
      selectorsCount: el.selectors?.length || 0
    })));

    // IMPORTANTE: Usar los selectores generados durante la exploración, NO los del contexto final
    console.log(`🎯 [AI-MCP] Selectores generados durante exploración: ${explorationResult.generatedSelectors.length}`);
    
    // Convertir generatedSelectors a formato UniversalElement para el prompt
    const interactionElements = explorationResult.generatedSelectors.map((sel, idx) => ({
      name: sel.name || 'unknown',
      role: sel.elementType || 'unknown',
      ref: `generated-${idx}`,
      htmlAttributes: {
        tagName: sel.elementType || 'unknown',
        type: sel.elementType === 'input' ? 'text' : '',
        id: '',
        name: sel.name || '',
        className: '',
        placeholder: '',
        value: '',
        textContent: sel.name || '',
        innerText: sel.name || '',
        disabled: false,
        required: false,
        readonly: false
      },
      correlationScore: 1.0,
      correlationIndex: idx,
      correlationMethod: 'from-interaction',
      selectors: sel.selectors || []
    }));
    
    console.log(`📝 [AI-MCP] Elementos de interacción para IA:`, interactionElements.map(el => ({
      name: el.name,
      selectorsCount: el.selectors.length
    })));

    // Usar el prompt unificado para generación de tests
    const prompt = buildTestGenerationPrompt({
      userStory: originalUserStory.join('\n'),
      currentUrl: explorationResult.finalContext.pageInfo?.url || '',
      universalElements: interactionElements, // Usar elementos de la interacción, NO del contexto final
      navigationHistory: explorationResult.steps.map(s => `${s.action} ${s.element?.name || ''}`),
      previousAttempts: explorationResult.steps,
      consoleMessages: explorationResult.finalContext.mcpConsoleMessages || [],
      networkRequests: explorationResult.finalContext.mcpNetworkRequests || []
    });


    try {
      const aiResponse = await this.llmService.getTestAssetsFromIA(prompt, '');
      if (!aiResponse) {
        throw new Error('No se pudo obtener respuesta de la IA');
      }

      // Validar que tiene la estructura correcta
      if (!aiResponse.pageObject || !aiResponse.testSteps) {
        throw new Error('Respuesta de IA no tiene la estructura correcta');
      }

      return aiResponse as AIResponse;

    } catch (error) {
      console.error('❌ [AI-MCP] Error generando JSON final:', error);

      // Fallback: generar estructura básica
      return {
        pageObject: {
          className: "GeneratedPage",
          locators: explorationResult.generatedSelectors.map(sel => ({
            name: sel.name || 'unknownElement',
            elementType: sel.elementType || 'button',
            actions: sel.actions || ['click'],
            selectors: sel.selectors || []
          }))
        },
        testSteps: explorationResult.steps.map((step, index) => ({
          page: "GeneratedPage",
          action: index === 0 ? "navigate" : `${step.action}Element`,
          params: step.params || []
        }))
      };
    }
  }
}
