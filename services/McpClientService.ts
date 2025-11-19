// orchestrator/services/McpClientService.ts
import { spawn, ChildProcess } from 'child_process';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface MCPContext {
  domSnapshot: string;
  accessibilityTree: any;
  interactiveElements: any[];
  domElements?: any[]; // NUEVO: Elementos del DOM con atributos HTML
  consoleMessages: any[];
  networkRequests: any[];
  screenshot?: Buffer;
  pageInfo: {
    url: string;
    title: string;
    timestamp: string;
  };
}

export interface MCPElement {
  role: string;
  name?: string;
  element: string;
  ref: number;
  disabled?: boolean;
  checked?: boolean;
  expanded?: boolean;
}

export class MCPClientService {
  private mcpProcess: ChildProcess | null = null;
  private mcpClient: Client | null = null;
  private transport: StdioClientTransport | null = null;

  /**
   * Inicia el servidor MCP usando el protocolo STDIO nativo
   */
  async startMCPServer(): Promise<void> {
    console.log('[MCP] Iniciando servidor MCP con protocolo STDIO nativo...');

    try {
      // ========== NUEVA VERIFICACIÓN DE NAVEGADORES ==========
      console.log('[MCP] 🔍 Verificando instalación de navegadores...');
      await this.verifyBrowserInstallation();

      // Verificar que @playwright/mcp esté disponible
      await this.verifyMCPAvailability();

      // OPCIÓN A: Dejar que StdioClientTransport lance el proceso
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@playwright/mcp@latest']
      });

      // Crear cliente MCP con sintaxis correcta
      this.mcpClient = new Client({
        name: 'qa-orchestrator',
        version: '1.0.0'
      });

      // Conectar cliente al transporte
      await this.mcpClient.connect(this.transport);

      console.log('[MCP] ✅ Servidor MCP iniciado y conectado exitosamente');

