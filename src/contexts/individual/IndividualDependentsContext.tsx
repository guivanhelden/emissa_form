import React, { createContext, useContext, useState } from 'react';

export interface Dependent {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  relationship: string;
  rg?: string;
  gender?: 'M' | 'F';
  maritalStatus?: string;
}

interface IndividualDependentsContextData {
  dependents: Dependent[];
  setDependents: React.Dispatch<React.SetStateAction<Dependent[]>>;
  addDependent: (dependent: Omit<Dependent, 'id'>) => void;
  removeDependent: (id: string) => void;
  updateDependent: (id: string, data: Partial<Dependent>) => void;
  handleDependentsSubmit: () => void;
}

const IndividualDependentsContext = createContext<IndividualDependentsContextData>({} as IndividualDependentsContextData);

export function IndividualDependentsProvider({ children }: { children: React.ReactNode }) {
  const [dependents, setDependents] = useState<Dependent[]>([]);

  const addDependent = (dependent: Omit<Dependent, 'id'>) => {
    const newDependent = {
      ...dependent,
      id: crypto.randomUUID()
    };
    setDependents(prev => [...prev, newDependent]);
  };

  const removeDependent = (id: string) => {
    setDependents(prev => prev.filter(dep => dep.id !== id));
  };

  const updateDependent = (id: string, data: Partial<Dependent>) => {
    setDependents(prev =>
      prev.map(dep => (dep.id === id ? { ...dep, ...data } : dep))
    );
  };

  const handleDependentsSubmit = () => {
    // Validação dos dependentes
    const requiredFields = [
      'name',
      'cpf',
      'birthDate',
      'relationship'
    ];

    const invalidDependents = dependents.filter(dependent => {
      const missingFields = requiredFields.filter(field => !dependent[field as keyof Dependent]);
      if (missingFields.length > 0) {
        console.log('Campos faltando para dependente:', dependent.name || 'Sem nome', missingFields);
        return true;
      }
      return false;
    });

    if (invalidDependents.length > 0) {
      throw new Error('Por favor, preencha todos os campos obrigatórios dos dependentes (Nome, CPF, Data de Nascimento e Parentesco)');
    }
  };

  return (
    <IndividualDependentsContext.Provider
      value={{
        dependents,
        setDependents,
        addDependent,
        removeDependent,
        updateDependent,
        handleDependentsSubmit
      }}
    >
      {children}
    </IndividualDependentsContext.Provider>
  );
}

export function useIndividualDependents() {
  const context = useContext(IndividualDependentsContext);

  if (!context) {
    throw new Error('useIndividualDependents must be used within an IndividualDependentsProvider');
  }

  return context;
}
