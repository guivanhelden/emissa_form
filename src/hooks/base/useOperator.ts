import React from 'react';
import { useOperator as useBaseOperator } from '../../contexts/base/OperatorContext';

export function useOperator() {
  const {
    operators,
    setOperators,
    selectedOperator,
    setSelectedOperator,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    searchTerm,
    setSearchTerm,
  } = useBaseOperator();

  const searchOperators = async (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    // Aqui você pode implementar a lógica de busca de operadoras
  };

  const loadMoreOperators = async () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Aqui você pode implementar a lógica de carregar mais operadoras
    }
  };

  const clearOperatorSelection = () => {
    setSelectedOperator(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const isOperatorSelected = () => {
    return selectedOperator !== null;
  };

  const getSelectedOperatorData = () => {
    return operators.find(op => op.id === selectedOperator);
  };

  return {
    operators,
    setOperators,
    selectedOperator,
    setSelectedOperator,
    currentPage,
    totalPages,
    searchTerm,
    searchOperators,
    loadMoreOperators,
    clearOperatorSelection,
    isOperatorSelected,
    getSelectedOperatorData,
  };
}
