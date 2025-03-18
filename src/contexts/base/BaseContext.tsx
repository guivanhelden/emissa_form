import React, { createContext, useState, useEffect } from 'react';
import { BaseContextData, BaseContextProps, FormType, StepType, BrokerData, Operator } from '../../types/base';

export const BaseContext = createContext<BaseContextData | undefined>(undefined);

export function BaseProvider({ children }: BaseContextProps) {
  const [formType, setFormType] = useState<FormType | null>(null);
  const [step, setStep] = useState<StepType>('initial');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [brokerData, setBrokerData] = useState<BrokerData>({
    document: '',
    name: '',
    email: '',
    whatsapp: '',
    equipe_nome: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (formType === 'pme') {
      setStep('broker');
    } else if (formType === 'individual') {
      setStep('broker');
    } else {
      setStep('initial');
    }
  }, [formType]);

  const submitForm = async (type: FormType, observacoes?: string) => {
    console.log('Submitting form:', { type, observacoes });
  };

  return (
    <BaseContext.Provider
      value={{
        formType,
        setFormType,
        step,
        setStep,
        operators,
        setOperators,
        brokerData,
        setBrokerData,
        currentPage,
        setCurrentPage,
        totalPages,
        setTotalPages,
        searchTerm,
        setSearchTerm,
        submitForm,
      }}
    >
      {children}
    </BaseContext.Provider>
  );
}
