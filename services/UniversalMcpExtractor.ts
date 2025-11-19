// orchestrator/services/UniversalMcpExtractor.ts
// Wrapper para mantener compatibilidad con tests existentes

import { MCPClientService } from './McpClientService';

export interface UniversalElement {
  // Información YAML
  role: string;
  name: string;
  ref: string;

  // Atributos HTML completos
  htmlAttributes: {
    tagName: string;
    type: string;
    id: string;
    name: string;
    className: string;
    placeholder: string;
    value: string;
    textContent: string;
    innerText: string;
    disabled: boolean;
    required: boolean;
    readonly: boolean;
    checked?: boolean;
    selected?: boolean;
    ariaLabel?: string;
    ariaLabelledby?: string;
    dataTestId?: string;
    dataCy?: string;
    dataQa?: string;
  };

  // Metadatos de correlación
  correlationScore: number;
  correlationIndex?: number;
  correlationMethod?: string;

  // Selectores priorizados
  selectors: Array<{
    type: string;
    value: string;
    priority: number;
    reason: string;
    options?: any;
  }>;
}

export class UniversalMcpExtractor {
  constructor(private mcpClient: MCPClientService) {}

  /**
   * Extrae elementos universales con correlación completa YAML + HTML
   */
  async extractUniversalElements(): Promise<UniversalElement[]> {
    // Obtener contexto completo con correlación
    const context = await this.mcpClient.getCompleteContext();

    if (!context.hybridElements || context.hybridElements.length === 0) {
      console.warn('[UniversalExtractor] No se encontraron elementos híbridos');
      return [];
    }

    // Transformar elementos híbridos al formato UniversalElement
    return context.hybridElements.map((el: any, index: number) => {
      // Asegurar estructura de htmlAttributes
      const htmlAttrs = el.htmlAttributes || {};

      return {
        // Información YAML
        role: el.role || 'unknown',
        name: el.name || el.text || '',
        ref: el.ref || `unknown-${index}`,

        // Atributos HTML completos
        htmlAttributes: {
          tagName: htmlAttrs.tagName || this.inferTagNameFromRole(el.role),
          type: htmlAttrs.type || '',
          id: htmlAttrs.id || '',
          name: htmlAttrs.name || '',
          className: htmlAttrs.className || '',
          placeholder: htmlAttrs.placeholder || '',
          value: htmlAttrs.value || '',
          textContent: htmlAttrs.textContent || '',
          innerText: htmlAttrs.innerText || '',
          disabled: htmlAttrs.disabled || false,
          required: htmlAttrs.required || false,
          readonly: htmlAttrs.readonly || false,
          checked: htmlAttrs.checked,
          selected: htmlAttrs.selected,
          ariaLabel: htmlAttrs.ariaLabel,
          ariaLabelledby: htmlAttrs.ariaLabelledby,
          dataTestId: htmlAttrs.dataTestId,
          dataCy: htmlAttrs.dataCy,
          dataQa: htmlAttrs.dataQa
        },

        // Metadatos de correlación
        correlationScore: el.correlationScore || 0,
        correlationIndex: index,
        correlationMethod: el.correlationMethod || 'none',

        // Selectores priorizados
        selectors: el.selectors || []
      } as UniversalElement;
    });
  }

  /**
   * Filtra elementos compatibles con Playwright
   */
  filterPlaywrightCompatible(elements: UniversalElement[]): UniversalElement[] {
    // Todos los roles ARIA no abstractos y no deprecados
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner',
      'button', 'checkbox', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'definition', 'dialog', 'document', 'feed',
      'figure', 'form', 'grid', 'gridcell', 'group',
      'heading', 'img', 'link', 'list', 'listbox',
      'listitem', 'log', 'main', 'menu', 'menubar',
      'menuitem', 'menuitemcheckbox', 'menuitemradio', 'meter', 'navigation',
      'note', 'option', 'progressbar', 'radio', 'radiogroup',
      'region', 'row', 'rowgroup', 'rowheader', 'scrollbar',
      'search', 'searchbox', 'separator', 'slider', 'spinbutton',
      'status', 'table', 'tab', 'tablist', 'tabpanel',
      'term', 'textbox', 'timer', 'toolbar', 'tooltip',
      'tree', 'treegrid', 'treeitem', 'presentation', 'none'
    ];
    // Elementos interactivos HTML5 según MDN
    const interactiveTags = [
      'button', 'details', 'embed', 'iframe', 'label',
      'select', 'textarea', 'a', 'audio', 'img',
      'input', 'object', 'video'
    ];

    return elements.filter(el => {
      // 1) Cualquier elemento con rol ARIA válido
      if (el.role && validRoles.includes(el.role))
        return true;

      // 2) Cualquier tag HTML interactivo
      const tag = el.htmlAttributes.tagName.toLowerCase();
      if (interactiveTags.includes(tag))
        return true;

      // 3) Cualquier elemento con selectores existentes
      if (el.selectors && el.selectors.length > 0)
        return true;

      return false;
    });
  }

  /**
   * Infieren un tag HTML apropiado a partir del role ARIA
   */
  private inferTagNameFromRole(role: string): string {
    const roleToTag: Record<string, string> = {
      'alert': 'div',
      'alertdialog': 'div',
      'application': 'div',
      'article': 'article',
      'banner': 'header',
      'button': 'button',
      'checkbox': 'input',
      'columnheader': 'th',
      'combobox': 'select',
      'complementary': 'aside',
      'contentinfo': 'footer',
      'definition': 'dfn',
      'dialog': 'dialog',
      'document': 'div',
      'feed': 'div',
      'figure': 'figure',
      'form': 'form',
      'grid': 'div',
      'gridcell': 'td',
      'group': 'div',
      'heading': 'h1',
      'img': 'img',
      'input': 'input',
      'link': 'a',
      'list': 'ul',
      'listbox': 'select',
      'listitem': 'li',
      'log': 'div',
      'main': 'main',
      'menu': 'ul',
      'menubar': 'div',
      'menuitem': 'li',
      'menuitemcheckbox': 'li',
      'menuitemradio': 'li',
      'meter': 'meter',
      'navigation': 'nav',
      'note': 'div',
      'option': 'option',
      'progressbar': 'progress',
      'radio': 'input',
      'radiogroup': 'div',
      'region': 'section',
      'row': 'tr',
      'rowgroup': 'tbody',
      'rowheader': 'th',
      'scrollbar': 'div',
      'search': 'form',
      'searchbox': 'input',
      'separator': 'hr',
      'slider': 'input',
      'spinbutton': 'input',
      'status': 'div',
      'table': 'table',
      'tab': 'button',
      'tablist': 'div',
      'tabpanel': 'div',
      'term': 'dfn',
      'textbox': 'input',
      'timer': 'time',
      'toolbar': 'div',
      'tooltip': 'div',
      'tree': 'ul',
      'treegrid': 'table',
      'treeitem': 'li',
      'presentation': 'span',
      'none': 'span'
    };

  return roleToTag[role] || 'div';
  }
}
