import React, { createContext, useContext, useState } from 'react';
import { Holder } from '../../types/pme';

interface PMEHoldersContextData {
  holders: Holder[];
  setHolders: (holders: Holder[]) => void;
  addHolder: (holder: Omit<Holder, 'dependents'>) => void;
  removeHolder: (index: number) => void;
  updateHolder: (index: number, holder: Holder) => void;
  addDependent: (holderIndex: number, dependent: Holder['dependents'][0]) => void;
  removeDependent: (holderIndex: number, dependentIndex: number) => void;
  updateDependent: (
    holderIndex: number,
    dependentIndex: number,
    dependent: Holder['dependents'][0]
  ) => void;
  clearHolders: () => void;
  isHoldersDataValid: () => boolean;
  getTotalBeneficiaries: () => number;
}

interface PMEHoldersProviderProps {
  children: React.ReactNode;
}

const PMEHoldersContext = createContext<PMEHoldersContextData | undefined>(undefined);

export function PMEHoldersProvider({ children }: PMEHoldersProviderProps) {
  const [holders, setHolders] = useState<Holder[]>([]);

  const addHolder = (holder: Omit<Holder, 'dependents'>) => {
    setHolders(prev => [...prev, { ...holder, dependents: [] }]);
  };

  const removeHolder = (index: number) => {
    setHolders(prev => prev.filter((_, i) => i !== index));
  };

  const updateHolder = (index: number, holder: Holder) => {
    setHolders(prev => prev.map((h, i) => (i === index ? holder : h)));
  };

  const addDependent = (holderIndex: number, dependent: Holder['dependents'][0]) => {
    setHolders(prev =>
      prev.map((holder, index) => {
        if (index === holderIndex) {
          return {
            ...holder,
            dependents: [...holder.dependents, dependent],
          };
        }
        return holder;
      })
    );
  };

  const removeDependent = (holderIndex: number, dependentIndex: number) => {
    setHolders(prev =>
      prev.map((holder, index) => {
        if (index === holderIndex) {
          return {
            ...holder,
            dependents: holder.dependents.filter((_, i) => i !== dependentIndex),
          };
        }
        return holder;
      })
    );
  };

  const updateDependent = (
    holderIndex: number,
    dependentIndex: number,
    dependent: Holder['dependents'][0]
  ) => {
    setHolders(prev =>
      prev.map((holder, index) => {
        if (index === holderIndex) {
          return {
            ...holder,
            dependents: holder.dependents.map((dep, i) =>
              i === dependentIndex ? dependent : dep
            ),
          };
        }
        return holder;
      })
    );
  };

  const clearHolders = () => {
    setHolders([]);
  };

  const isHoldersDataValid = (): boolean => {
    if (holders.length === 0) return false;

    return holders.every(holder => {
      const isHolderValid =
        holder.name &&
        holder.cpf &&
        holder.birthDate &&
        holder.email &&
        holder.phone;

      const areDependentsValid = holder.dependents.every(
        dependent =>
          dependent.name &&
          dependent.cpf &&
          dependent.birthDate &&
          dependent.relationship
      );

      return isHolderValid && areDependentsValid;
    });
  };

  const getTotalBeneficiaries = (): number => {
    return holders.reduce(
      (total, holder) => total + 1 + holder.dependents.length,
      0
    );
  };

  return (
    <PMEHoldersContext.Provider
      value={{
        holders,
        setHolders,
        addHolder,
        removeHolder,
        updateHolder,
        addDependent,
        removeDependent,
        updateDependent,
        clearHolders,
        isHoldersDataValid,
        getTotalBeneficiaries,
      }}
    >
      {children}
    </PMEHoldersContext.Provider>
  );
}

export function usePMEHolders() {
  const context = useContext(PMEHoldersContext);
  if (!context) {
    throw new Error('usePMEHolders must be used within a PMEHoldersProvider');
  }
  return context;
}
