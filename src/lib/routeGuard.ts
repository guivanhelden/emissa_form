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
  }
};

// Adiciona interface para o objeto window
declare global {
  interface Window {
    gc?: () => void;
  }
}
