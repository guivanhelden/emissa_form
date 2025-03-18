/**
 * Utilitário para debug em produção sem afetar a experiência do usuário
 */
export const debugUtils = {
  // Ativa/desativa logs de debug
  enabled: false,
  
  // Registra mensagens de debug apenas se estiver habilitado
  log: (message: string, ...args: any[]) => {
    if (debugUtils.enabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  // Ativa o modo de debug
  enable: () => {
    debugUtils.enabled = true;
    localStorage.setItem('debug_mode', 'true');
    console.log('[DEBUG] Modo de debug ativado');
  },
  
  // Desativa o modo de debug
  disable: () => {
    debugUtils.enabled = false;
    localStorage.removeItem('debug_mode');
    console.log('[DEBUG] Modo de debug desativado');
  },
  
  // Verifica se o modo de debug está ativado no localStorage
  init: () => {
    const debugMode = localStorage.getItem('debug_mode');
    if (debugMode === 'true') {
      debugUtils.enabled = true;
    }
  }
};

// Inicializa o modo de debug
debugUtils.init();

// Expõe a função de debug no objeto window para acesso via console
if (typeof window !== 'undefined') {
  (window as any).__debugApp = {
    enable: debugUtils.enable,
    disable: debugUtils.disable
  };
}
