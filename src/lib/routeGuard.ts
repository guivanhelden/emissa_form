/**
 * Utilitário para garantir navegação segura entre rotas
 */

import { debugUtils } from './debugUtils';

/**
 * Verifica se a navegação é segura antes de mudar de rota
 * Limpa referências pendentes e garante que o DOM esteja em estado consistente
 */
export const routeGuard = {
  /**
   * Prepara a aplicação para navegação segura
   * @returns {boolean} true se a navegação pode prosseguir
   */
  prepareForNavigation: (): boolean => {
    try {
      // Verifica se há operações pendentes no DOM
      const pendingOperations = document.querySelectorAll('[data-pending-operation="true"]');
      if (pendingOperations.length > 0) {
        debugUtils.log(`Encontradas ${pendingOperations.length} operações pendentes`);
        
        // Limpa operações pendentes
        pendingOperations.forEach(element => {
          try {
            element.removeAttribute('data-pending-operation');
            debugUtils.log(`Operação pendente removida para ${element.nodeName}`);
          } catch (error) {
            debugUtils.log(`Erro ao limpar operação pendente: ${error}`);
          }
        });
      }
      
      return true;
    } catch (error) {
      debugUtils.log(`Erro ao preparar para navegação: ${error}`);
      return true; // Permite a navegação mesmo com erro para evitar bloqueio
    }
  },
  
  /**
   * Limpa recursos após a navegação
   */
  cleanupAfterNavigation: (): void => {
    try {
      // Força a coleta de lixo (não funciona diretamente, mas pode ajudar)
      if (window.gc) {
        window.gc();
      }
      
      // Limpa event listeners órfãos (exemplo simplificado)
      const orphanedElements = document.querySelectorAll('[data-orphaned="true"]');
      orphanedElements.forEach(element => {
        try {
          // Cria uma cópia do elemento para remover todos os event listeners
          const parent = element.parentNode;
          if (parent) {
            const clone = element.cloneNode(true);
            parent.replaceChild(clone, element);
            debugUtils.log(`Elemento órfão substituído: ${element.nodeName}`);
          }
        } catch (error) {
          debugUtils.log(`Erro ao limpar elemento órfão: ${error}`);
        }
      });
    } catch (error) {
      debugUtils.log(`Erro na limpeza após navegação: ${error}`);
    }
  },

  /**
   * Processa parâmetros da URL, incluindo configurações de idioma
   */
  processUrlParameters: (): void => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let paramsChanged = false;
      
      // Processa o parâmetro forceLocale
      const forceLocale = urlParams.get('forceLocale');
      if (forceLocale) {
        localStorage.setItem('forceLocale', forceLocale);
        debugUtils.log(`Locale forçado via URL: ${forceLocale}`);
        
        // Remove o parâmetro da URL
        urlParams.delete('forceLocale');
        paramsChanged = true;
      }
      
      // Processa o parâmetro debug
      const debugMode = urlParams.get('debug');
      if (debugMode === 'true' || debugMode === '1') {
        debugUtils.enable();
        
        // Remove o parâmetro da URL
        urlParams.delete('debug');
        paramsChanged = true;
      }
      
      // Se algum parâmetro foi processado e removido, atualiza a URL
      if (paramsChanged) {
        const newSearch = urlParams.toString() ? `?${urlParams.toString()}` : '';
        const newUrl = window.location.pathname + newSearch + window.location.hash;
        
        // Atualiza a URL sem recarregar a página
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (error) {
      debugUtils.log(`Erro ao processar parâmetros da URL: ${error}`);
    }
  }
};

// Adiciona interface para o objeto window
declare global {
  interface Window {
    gc?: () => void;
  }
}
