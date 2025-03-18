import React, { createContext, useContext, useState } from 'react';
import { Operator } from '../../types/base';

interface OperatorContextData {
  operators: Operator[];
  setOperators: (data: Operator[]) => void;
  selectedOperator: number | null;
  setSelectedOperator: (operatorId: number | null) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (total: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

interface OperatorProviderProps {
  children: React.ReactNode;
}

const OperatorContext = createContext<OperatorContextData | undefined>(undefined);

export function OperatorProvider({ children }: OperatorProviderProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <OperatorContext.Provider
      value={{
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
      }}
    >
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (!context) {
    throw new Error('useOperator must be used within an OperatorProvider');
  }
  return context;
}
