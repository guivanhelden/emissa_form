import { usePMEForm as useBasePMEForm } from '../../contexts/pme/PMEFormContext';

export function usePMEForm() {
  const {
    modality,
    setModality,
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
  } = useBasePMEForm();

  const isStepValid = (): boolean => {
    switch (step) {
      case 'broker':
        return true; // Validado pelo BrokerContext
      case 'modality':
        return Boolean(modality && planName);
      case 'contract':
        return true; // Validado pelo ContractContext
      case 'company':
        return true; // Validado pelo CompanyContext
      case 'grace':
        return true; // Validado pelo GracePeriodContext
      case 'holders':
        return true; // Validado pelo HoldersContext
      case 'documents':
        return true; // Validado pelo DocumentContext
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const clearFormData = () => {
    setModality('');
    setPlanName('');
    setCompanyData({
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
    setContractData({
      type: 'compulsory',
      coparticipation: 'none',
      value: 0,
    });
    setGracePeriodData({
      hasGracePeriod: false,
      previousOperator: 0,
      documents: [],
    });
    setHolders([]);
    setStep('broker');
  };

  return {
    modality,
    setModality,
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
    isStepValid,
    clearFormData,
  };
}
