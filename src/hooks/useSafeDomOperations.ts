import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para garantir operações seguras no DOM, evitando erros como "removeChild"
 */
export function useSafeDomOperations() {
  const nodeRefs = useRef<Map<string, Node>>(new Map());

  /**
   * Remove um nó do DOM de forma segura, verificando se ele existe e se é filho do pai especificado
   */
  const safeRemoveChild = useCallback((parent: Node | null, child: Node | null, id?: string): boolean => {
    if (!parent || !child) return false;
    
    try {
      // Verifica se o nó filho realmente pertence ao pai antes de tentar removê-lo
      if (parent.contains(child)) {
        parent.removeChild(child);
        
        // Se um ID foi fornecido, remove a referência do Map
        if (id && nodeRefs.current.has(id)) {
          nodeRefs.current.delete(id);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Erro ao remover nó do DOM:', error);
      return false;
    }
  }, []);

  /**
   * Registra um nó no Map de referências para uso posterior
   */
  const registerNode = useCallback((id: string, node: Node) => {
    nodeRefs.current.set(id, node);
  }, []);

  /**
   * Recupera um nó registrado pelo ID
   */
  const getNode = useCallback((id: string): Node | undefined => {
    return nodeRefs.current.get(id);
  }, []);

  /**
   * Limpa todas as referências de nós ao desmontar o componente
   */
  useEffect(() => {
    return () => {
      nodeRefs.current.clear();
    };
  }, []);

  return {
    safeRemoveChild,
    registerNode,
    getNode
  };
}
