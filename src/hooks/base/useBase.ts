import { useContext, useMemo } from 'react';
import { BaseContext } from '../../contexts/base/BaseContext';
import { Operator, FormType, StepType, BrokerData, Supervisor, BaseContextData } from '../../types/base';

const ITEMS_PER_PAGE = 10;

export interface UseBaseReturn extends Omit<BaseContextData, 'operators'> {
  operators: Operator[];
  paginatedOperators: Operator[];
  handleSearch: (term: string) => void;
  getOperatorById: (id: number) => Operator | undefined;
  updateTotalPages: (filteredCount: number) => void;
}

export function useBase(): UseBaseReturn {
  const context = useContext(BaseContext);

  if (!context) {
    throw new Error('useBase must be used within a BaseProvider');
  }

  const paginatedOperators = useMemo(() => {
    const filteredOperators = context.operators.filter(operator =>
      operator.nome.toLowerCase().includes(context.searchTerm.toLowerCase())
    );

    const start = (context.currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return filteredOperators.slice(start, end);
  }, [context.operators, context.currentPage, context.searchTerm]);

  const updateTotalPages = (filteredCount: number) => {
    const total = Math.ceil(filteredCount / ITEMS_PER_PAGE);
    context.setTotalPages(total);
  };

  const handleSearch = (term: string) => {
    context.setSearchTerm(term);
    context.setCurrentPage(1);

    const filteredCount = context.operators.filter(operator =>
      operator.nome.toLowerCase().includes(term.toLowerCase())
    ).length;

    updateTotalPages(filteredCount);
  };

  const getOperatorById = (id: number): Operator | undefined => {
    return context.operators.find(op => op.id === id);
  };

  return {
    ...context,
    paginatedOperators,
    handleSearch,
    getOperatorById,
    updateTotalPages
  };
}
