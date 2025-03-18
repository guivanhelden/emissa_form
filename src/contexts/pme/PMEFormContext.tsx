import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanyData, ContractData, GracePeriodData, Holder } from '../../types/pme';
import { StepType, Operator } from '../../types/base';
import { useBase } from '../../hooks/base';

interface PMEFormContextData {
  modality: string | null;
  setModality: (modality: string) => void;
  operator: number | null;
  setOperator: (operator: number) => void;
  operatorName: string;
  setOperatorName: (name: string) => void;
  planName: string;
  setPlanName: (name: string) => void;
  companyData: CompanyData;
  setCompanyData: (data: CompanyData) => void;
  contractData: ContractData;
  setContractData: (data: ContractData) => void;
  gracePeriodData: GracePeriodData;
  setGracePeriodData: (data: GracePeriodData) => void;
  holders: Holder[];
  setHolders: (holders: Holder[]) => void;
  step: StepType;
  setStep: (step: StepType) => void;
  handleBack: () => void;
  handleNext: () => void;
}

interface PMEFormProviderProps {
  children: React.ReactNode;
}

const PMEFormContext = createContext<PMEFormContextData | undefined>(undefined);

export function PMEFormProvider({ children }: PMEFormProviderProps) {
  const baseContext = useBase();
  const [modality, setModality] = useState<string | null>(null);
  const [operator, setOperator] = useState<number | null>(null);
  const [operatorName, setOperatorName] = useState('');
  const [planName, setPlanName] = useState('');
  const [companyData, setCompanyData] = useState<CompanyData>({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    dataAbertura: '',
    naturezaJuridica: '',
    cnae: '',
    cidade: '',
    responsavel: {
      nome: '',
      email: '',
      telefone: '',
    },
    socios: [],
  });
  const [contractData, setContractData] = useState<ContractData>({
    type: 'compulsory',
    coparticipation: 'none',
    value: 0,
  });
  const [gracePeriodData, setGracePeriodData] = useState<GracePeriodData>({
    hasGracePeriod: false,
    previousOperator: 0,
    documents: [],
  });
  const [holders, setHolders] = useState<Holder[]>([]);
  const [step, setInternalStep] = useState<StepType>('broker');

  // Sincroniza o passo com o contexto base
  useEffect(() => {
    baseContext.setStep(step);
  }, [step, baseContext]);

  // Função para atualizar o passo interno e o passo no contexto base
  const setStep = (newStep: StepType) => {
    setInternalStep(newStep);
    baseContext.setStep(newStep);
  };

  const steps: StepType[] = [
    'broker',
    'modality',
    'contract',
    'company',
    'holders',
    'grace',
    'documents',
    'review'
  ];

  const handleBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  return (
    <PMEFormContext.Provider
      value={{
        modality,
        setModality,
        operator,
        setOperator,
        operatorName,
        setOperatorName,
        planName,
        setPlanName,
        companyData,
        setCompanyData,
        contractData,
        setContractData,
        gracePeriodData,
        setGracePeriodData,
        holders,
        setHolders,
        step,
        setStep,
        handleBack,
        handleNext,
      }}
    >
      {children}
    </PMEFormContext.Provider>
  );
}

export function usePMEForm() {
  const context = useContext(PMEFormContext);
  if (context === undefined) {
    throw new Error('usePMEForm must be used within a PMEFormProvider');
  }
  return context;
}
