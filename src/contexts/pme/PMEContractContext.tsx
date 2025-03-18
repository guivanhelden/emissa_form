import React, { createContext, useContext, useState } from 'react';
import { ContractData } from '../../types/pme';

interface PMEContractContextData {
  contractData: ContractData;
  setContractData: (data: ContractData) => void;
  updateContractField: <K extends keyof ContractData>(field: K, value: ContractData[K]) => void;
  clearContractData: () => void;
  isContractDataValid: () => boolean;
  calculateTotalValue: (baseValue: number, numberOfBeneficiaries: number) => number;
  handleValueChange: (value: string) => void;
  formatValue: (value: number) => string;
  getContractSummary: () => { type: string; coparticipation: string; value: string; discount: string; validityDate: string };
}

interface PMEContractProviderProps {
  children: React.ReactNode;
}

const PMEContractContext = createContext<PMEContractContextData | undefined>(undefined);

export function PMEContractProvider({ children }: PMEContractProviderProps) {
  const [contractData, setContractData] = useState<ContractData>({
    type: '',
    coparticipation: '',
    value: 0,
    validityDate: '',
  });

  const updateContractField = <K extends keyof ContractData>(field: K, value: ContractData[K]) => {
    setContractData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearContractData = () => {
    setContractData({
      type: '',
      coparticipation: '',
      value: 0,
      validityDate: '',
    });
  };

  const isContractDataValid = (): boolean => {
    const { type, coparticipation, value, validityDate } = contractData;
    return Boolean(type && coparticipation && value > 0 && validityDate);
  };

  const calculateTotalValue = (baseValue: number, numberOfBeneficiaries: number): number => {
    let totalValue = baseValue * numberOfBeneficiaries;

    // Aplicar descontos baseados no tipo de contrato
    if (contractData.type === 'compulsory') {
      totalValue *= 0.9; // 10% de desconto para contratos compulsórios
    }

    // Ajustar valor baseado na coparticipação
    switch (contractData.coparticipation) {
      case 'partial':
        totalValue *= 0.85; // 15% de desconto para coparticipação parcial
        break;
      case 'full':
        totalValue *= 0.7; // 30% de desconto para coparticipação total
        break;
      default:
        break;
    }

    return Number(totalValue.toFixed(2));
  };

  const handleValueChange = (value: string) => {
    const numericValue = Number(value.replace(/\D/g, '')) / 100;
    updateContractField('value', numericValue);
  };

  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getContractSummary = () => {
    // Mapear os valores para textos mais amigáveis
    const typeMap: Record<string, string> = {
      'compulsory': 'Compulsório',
      'optional': 'Opcional'
    };
    
    const coparticipationMap: Record<string, string> = {
      'none': 'Sem Coparticipação',
      'partial': 'Coparticipação Parcial',
      'full': 'Coparticipação Total'
    };
    
    // Calcular o desconto baseado no tipo e coparticipação
    let discountPercentage = 0;
    
    if (contractData.type === 'compulsory') {
      discountPercentage += 10; // 10% de desconto para contratos compulsórios
    }
    
    switch (contractData.coparticipation) {
      case 'partial':
        discountPercentage += 15; // 15% de desconto para coparticipação parcial
        break;
      case 'full':
        discountPercentage += 30; // 30% de desconto para coparticipação total
        break;
      default:
        break;
    }
    
    return {
      type: typeMap[contractData.type] || contractData.type,
      coparticipation: coparticipationMap[contractData.coparticipation] || contractData.coparticipation,
      value: formatValue(contractData.value),
      discount: `${discountPercentage}%`,
      validityDate: contractData.validityDate || '-'
    };
  };

  return (
    <PMEContractContext.Provider
      value={{
        contractData,
        setContractData,
        updateContractField,
        clearContractData,
        isContractDataValid,
        calculateTotalValue,
        handleValueChange,
        formatValue,
        getContractSummary,
      }}
    >
      {children}
    </PMEContractContext.Provider>
  );
}

export function usePMEContract() {
  const context = useContext(PMEContractContext);
  if (!context) {
    throw new Error('usePMEContract must be used within a PMEContractProvider');
  }
  return context;
}
