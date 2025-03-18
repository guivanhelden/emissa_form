import { useEffect, useRef } from 'react';

/**
 * Hook para garantir limpeza segura de efeitos que manipulam o DOM
 */
export function useEffectCleanup(effect: () => (() => void) | void, deps: any[] = []) {
  const cleanupRef = useRef<(() => void) | void>();
  
  useEffect(() => {
    try {
      // Executa o efeito e armazena a função de limpeza
      cleanupRef.current = effect();
    } catch (error) {
      console.error('Erro ao executar efeito:', error);
    }
    
    // Função de limpeza que executa de forma segura
    return () => {
      try {
        if (typeof cleanupRef.current === 'function') {
          cleanupRef.current();
        }
      } catch (error) {
        console.warn('Erro durante limpeza do efeito:', error);
        // Não propaga o erro para evitar tela branca
      }
    };
  }, deps);
}