      // Verificar herramientas disponibles
      await this.listAvailableTools();

    } catch (error) {
      console.error('[MCP] ❌ Error iniciando servidor MCP:', error);
      await this.cleanup();
      throw new Error(`No se pudo iniciar el servidor MCP: ${error}`);
    }
  }

  /**
   * NUEVA: Verifica que los navegadores estén instalados para MCP
   */
  private async verifyBrowserInstallation(): Promise<void> {
    console.log('[MCP] Verificando navegadores disponibles...');

    return new Promise((resolve, reject) => {
      // Verificar instalación de Playwright browsers
      const checkProcess = spawn('npx', ['playwright', 'install', '--dry-run'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      checkProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      checkProcess.stderr?.on('data', (data) => {
        output += data.toString();
      });

      checkProcess.on('close', (code) => {
        console.log('[MCP] 🔍 Browser check output:', output);

        if (code === 0) {
          console.log('[MCP] ✅ Navegadores verificados');
          resolve();
        } else {
          console.warn('[MCP] ⚠️ Algunos navegadores pueden no estar instalados');
          console.log('[MCP] 🔧 Intentando instalar navegadores automáticamente...');

          // Intentar instalación automática
          const installProcess = spawn('npx', ['playwright', 'install', 'chromium'], {
            stdio: 'inherit'
          });

          installProcess.on('close', (installCode) => {
            if (installCode === 0) {
              console.log('[MCP] ✅ Navegadores instalados exitosamente');
              resolve();
            } else {
              reject(new Error('No se pudieron instalar los navegadores necesarios'));
            }
          });
        }
      });

      // Timeout de 30 segundos
      setTimeout(() => {
        checkProcess.kill();
        reject(new Error('Timeout verificando navegadores'));
      }, 30000);
    });
  }

  /**
   * Verifica que @playwright/mcp esté disponible
   */
  private async verifyMCPAvailability(): Promise<void> {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npx', ['@playwright/mcp@latest', '--help'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`@playwright/mcp no está disponible o falló (código: ${code})`));
        }
      });

      testProcess.on('error', (error) => {
        reject(new Error(`Error verificando @playwright/mcp: ${error.message}`));
      });

      // Timeout de 10 segundos
      setTimeout(() => {
        testProcess.kill();
        reject(new Error('Timeout verificando disponibilidad de @playwright/mcp'));
      }, 10000);
    });
  }

  /**
   * Configura los manejadores del transporte MCP
   */
  private setupProcessHandlers(): void {
    // El StdioClientTransport maneja el proceso internamente
    // Solo necesitamos manejar eventos del cliente
    if (this.mcpClient) {
      console.log('[MCP] Cliente conectado, proceso manejado por StdioClientTransport');
    }
  }

  /**
   * Lista las herramientas disponibles en el servidor MCP
   */
  private async listAvailableTools(): Promise<void> {
    if (!this.mcpClient) {
      console.warn('[MCP] Cliente no inicializado, no se pueden listar herramientas');
      return;
    }

    try {
      const tools = await this.mcpClient.listTools();
      console.log(`[MCP] ✅ Herramientas disponibles: ${tools.tools.map(t => t.name).join(', ')}`);
    } catch (error) {
      console.warn('[MCP] ⚠️ No se pudieron listar las herramientas:', error);
    }
  }

  /**
   * Navega a una URL específica
   */
  async navigateToUrl(url: string): Promise<void> {
    if (!this.mcpClient) {
      throw new Error('Cliente MCP no inicializado. Llama a startMCPServer() primero.');
    }

    console.log(`[MCP] Navegando a: ${url}`);

    try {
      await this.mcpClient.callTool({
        name: 'browser_navigate',
        arguments: { url }
      });

      // Esperar a que la página cargue completamente
      await this.waitForPageLoad();

      console.log(`[MCP] ✅ Navegación exitosa a: ${url}`);

      // Esperar a que la página se cargue completamente
      console.log('[MCP] ⏳ Esperando carga completa de la página...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[MCP] ❌ Error navegando a ${url}:`, error);
      throw error;
    }
  }

  /**
   * Espera a que la página cargue completamente
   */
  private async waitForPageLoad(timeoutMs: number = 10000): Promise<void> {
    try {
      await this.mcpClient!.callTool({
        name: 'browser_wait_for',
        arguments: { time: 2000 } // Esperar 2 segundos básicos
      });
    } catch (error) {
      console.warn('[MCP] ⚠️ Error esperando carga de página:', error);
    }
  }

  /**
   * NUEVO: Método para hacer parsing seguro de JSON extrayendo solo la parte JSON
   */
  private safeJsonParse(rawText: string, fallback: any = null): any {
    try {
      // Si ya es un objeto, devolverlo tal como está
      if (typeof rawText === 'object') {
        return rawText;
      }

      // Intentar parsing directo primero
      try {
        return JSON.parse(rawText);
      } catch (e) {
        // Si falla, intentar extraer JSON de texto con markdown
      }

      // Buscar patrones de JSON en el texto
      const jsonPatterns = [
        // Patrón para JSON después de "### Result"
        /### Result\s*\n([\s\S]*?)(?=\n###|$)/,
        // Patrón para JSON entre llaves
        /(\{[\s\S]*?\})/,
        // Patrón para arrays JSON
        /(\[[\s\S]*?\])/
      ];

      for (const pattern of jsonPatterns) {
        const match = rawText.match(pattern);
        if (match) {
          try {
            const cleanJson = match[1].trim();
            return JSON.parse(cleanJson);
          } catch (e) {
            // Continuar con el siguiente patrón
            continue;
          }
        }
      }

      // Si no se encuentra JSON válido, intentar extraer datos estructurados
      // Nota: Esto es normal para MCP - muchas respuestas vienen en formato YAML/texto
      return this.parseAlternativeFormat(rawText, fallback);

    } catch (error) {
      console.warn('[MCP] ⚠️ Error en safeJsonParse:', error);
      return fallback;
    }
  }

  /**
   * NUEVO: Método para parsear formatos alternativos cuando JSON falla
   */
  private parseAlternativeFormat(rawText: string, fallback: any): any {
    try {
      // Para accessibility tree, intentar extraer estructura YAML-like
      if (rawText.includes('Page Snapshot:')) {
        return this.parseYamlLikeStructure(rawText);
      }

      // Para mensajes de consola, extraer líneas individuales
      if (rawText.includes('[WARNING]') || rawText.includes('[ERROR]') || rawText.includes('[LOG]')) {
        return this.parseConsoleLines(rawText);
      }

      // Para network requests, extraer peticiones individuales
      if (rawText.includes('[GET]') || rawText.includes('[POST]')) {
        return this.parseNetworkLines(rawText);
      }

      return fallback;
    } catch (error) {
      console.warn('[MCP] ⚠️ Error en parseAlternativeFormat:', error);
      return fallback;
    }
  }

  /**
   * NUEVO: Parsea estructura similar a YAML del accessibility tree
   */
  private parseYamlLikeStructure(rawText: string): any {
    try {
      const snapshotMatch = rawText.match(/Page Snapshot:\s*```yaml\s*([\s\S]*?)\s*```/);
      if (!snapshotMatch) return { elements: [] };

      const yamlContent = snapshotMatch[1];
      const elements: any[] = [];

      // Parsear líneas del YAML para extraer elementos
      const lines = yamlContent.split('\n');
      let currentElement: any = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Detectar elementos con [ref=...]
        const refMatch = trimmed.match(/(\w+).*?\[ref=(\w+)\]/);
        if (refMatch) {
          const [, role, ref] = refMatch;
          const nameMatch = trimmed.match(/"([^"]+)"/);

          // Extraer TODOS los atributos [key=value] como lo hace el proyecto test
          const attributes: Record<string, any> = {};
          const attrMatches = trimmed.matchAll(/\[(\w+)=([^\]]+)\]/g);
          for (const match of attrMatches) {
            if (match[1] !== 'ref') {  // ref ya lo tenemos separado
              attributes[match[1]] = match[2];
            }
          }

          // También buscar atributos booleanos [disabled], [checked], etc.
          const booleanAttrs = ['disabled', 'checked', 'expanded', 'required', 'readonly'];
          for (const attr of booleanAttrs) {
            if (trimmed.includes(`[${attr}]`)) {
              attributes[attr] = true;
            }
          }

          currentElement = {
            role: role,
            ref: ref,
            name: nameMatch ? nameMatch[1] : trimmed.replace(/\[.*?\]/g, '').trim(),
            element: role,
            disabled: attributes.disabled || false,
            checked: attributes.checked || false,
            expanded: attributes.expanded || false,
            attributes: attributes  // ¡Esta es la clave!
          };
          elements.push(currentElement);
        }
      }

      return { elements, raw: rawText };
    } catch (error) {
      console.warn('[MCP] ⚠️ Error parseando estructura YAML:', error);
      return { elements: [], raw: rawText };
    }
  }

  /**
   * NUEVO: Parsea líneas de mensajes de consola
   */
  private parseConsoleLines(rawText: string): any[] {
    try {
      const messages: any[] = [];
      const lines = rawText.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('[WARNING]') || trimmed.includes('[ERROR]') || trimmed.includes('[LOG]')) {
          const levelMatch = trimmed.match(/\[(WARNING|ERROR|LOG)\]/);
          const level = levelMatch ? levelMatch[1] : 'INFO';
          const message = trimmed.replace(/\[.*?\]/, '').trim();

          messages.push({
            level: level.toLowerCase(),
            message,
            timestamp: new Date().toISOString()
          });
        }
      }

      return messages;
    } catch (error) {
      console.warn('[MCP] ⚠️ Error parseando mensajes de consola:', error);
      return [];
    }
  }

  /**
   * NUEVO: Parsea líneas de peticiones de red
   */
  private parseNetworkLines(rawText: string): any[] {
    try {
      const requests: any[] = [];
      const lines = rawText.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        const requestMatch = trimmed.match(/\[(GET|POST|PUT|DELETE)\]\s+(.+?)\s+=>\s+\[(\d+)\]/);

        if (requestMatch) {
          const [, method, url, status] = requestMatch;
          requests.push({
            method,
            url: url.trim(),
            status: parseInt(status),
            timestamp: new Date().toISOString()
          });
        }
      }

      return requests;
    } catch (error) {
      console.warn('[MCP] ⚠️ Error parseando peticiones de red:', error);
      return [];
    }
  }

  /**
   * Obtiene el contexto completo de la página actual
   */
  async getRealTimeContext(url?: string): Promise<MCPContext> {
    if (!this.mcpClient) {
      throw new Error('Cliente MCP no inicializado. Llama a startMCPServer() primero.');
    }

    console.log('[MCP] Obteniendo contexto completo de la página...');

    try {
      // Si se proporciona URL, navegar primero
      if (url) {
        await this.navigateToUrl(url);
      }

      // Obtener snapshot del árbol de accesibilidad
      const snapshotResult = await this.mcpClient.callTool({
        name: 'browser_snapshot',
        arguments: {}
      });

      // Obtener mensajes de consola
      const consoleResult = await this.mcpClient.callTool({
        name: 'browser_console_messages',
        arguments: {}
      });

      // Obtener peticiones de red
      const networkResult = await this.mcpClient.callTool({
        name: 'browser_network_requests',
        arguments: {}
      });

      // Obtener screenshot (opcional)
      let screenshot: Buffer | undefined;
      try {
        const screenshotResult = await this.mcpClient.callTool({
          name: 'browser_take_screenshot',
          arguments: { raw: true, fullPage: true }
        });

        if (screenshotResult.content && Array.isArray(screenshotResult.content)) {
          const imageData = screenshotResult.content.find((item: any) =>
            item.type === 'image' && item.data
          );
          if (imageData) {
            screenshot = Buffer.from(imageData.data, 'base64');
          }
        }
      } catch (error) {
        console.warn('[MCP] ⚠️ No se pudo obtener screenshot:', error);
      }

      // ✅ REHABILITADO: Obtener información específica del DOM con atributos HTML
      let jsElements: any[] = [];
      try {
        jsElements = await this.getJavaScriptElementData();
      } catch (error) {
        console.warn('[MCP] ⚠️ No se pudo obtener información del DOM:', error);
      }

      // Extraer elementos YAML del snapshot
      const accessibilityTree = this.parseAccessibilityTree(snapshotResult);
      const yamlElements = this.extractInteractiveElements(accessibilityTree);

      // ✅ REHABILITADO: Correlacionar YAML + JavaScript para obtener elementos híbridos
      let finalElements: any[] = [];
      if (jsElements.length > 0) {
        finalElements = await this.improvedCorrelation(yamlElements, jsElements);
      } else {
        finalElements = yamlElements;
      }

      // Obtener información de la página
      const pageInfo = await this.getPageInfo();

      const context: MCPContext = {
        domSnapshot: JSON.stringify(accessibilityTree, null, 2),
        accessibilityTree,
        interactiveElements: finalElements, // Usar elementos híbridos (YAML + JS)
        domElements: jsElements, // NUEVO: Elementos JavaScript puros
        consoleMessages: this.parseConsoleMessages(consoleResult),
        networkRequests: this.parseNetworkRequests(networkResult),
        screenshot,
        pageInfo
      };

      console.log(`[MCP] ✅ Contexto obtenido - ${finalElements.length} elementos detectados`);
      return context;

    } catch (error) {
      console.error('[MCP] ❌ Error obteniendo contexto:', error);
      throw error;
    }
  }

  /**
   * Parsea el árbol de accesibilidad del resultado del snapshot - CORREGIDO
   */
  private parseAccessibilityTree(snapshotResult: any): any {
    try {

      if (snapshotResult.content && Array.isArray(snapshotResult.content)) {
        const textContent = snapshotResult.content.find((item: any) => item.type === 'text');
        if (textContent && textContent.text) {
          // Usar el nuevo método de parsing seguro
          return this.safeJsonParse(textContent.text, { elements: [] });
        }
      }
      return snapshotResult.content || snapshotResult;
    } catch (error) {
      console.warn('[MCP] ⚠️ Error parseando accessibility tree:', error);
      return { elements: [] };
    }
  }

  /**
   * Extrae elementos interactivos del árbol de accesibilidad - MEJORADO
   */
  private extractInteractiveElements(accessibilityTree: any): MCPElement[] {

    const elements: MCPElement[] = [];

    // Si el parsing alternativo devolvió elementos directamente
    if (accessibilityTree.elements && Array.isArray(accessibilityTree.elements)) {
      return accessibilityTree.elements.map((el: any, index: number) => ({
        role: el.role || 'unknown',
        name: el.name || 'Sin nombre',
        element: el.element || el.role || '',
        ref: el.ref || index,
        disabled: el.disabled || false,
        checked: el.checked,
        expanded: el.expanded
      }));
    }

    const traverse = (node: any) => {
      if (!node) return;

      // Detectar elementos interactivos por su rol
      const interactiveRoles = [
        'button', 'link', 'textbox', 'combobox', 'checkbox',
        'radio', 'tab', 'menuitem', 'option', 'slider'
      ];

      if (node.role && interactiveRoles.includes(node.role.toLowerCase())) {
        elements.push({
          role: node.role,
          name: node.name || node.text || 'Sin nombre',
          element: node.element || '',
          ref: node.ref || elements.length,
          disabled: node.disabled || false,
          checked: node.checked,
          expanded: node.expanded
        });
      }

      // Continuar traversing en los hijos
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverse(child));
      }
    };

    traverse(accessibilityTree);
    return elements;
  }

  /**
   * Parsea mensajes de consola - CORREGIDO
   */
  private parseConsoleMessages(consoleResult: any): any[] {
    try {
      if (consoleResult.content && Array.isArray(consoleResult.content)) {
        const textContent = consoleResult.content.find((item: any) => item.type === 'text');
        if (textContent && textContent.text) {
          // Usar el nuevo método de parsing seguro
          return this.safeJsonParse(textContent.text, []);
        }
      }
      return Array.isArray(consoleResult) ? consoleResult : [];
    } catch (error) {
      console.warn('[MCP] ⚠️ Error parseando mensajes de consola:', error);
      return [];
    }
  }

  /**
   * Parsea peticiones de red - CORREGIDO
   */
  private parseNetworkRequests(networkResult: any): any[] {
    try {
      if (networkResult.content && Array.isArray(networkResult.content)) {
        const textContent = networkResult.content.find((item: any) => item.type === 'text');
        if (textContent && textContent.text) {
          // Usar el nuevo método de parsing seguro
          return this.safeJsonParse(textContent.text, []);
        }
      }
      return Array.isArray(networkResult) ? networkResult : [];
    } catch (error) {
      console.warn('[MCP] ⚠️ Error parseando peticiones de red:', error);
      return [];
    }
  }

  /**
   * NUEVO: Obtiene HTML snapshot completo sin procesamiento (solución genérica)
   */
  async getHtmlSnapshot(): Promise<string> {
    if (!this.mcpClient) {
      throw new Error('Cliente MCP no inicializado');
    }

    try {
      console.log('[MCP] Obteniendo HTML snapshot completo...');

      // Intentar usar browser_html_snapshot si está disponible
      try {
        const htmlResult = await this.mcpClient.callTool({
          name: 'browser_html_snapshot',
          arguments: {}
        });

        if (htmlResult.content && Array.isArray(htmlResult.content)) {
          const textContent = htmlResult.content.find((item: any) => item.type === 'text');
          if (textContent?.text) {
            console.log('[MCP] ✅ HTML snapshot obtenido con browser_html_snapshot');
            return textContent.text;
          }
        }

      } catch (error) {
        console.log('[MCP] ⚠️ browser_html_snapshot no disponible, usando browser_evaluate...');
      }

      // Fallback: usar browser_evaluate para obtener HTML
      const evalResult = await this.mcpClient.callTool({
        name: 'browser_evaluate',
        arguments: {
          function: `() => document.documentElement.outerHTML`
        }
      });

      if (evalResult.content && Array.isArray(evalResult.content)) {
        const textContent = evalResult.content.find((item: any) => item.type === 'text');
        if (textContent?.text) {
          console.log('[MCP] ✅ HTML snapshot obtenido con browser_evaluate fallback');
          return textContent.text;
        }
      }

      return '';

    } catch (error) {
      console.error('[MCP] ❌ Error obteniendo HTML snapshot:', error);
      return '';
    }
  }

  /**
   * NUEVO: Obtiene contexto híbrido completo sin hardcodeo - correlación automática
   */
  async getCompleteContext(url?: string): Promise<MCPContext & { hybridElements?: any[], rawJavaScriptData?: any[] }> {
    console.log('[MCP] 🎯 Iniciando getCompleteContext con correlación inteligente...');

    // 1. Obtener contexto básico (ARIA snapshot con refs)
    const basicContext = await this.getRealTimeContext(url);
    console.log(`[MCP] ✅ Contexto YAML obtenido: ${basicContext.interactiveElements.length} elementos`);

    // 2. Obtener datos JavaScript reales (sin refs porque no funciona)
    let jsElements: any[] = [];
    try {
      jsElements = await this.getJavaScriptElementData();
      console.log(`[MCP] ✅ Datos JavaScript obtenidos: ${jsElements.length} elementos`);
    } catch (error) {
      console.warn('[MCP] ⚠️ No se pudieron obtener datos JavaScript:', error);
    }

    // 3. Correlacionar YAML + JavaScript inteligentemente
    let hybridElements: any[] = [];
    if (jsElements.length > 0) {

      hybridElements = await this.improvedCorrelation(basicContext.interactiveElements, jsElements);
      console.log(`[MCP] ✅ Elementos híbridos generados: ${hybridElements.length}`);
    } else {
      // Si no hay datos JS, enriquecer solo con inferencias
      console.log('[MCP] ⚠️ Sin datos JS, usando solo enriquecimiento por inferencia');
      hybridElements = this.enrichMcpElements(basicContext.interactiveElements);
    }

    // 4. Retornar contexto completo con todos los datos
    return {
      ...basicContext,
      hybridElements,
      rawJavaScriptData: jsElements,
      // Sobrescribir interactiveElements con los híbridos para que todos los servicios los usen
      interactiveElements: hybridElements
    };
  }

  /**
   * NUEVO: Enriquece elementos MCP con atributos que ya proporciona (basado en StableMcpService)
   */
  private enrichMcpElements(mcpElements: any[]): any[] {
    return mcpElements.map((element, index) => {
      // Crear elemento híbrido con datos MCP + detección inteligente
      const hybridElement = {
        // Datos MCP originales
        ref: element.ref,
        role: element.role,
        element: element.element,
        name: element.name,
        text: element.text,
        disabled: element.disabled,
        checked: element.checked,
        expanded: element.expanded,

        // Atributos HTML que MCP ya proporciona (¡esta era la clave!)
        htmlAttributes: {
          type: element.attributes?.type || element.type || '',
          name: element.attributes?.name || element.name || '',
          id: element.attributes?.id || '',
          className: element.attributes?.class || element.attributes?.className || '',
          placeholder: element.attributes?.placeholder || '',
          tagName: element.tagName || this.inferTagName(element),
          ariaLabel: element.attributes?.['aria-label'] || '',
          disabled: element.disabled || false,
          required: element.attributes?.required || false,
          readonly: element.attributes?.readonly || false
        },

        // Generar selectores automáticamente usando la estrategia de StableMcpService
        selectors: this.generatePlaywrightSelectors(element)
      };

      return hybridElement;
    });
  }

  /**
   * Genera 5 selectores priorizados con reasoning basado en StableMcpService + v4 UniversalMcpExtractor
   */
  private generatePlaywrightSelectors(element: any): any[] {
    const prioritizedSelectors: any[] = [];

    // Extraer atributos disponibles - priorizar htmlAttributes para elementos correlacionados
    const htmlAttrs = element.htmlAttributes || element.attributes || {};
    const id = htmlAttrs.id || element.id || '';
    const name = htmlAttrs.name || element.name || '';
    const type = htmlAttrs.type || element.type || '';
    const placeholder = htmlAttrs.placeholder || element.placeholder || '';
    const className = htmlAttrs.className || htmlAttrs.class || element.className || '';
    const tagName = htmlAttrs.tagName || element.tagName || this.inferTagName(element);
    const text = element.text || element.name || '';
    const role = element.role;

    // Generar pool de selectores candidatos con confiabilidad
    const selectorCandidates: Array<{selector: any, confidence: number, reasoning: string}> = [];

    // PRIORIDAD 1: Role con name (MÁS ROBUSTO según Playwright)
    if (role && text && this.isValidPlaywrightRole(role)) {
      selectorCandidates.push({
        selector: { type: 'getByRole', value: role, options: { name: text } },
        confidence: 95,
        reasoning: 'Most robust - role with accessible name'
      });
    }

    // PRIORIDAD 1: Label asociado (MÁS ROBUSTO)
    if (text && text.trim() !== '') {
      selectorCandidates.push({
        selector: { type: 'getByLabel', value: text },
        confidence: 90,
        reasoning: 'Most robust - associated label'
      });
    }

    // PRIORIDAD 1: Test ID (MÁS ROBUSTO para testing)
    if (element.attributes?.dataTestId || element.dataTestId) {
      const testId = element.attributes?.dataTestId || element.dataTestId;
      selectorCandidates.push({
        selector: { type: 'getByTestId', value: testId },
        confidence: 88,
        reasoning: 'Most robust - dedicated test ID'
      });
    }

    // PRIORIDAD 2: Placeholder específico (ROBUSTO)
    if (placeholder && placeholder.trim() !== '') {
      selectorCandidates.push({
        selector: { type: 'getByPlaceholder', value: placeholder },
        confidence: 85,
        reasoning: 'High reliability - placeholder text'
      });
    }

    // PRIORIDAD 2: Role sin name (ROBUSTO)
    if (role && this.isValidPlaywrightRole(role)) {
      selectorCandidates.push({
        selector: { type: 'getByRole', value: role },
        confidence: 80,
        reasoning: 'High reliability - semantic role'
      });
    }

    // PRIORIDAD 3: Texto visible (MEDIANAMENTE ROBUSTO)
    if (text && text.trim() !== '') {
      selectorCandidates.push({
        selector: { type: 'getByText', value: text },
        confidence: 75,
        reasoning: 'Medium reliability - visible text'
      });
    }

    // PRIORIDAD 4: Title attribute (MENOS ROBUSTO)
    if (element.attributes?.title && element.attributes.title.trim() !== '') {
      selectorCandidates.push({
        selector: { type: 'getByTitle', value: element.attributes.title },
        confidence: 65,
        reasoning: 'Lower reliability - title attribute'
      });
    }

    // PRIORIDAD 4: Alt text para imágenes (MENOS ROBUSTO)
    if (element.attributes?.alt && element.attributes.alt.trim() !== '') {
      selectorCandidates.push({
        selector: { type: 'getByAltText', value: element.attributes.alt },
        confidence: 60,
        reasoning: 'Lower reliability - alt text'
      });
    }

    // PRIORIDAD 1.5: ID único (MUY ROBUSTO)
    if (id && id.trim() !== '') {
      selectorCandidates.push({
        selector: { type: 'locator', value: `#${id}` },
        confidence: 92,
        reasoning: 'Very robust - unique ID selector'
      });
    }

    // PRIORIDAD 5: CSS locators - Name + Type (FALLBACK)
    if (name && type && name.trim() !== '' && type.trim() !== '') {
      selectorCandidates.push({
        selector: { type: 'locator', value: `${tagName}[name="${name}"][type="${type}"]` },
        confidence: 50,
        reasoning: 'Fallback option - name and type'
      });
    }

    // PRIORIDAD 5: XPath como último recurso (MENOS RECOMENDADO)
    if (type) {
      selectorCandidates.push({
        selector: { type: 'locator', value: `//${tagName}[@type="${type}"]` },
        confidence: 45,
        reasoning: 'Last resort - XPath selector'
      });
    } else if (role) {
      selectorCandidates.push({
        selector: { type: 'locator', value: `//*[@role="${role}"]` },
        confidence: 40,
        reasoning: 'Last resort - XPath by role'
      });
    }

    // Ordenar por confiabilidad y seleccionar los mejores 5
    const sortedCandidates = selectorCandidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    // Asignar prioridades 1-5 y construir selectores finales
    sortedCandidates.forEach((candidate, index) => {
      const priority = index + 1;
      prioritizedSelectors.push({
        ...candidate.selector,
        priority,
        reason: candidate.reasoning
      });
    });

    // Si no tenemos 5 selectores, completar con estrategias adicionales
    while (prioritizedSelectors.length < 5) {
      const fallbackPriority = prioritizedSelectors.length + 1;
      prioritizedSelectors.push({
        type: 'locator',
        value: `${tagName}:nth-of-type(${fallbackPriority})`,
        priority: fallbackPriority,
        reason: `Fallback ${fallbackPriority} - nth-of-type selector`
      });
    }

    const validatedSelectors = this.validatePlaywrightSelectors(prioritizedSelectors);

    return validatedSelectors;
  }

  /**
   * Verifica si un role es válido para Playwright getByRole
   */
  private isValidPlaywrightRole(role: string): boolean {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'blockquote',
      'button', 'caption', 'cell', 'checkbox', 'code', 'columnheader', 'combobox',
      'complementary', 'contentinfo', 'definition', 'deletion', 'dialog', 'directory',
      'document', 'emphasis', 'feed', 'figure', 'form', 'grid', 'gridcell',
      'group', 'heading', 'img', 'insertion', 'link', 'list', 'listbox', 'listitem',
      'log', 'main', 'marquee', 'math', 'meter', 'menu', 'menubar', 'menuitem',
      'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
      'paragraph', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region',
      'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
      'slider', 'spinbutton', 'status', 'strong', 'subscript', 'superscript', 'switch',
      'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox', 'time', 'timer',
      'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];
    return validRoles.includes(role?.toLowerCase());
  }

  /**
   * Infiere el tagName basado en el role y tipo con convenciones HTML estándar
   */
  private inferTagName(element: any): string {
    const type = element.attributes?.type || element.type;
    const role = element.role?.toLowerCase();

    // Elementos de input por tipo específico
    if (role === 'textbox') {
      if (type === 'textarea') return 'textarea';
      if (type === 'email') return 'input';
      if (type === 'password') return 'input';
      if (type === 'tel') return 'input';
      if (type === 'url') return 'input';
      if (type === 'search') return 'input';
      if (type === 'number') return 'input';
      if (type === 'date') return 'input';
      if (type === 'datetime-local') return 'input';
      if (type === 'time') return 'input';
      if (type === 'week') return 'input';
      if (type === 'month') return 'input';
      if (type === 'color') return 'input';
      return 'input'; // fallback para textbox
    }

    // Elementos de botón
    if (role === 'button') {
      if (type === 'submit') return 'button';
      if (type === 'reset') return 'button';
      if (type === 'button') return 'button';
      return 'button';
    }

    // Elementos de enlace
    if (role === 'link') {
      return 'a';
    }

    // Elementos de selección
    if (role === 'combobox' || role === 'listbox') {
      return 'select';
    }

    // Elementos de checkbox y radio
    if (role === 'checkbox') {
      return 'input';
    }
    if (role === 'radio') {
      return 'input';
    }

    // Elementos semánticos HTML5
    if (role === 'main') return 'main';
    if (role === 'navigation') return 'nav';
    if (role === 'article') return 'article';
    if (role === 'section') return 'section';
    if (role === 'aside') return 'aside';
    if (role === 'header') return 'header';
    if (role === 'footer') return 'footer';
    if (role === 'figure') return 'figure';

    // Elementos de encabezado
    if (role === 'heading') {
      // Intentar inferir nivel si está disponible
      const level = element.attributes?.level || element.attributes?.['aria-level'];
      if (level >= 1 && level <= 6) {
        return `h${level}`;
      }
      return 'h1'; // fallback
    }

    // Elementos de lista
    if (role === 'list') return 'ul';
    if (role === 'listitem') return 'li';

    // Elementos de tabla
    if (role === 'table') return 'table';
    if (role === 'row') return 'tr';
    if (role === 'cell' || role === 'gridcell') return 'td';
    if (role === 'columnheader' || role === 'rowheader') return 'th';

    // Elementos de formulario
    if (role === 'form') return 'form';
    if (role === 'group') return 'fieldset';

    // Elementos de multimedia
    if (role === 'img') return 'img';

    // Elementos de entrada de archivos
    if (type === 'file') return 'input';
    if (type === 'range') return 'input';
    if (type === 'hidden') return 'input';

    // Elementos interactivos
    if (role === 'slider') return 'input';
    if (role === 'spinbutton') return 'input';
    if (role === 'progressbar') return 'progress';
    if (role === 'meter') return 'meter';

    // Elementos de texto
    if (role === 'paragraph') return 'p';
    if (role === 'blockquote') return 'blockquote';
    if (role === 'code') return 'code';
    if (role === 'emphasis') return 'em';
    if (role === 'strong') return 'strong';

    // Elementos de diálogo
    if (role === 'dialog') return 'dialog';
    if (role === 'alertdialog') return 'dialog';

    return 'div'; // fallback
  }

  /**
   * REHABILITADO + MEJORADO: Extrae datos HTML reales + elementos dinámicos usando browser_evaluate
   */
  private async getJavaScriptElementData(): Promise<any[]> {
    if (!this.mcpClient) {
      throw new Error('Cliente MCP no inicializado');
    }

    try {

      // ✅ SOLUCIÓN EXITOSA: JavaScript directo sin parámetro ref
      const result = await this.mcpClient.callTool({
        name: 'browser_evaluate',
        arguments: {
          function: `() => {
            // ESTRATEGIA INTELIGENTE: Solo capturar elementos relevantes
            // 1. Todos los elementos con role (para correlacionar con YAML)
            // 2. Elementos interactivos comunes
            // 3. Elementos contenedores que podrían tener role="generic"
            const elements = Array.from(document.querySelectorAll('*')).filter(el => {
              const tag = el.tagName.toLowerCase();

              // Excluir elementos no renderizables
              const excludeTags = ['script', 'style', 'meta', 'link', 'noscript', 'template', 'head'];
              if (excludeTags.includes(tag)) return false;

              // Incluir si tiene atributo role
              if (el.getAttribute('role')) return true;

              // Incluir elementos interactivos nativos
              const interactiveTags = ['input', 'button', 'select', 'textarea', 'a', 'form'];
              if (interactiveTags.includes(tag)) return true;

              // Incluir elementos con atributos de prueba/automatización
              if (el.id ||
                  el.getAttribute('data-testid') ||
                  el.getAttribute('data-cy') ||
                  el.getAttribute('data-qa')) return true;

              // Incluir elementos contenedores comunes que podrían correlacionar con "generic"
              const containerTags = ['div', 'span', 'section', 'article', 'aside', 'main', 'nav', 'header', 'footer'];
              if (containerTags.includes(tag)) {
                // Solo incluir si tienen alguna característica identificable
                const rect = el.getBoundingClientRect();
                const hasContent = el.textContent && el.textContent.trim().length > 0;
                const isVisible = rect.width > 0 && rect.height > 0;
                const hasChildren = el.children.length > 0;

                return isVisible && (hasContent || hasChildren);
              }

              // Incluir elementos semánticos HTML5
              const semanticTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'ul', 'ol', 'li', 'table'];
              if (semanticTags.includes(tag)) return true;

              return false;
            });

            return elements.map((el, index) => {
              // Obtener TODOS los atributos HTML reales
              const rect = el.getBoundingClientRect();

              // Incluir TODOS los elementos, visibles o no
              return {
                  index: index,
                  tagName: el.tagName.toLowerCase(),

                  // ✅ CRÍTICO: Atributos HTML directos
                  type: el.type || '',
                  name: el.name || '',
                  id: el.id || '',
                  className: typeof el.className === 'string' ? el.className : (el.className?.toString() || ''),
                  placeholder: el.placeholder || '',
                  value: el.value || '',

                  // Atributos ARIA
                  role: el.getAttribute('role') || '',
                  ariaLabel: el.getAttribute('aria-label') || '',
                  ariaLabelledby: el.getAttribute('aria-labelledby') || '',
                  ariaLive: el.getAttribute('aria-live') || '',
                  ariaHidden: el.getAttribute('aria-hidden') || '',

                  // ✅ NUEVO: Atributos para elementos dinámicos
                  dataTestId: el.getAttribute('data-testid') || '',
                  dataCy: el.getAttribute('data-cy') || '',
                  dataQa: el.getAttribute('data-qa') || '',
                  dataAutomation: el.getAttribute('data-automation') || '',

                  // Texto y contenido
                  textContent: el.textContent?.trim().substring(0, 100) || '',
                  innerText: el.innerText?.trim().substring(0, 100) || '',

                  // Propiedades computadas
                  disabled: el.disabled || false,
                  required: el.required || false,
                  readonly: el.readOnly || false,
                  checked: el.checked || false,
                  selected: el.selected || false,

                  // ✅ NUEVO: Detectar elementos dinámicos
                  isDynamic: !!(
                    el.getAttribute('data-testid') ||
                    el.getAttribute('data-cy') ||
                    el.getAttribute('data-qa') ||
                    el.getAttribute('aria-live') ||

                    el.onclick ||
                    el.onchange
                  ),

                  // ✅ NUEVO: Tipo de elemento dinámico
                  dynamicType: el.getAttribute('aria-live') ? 'live-region' :

                              el.onclick ? 'interactive' :
                              el.getAttribute('data-testid') ? 'test-target' :
                              'standard',

                  // Posición
                  boundingBox: {
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                  }
                };
            });
          }`
        }
      });

      // Parsear respuesta usando método documentado
      if (result && result.content && result.content[0] && result.content[0].text) {
        const textContent = result.content[0].text;

        // Intentar regex primero (método documentado)
        const resultMatch = textContent.match(/### Result\n(.*?)(?:\n\n###|$)/s);
        let jsonData: string;

        if (resultMatch) {
          jsonData = resultMatch[1].trim();
        } else {
          // Fallback: parsing directo
          jsonData = textContent;
        }

        // Verificar si hay errores en el contenido antes de parsear
        if (jsonData.startsWith('Error:') || jsonData.includes('Error:')) {
          console.error('[MCP] ❌ browser_evaluate devolvió error:', jsonData.substring(0, 200));
          return []; // Retornar array vacío en lugar de fallar
        }

        try {
          const htmlElements = JSON.parse(jsonData);
          return htmlElements;

        } catch (parseError) {
          console.error('[MCP] ❌ Error parseando JSON HTML:', parseError);
          console.warn('[MCP] Cayendo a método sin browser_evaluate');
          return [];
        }
      } else {
        console.warn('[MCP] ⚠️ Respuesta inesperada de browser_evaluate');
        return [];
      }

    } catch (error) {
      console.warn('[MCP] ⚠️ Error con browser_evaluate rehabilitado:', error);
      console.warn('[MCP] Cayendo a método sin JavaScript data');
      return [];
    }
  }

  /**
   * MEJORADO: Correlación inteligente por contexto, no por posición
   */
  private async improvedCorrelation(yamlElements: any[], jsElements: any[]): Promise<any[]> {
    console.log('[MCP] 🧠 Iniciando correlación inteligente YAML + JavaScript...');
    const hybridElements: any[] = [];

    // Crear mapas para búsqueda eficiente
    const jsElementsByType = new Map<string, any[]>();
    const jsElementsByText = new Map<string, any[]>();

    // Indexar elementos JavaScript
    jsElements.forEach(jsEl => {
      // Por tipo
      const type = jsEl.type || jsEl.tagName || 'unknown';
      if (!jsElementsByType.has(type)) {
        jsElementsByType.set(type, []);
      }
      jsElementsByType.get(type)!.push(jsEl);

      // Por texto/placeholder
      const texts = [
        jsEl.placeholder,
        jsEl.textContent,
        jsEl.innerText,
        jsEl.ariaLabel,
        jsEl.name
      ].filter(t => t && t.trim());

      texts.forEach(text => {
        const key = text.toLowerCase().trim();
        if (!jsElementsByText.has(key)) {
          jsElementsByText.set(key, []);
        }
        jsElementsByText.get(key)!.push(jsEl);
      });
    });

    // Correlacionar cada elemento YAML
    for (const yamlEl of yamlElements) {


      // Crear elemento híbrido base
      const hybridElement = {
        // Datos YAML (fuente de verdad para MCP)
        ref: yamlEl.ref,
        role: yamlEl.role,
        element: yamlEl.element,
        name: yamlEl.name,
        text: yamlEl.name,
        disabled: yamlEl.disabled,
        checked: yamlEl.checked,
        expanded: yamlEl.expanded,

        // Datos HTML que llenaremos
        htmlAttributes: {
          type: '',
          name: '',
          id: '',
          className: '',
          placeholder: '',
          tagName: '',
          ariaLabel: '',
          disabled: false,
          required: false,
          readonly: false,
          value: '',
          textContent: '',
          innerText: ''
        },

        // Metadatos de correlación
        correlationScore: 0,
        correlationMethod: 'none',
        correlationIndex: yamlElements.indexOf(yamlEl),

        // Selectores se generarán al final
        selectors: [] as any[]
      };

      // Intentar correlación inteligente
      let correlatedJs: any = null;
      let bestScore = 0;
      let method = 'none';

      // 1. PRIORIDAD ALTA: Correlación por nombre/texto exacto
      if (yamlEl.name && yamlEl.name !== '- textbox' && yamlEl.name !== '- generic') {
        const nameKey = yamlEl.name.toLowerCase().trim();
        const candidates = jsElementsByText.get(nameKey) || [];

        for (const candidate of candidates) {
          // Verificar compatibilidad de roles
          if (this.areRolesCompatible(yamlEl.role, candidate.tagName, candidate.type)) {
            correlatedJs = candidate;
            bestScore = 1.0;
            method = 'exact-text-match';
            break;
          }
        }
      }

      // 2. PRIORIDAD MEDIA: Correlación por coincidencia parcial de texto
      if (!correlatedJs && yamlEl.name && yamlEl.name !== '- textbox' && yamlEl.name !== '- generic') {
        // Buscar coincidencias parciales en cualquier atributo de texto
        const yamlNameLower = yamlEl.name.toLowerCase().trim();

        // Buscar elementos que contengan parte del nombre YAML en sus atributos
        for (const jsEl of jsElements) {
          const jsTexts = [
            jsEl.placeholder,
            jsEl.ariaLabel,
            jsEl.name,
            jsEl.title,
            jsEl.value
          ].filter(t => t && t.trim());

          // Verificar si algún texto JS contiene el nombre YAML o viceversa
          const hasPartialMatch = jsTexts.some(text => {
            const textLower = text.toLowerCase().trim();
            return textLower.includes(yamlNameLower) || yamlNameLower.includes(textLower);
          });

          if (hasPartialMatch && this.areRolesCompatible(yamlEl.role, jsEl.tagName, jsEl.type)) {
            correlatedJs = jsEl;
            bestScore = 0.8;
            method = 'partial-text-match';
            break;
          }
        }
      }

      // 3. PRIORIDAD MEDIA-BAJA: Correlación por posición y tipo genérico
      if (!correlatedJs && yamlEl.role) {
        // Buscar elementos con el mismo rol o tipo compatible
        const compatibleElements = jsElements.filter(js => {
          // Para generic, buscar divs sin role específico
          if (yamlEl.role === 'generic') {
            return js.tagName === 'div' && !js.role;
          }
          // Para otros roles, usar compatibilidad estándar
          return this.areRolesCompatible(yamlEl.role, js.tagName, js.type);
        });

        // Si hay elementos compatibles, usar índice relativo
        if (compatibleElements.length > 0) {
          // Contar cuántos elementos del mismo rol hay antes en YAML
          const yamlIndex = yamlElements
            .slice(0, yamlElements.indexOf(yamlEl))
            .filter(el => el.role === yamlEl.role).length;

          // Tomar el elemento en la misma posición relativa
          if (compatibleElements[yamlIndex]) {
            correlatedJs = compatibleElements[yamlIndex];
            bestScore = 0.7;
            method = 'position-based';
          }
        }
      }


      // Aplicar correlación si encontramos match
      if (correlatedJs) {

        // Copiar todos los atributos HTML
        hybridElement.htmlAttributes = {
          type: correlatedJs.type || '',
          name: correlatedJs.name || '',
          id: correlatedJs.id || '',
          className: correlatedJs.className || '',
          placeholder: correlatedJs.placeholder || '',
          tagName: correlatedJs.tagName || '',
          ariaLabel: correlatedJs.ariaLabel || '',
          disabled: correlatedJs.disabled || false,
          required: correlatedJs.required || false,
          readonly: correlatedJs.readonly || false,
          value: correlatedJs.value || '',
          textContent: correlatedJs.textContent || '',
          innerText: correlatedJs.innerText || ''
        };

        hybridElement.correlationScore = bestScore;
        hybridElement.correlationMethod = method;

        // Si el elemento YAML no tiene nombre pero el JS sí, usar el del JS
        if ((!hybridElement.name || hybridElement.name === '- textbox') && correlatedJs.placeholder) {
          hybridElement.name = correlatedJs.placeholder;
          hybridElement.text = correlatedJs.placeholder;
        }
      } else {

      }

      // Generar selectores priorizados (con o sin correlación)
      hybridElement.selectors = this.generatePlaywrightSelectors(hybridElement);

      // Agregar todos los elementos (no filtrar por role o contenido)
      hybridElements.push(hybridElement);
    }

    console.log(`[MCP] ✅ Correlación completada: ${hybridElements.length} elementos híbridos`);

    // Mostrar resumen de correlación
    const correlated = hybridElements.filter(el => el.correlationScore > 0);


    return hybridElements;
  }

  /**
   * Verifica si un rol YAML es compatible con un elemento HTML
   */
  private areRolesCompatible(yamlRole: string, htmlTag: string, htmlType?: string): boolean {
    const compatibility: Record<string, string[]> = {
      'textbox': ['input', 'textarea'],
      'button': ['button', 'input'], // input type="submit"
      'link': ['a'],
      'checkbox': ['input'],
      'radio': ['input'],
      'combobox': ['select'],
      'img': ['img'],
      'heading': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      'generic': ['div', 'span', 'section', 'article', 'aside']
    };

    const compatibleTags = compatibility[yamlRole] || [];
    return compatibleTags.includes(htmlTag.toLowerCase());
  }

  /**
   * Valida que los selectores sean compatibles con Playwright
   */
  private validatePlaywrightSelectors(selectors: any[]): any[] {
    const validPlaywrightTypes = [
      'locator',      // Para CSS y XPath selectores
      'getByRole',
      'getByText',
      'getByLabel',
      'getByPlaceholder',
      'getByTestId',
      'getByTitle',
      'getByAltText'
    ];

    return selectors.filter(selector => {
      // Verificar tipo de selector válido
      if (!validPlaywrightTypes.includes(selector.type)) {
        return false;
      }

      // Verificar roles válidos para getByRole
      if (selector.type === 'getByRole') {
        if (!this.isValidPlaywrightRole(selector.value)) {
          return false;
        }
      }

      // Verificar que tengan valor
      if (!selector.value || selector.value.trim() === '') {
        return false;
      }

      return true;
    });
  }

  /**
   * Obtiene información básica de la página - CORREGIDO
   */
  private async getPageInfo(): Promise<{ url: string; title: string; timestamp: string }> {
    try {
      // Usar browser_evaluate para obtener URL y título
      const evalResult = await this.mcpClient!.callTool({
        name: 'browser_evaluate',
        arguments: {
          function: `() => ({ url: window.location.href, title: document.title })`
        }
      });

      let pageData = { url: 'unknown', title: 'unknown' };

      if (evalResult.content && Array.isArray(evalResult.content)) {
        const textContent = evalResult.content.find((item: any) => item.type === 'text');
        if (textContent && textContent.text) {
          // Usar el nuevo método de parsing seguro
          pageData = this.safeJsonParse(textContent.text, pageData);
        }
      }

      return {
        url: pageData.url,
        title: pageData.title,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('[MCP] ⚠️ Error obteniendo información de página:', error);
      return {
        url: 'unknown',
        title: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cierra el servidor MCP de forma limpia
   */
  async stopMCPServer(): Promise<void> {
    console.log('[MCP] Cerrando servidor MCP...');

    try {
      await this.cleanup();
      console.log('[MCP] ✅ Servidor MCP cerrado exitosamente');
    } catch (error) {
      console.warn('[MCP] ⚠️ Error cerrando servidor MCP:', error);
    }
  }

  /**
   * Limpieza completa de recursos
   */
  private async cleanup(): Promise<void> {
    // Cerrar cliente MCP
    if (this.mcpClient) {
      try {
        await this.mcpClient.close();
      } catch (error) {
        console.warn('[MCP] ⚠️ Error cerrando cliente MCP:', error);
      }
      this.mcpClient = null;
    }

    // Cerrar transporte (esto también cierra el proceso interno)
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.warn('[MCP] ⚠️ Error cerrando transporte:', error);
      }
      this.transport = null;
    }

    // El proceso es manejado internamente por StdioClientTransport
    this.mcpProcess = null;
  }

  /**
   * Verifica si el cliente MCP está conectado y funcionando
   */
  isConnected(): boolean {
    return !!(this.mcpClient && this.transport);
  }

  /**
   * NUEVO: Espera y valida que la URL actual contenga el texto especificado
   */
  async waitForUrlContains(expectedUrlPart: string, timeoutMs: number = 15000): Promise<boolean> {
    if (!this.mcpClient) {
      throw new Error('Cliente MCP no inicializado');
    }

    console.log(`[MCP] ⏳ Esperando URL que contenga: ${expectedUrlPart}`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const pageInfo = await this.getPageInfo();

        if (pageInfo.url.includes(expectedUrlPart)) {
          console.log(`[MCP] ✅ URL válida encontrada: ${pageInfo.url}`);
          return true;
        }

        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.warn(`[MCP] ⚠️ Error verificando URL:`, error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Si llegamos aquí, timeout
    try {
      const finalPageInfo = await this.getPageInfo();
      console.error(`[MCP] ❌ Timeout esperando URL con '${expectedUrlPart}'. URL actual: ${finalPageInfo.url}`);
    } catch {
      console.error(`[MCP] ❌ Timeout esperando URL con '${expectedUrlPart}'. No se pudo obtener URL actual.`);
    }

    return false;
  }
}
