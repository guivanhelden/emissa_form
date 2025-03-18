import React, { createContext, useContext, useState } from 'react';
import { IndividualFormProvider } from './IndividualFormContext';
import { IndividualPlanProvider } from './IndividualPlanContext';
import { IndividualHolderProvider } from './IndividualHolderContext';
import { IndividualDependentsProvider, Dependent } from './IndividualDependentsContext';
import { WebhookService } from '../../services/webhook/webhookService';
import { useBase } from '../../hooks/base/useBase';
import { useDocument } from '../../contexts/base/DocumentContext'; 
import { useIndividualForm } from '../../hooks/individual/useIndividualForm';
import { useIndividualPlan } from '../../hooks/individual/useIndividualPlan';
import { useIndividualDependents } from '../../hooks/individual/useIndividualDependents';
import { useIndividualHolder } from '../../hooks/individual/useIndividualHolder';
import { GracePeriodData, StepType } from '../../types/base';
import { Gender, MaritalStatus } from '../../types/individual';

interface IndividualContextData {
  step: StepType;
  planData: ReturnType<typeof useIndividualPlan>['planData'];
  setPlanData: React.Dispatch<React.SetStateAction<ReturnType<typeof useIndividualPlan>['planData']>>;
  holderData: ReturnType<typeof useIndividualHolder>['holderData'];
  dependents: ReturnType<typeof useIndividualDependents>['dependents'];
  setDependents: React.Dispatch<React.SetStateAction<Dependent[]>>;
  gracePeriodData: GracePeriodData;
  setGracePeriodData: React.Dispatch<React.SetStateAction<GracePeriodData>>;
  handleBack: () => void;
  handleBrokerSubmit: () => void;
  handlePlanSubmit: () => void;
  handleHolderSubmit: () => Promise<boolean>;
  handleDependentsSubmit: () => void;
  handleGraceSubmit: () => void;
  handleDocumentsSubmit: () => void;
  handleReviewSubmit: (e: React.FormEvent, observacoes?: string) => void;
  handleEditStep: (step: number) => void;
  resetAllData: () => void;
}

const IndividualContext = createContext<IndividualContextData>({} as IndividualContextData);

// Componente interno que utiliza o contexto do titular
function InnerIndividualProvider({
  children,
  form,
  plan,
  dependents,
  base,
  gracePeriodData,
  setGracePeriodData
}: {
  children: React.ReactNode;
  form: ReturnType<typeof useIndividualForm>;
  plan: ReturnType<typeof useIndividualPlan>;
  dependents: ReturnType<typeof useIndividualDependents>;
  base: ReturnType<typeof useBase>;
  gracePeriodData: GracePeriodData;
  setGracePeriodData: React.Dispatch<React.SetStateAction<GracePeriodData>>;
}) {
  const { holderData, getSelectedEmail, getSelectedPhone, getSelectedAddress, contactData, setHolderData } = useIndividualHolder();
  const { uploadedFiles } = useDocument(); 

  const handleBrokerSubmit = () => {
    form.handleNext();
  };

  const handlePlanSubmit = () => {
    plan.handlePlanSubmit();
    form.handleNext();
  };

  const handleHolderSubmit = async () => {
    form.handleNext();
    return true;
  };

  const handleDependentsSubmit = () => {
    dependents.handleDependentsSubmit();
    form.setStep('grace');
  };

  const handleGraceSubmit = () => {
    form.handleNext();
  };

  const handleDocumentsSubmit = () => {
    form.handleNext();
  };

  const validatePlanData = (data: any) => {
    const requiredFields = ['operator', 'nomePlano', 'vigencia', 'type', 'modality', 'accommodation'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios do plano não preenchidos: ${missingFields.join(', ')}`);
    }
  };

  const resetAllData = () => {
    // Resetar dados do plano
    plan.setPlanData({
      operator: 0,
      operatorName: '',
      productCode: '',
      productName: '',
      price: 0,
      planName: '',
      coparticipation: false,
      value: 0,
      administrator: '',
      association: '',
      type: '',
      modality: '',
      accommodation: '',
      validity: '',
      coverage: '',
      network: '',
      region: ''
    });
    
    // Resetar dados do titular
    setHolderData({
      name: '',
      cpf: '',
      rg: '',
      birthDate: '',
      motherName: '',
      email: '',
      phone: '',
      phones: [],
      emails: [],
      addresses: [],
      additionalPhones: [],
      additionalEmails: []
    });
    
    // Resetar dependentes
    dependents.setDependents([]);
    
    // Resetar dados de carência
    setGracePeriodData({
      hasGracePeriod: false,
      previousOperator: 0
    });
    
    // Limpar documentos
    // Esta parte depende de como os documentos são gerenciados no contexto
  };

  const handleReviewSubmit = async (e: React.FormEvent, observacoes?: string) => {
    e.preventDefault();
    
    try {
      // Preparar os dados do titular para envio
      const holderFormattedData = {
        ...holderData,
        email: getSelectedEmail()?.address || '',
        phone: getSelectedPhone()?.formattedNumber || '',
        address: getSelectedAddress(),
        additionalPhones: holderData.phones
          .filter(phone => !phone.selected)
          .map(phone => phone.formattedNumber),
        additionalEmails: holderData.emails
          .filter(email => !email.selected)
          .map(email => email.address)
      };

      const formData = {
        formType: 'individual',
        holderData: holderFormattedData,
        planData: plan.planData,
        dependents: dependents.dependents,
        gracePeriodData,
        brokerData: base.brokerData,
        uploadedFiles // Usar os documentos do contexto que foi obtido no nível do componente
      };

      console.log('=== Enviando Formulário ===');
      console.log('1. Dados do formulário preparados');
      console.log('2. Documentos incluídos:', uploadedFiles);

      await WebhookService.submit(formData, base.operators, [], observacoes);
      
      // Limpar todos os dados após envio bem-sucedido
      resetAllData();
      
      // Limpar localStorage para garantir que não haja dados persistidos
      localStorage.removeItem('individualFormData');
      localStorage.removeItem('individualPlanData');
      localStorage.removeItem('individualHolderData');
      localStorage.removeItem('individualDependentsData');
      localStorage.removeItem('individualGracePeriodData');
      
      alert('Formulário enviado com sucesso!');
      form.setStep('broker');
    } catch (error) {
      console.error('Erro detalhado:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar formulário');
    }
  };

  const handleEditStep = (step: number) => {
    const steps = ['broker', 'plan', 'holder', 'dependents', 'grace', 'documents', 'review'];
    if (step >= 0 && step < steps.length) {
      form.setStep(steps[step] as StepType);
    }
  };

  const value = {
    step: form.step,
    planData: plan.planData,
    setPlanData: plan.setPlanData,
    holderData,
    dependents: dependents.dependents,
    setDependents: dependents.setDependents,
    gracePeriodData,
    setGracePeriodData,
    handleBack: form.handleBack,
    handleBrokerSubmit,
    handlePlanSubmit,
    handleHolderSubmit,
    handleDependentsSubmit,
    handleGraceSubmit,
    handleDocumentsSubmit,
    handleReviewSubmit,
    handleEditStep,
    resetAllData
  };

  return (
    <IndividualContext.Provider value={value}>
      {children}
    </IndividualContext.Provider>
  );
}

export function IndividualProvider({ children }: { children: React.ReactNode }) {
  return (
    <IndividualFormProvider>
      <IndividualPlanProvider>
        <IndividualHolderProvider>
          <IndividualDependentsProvider>
            <InnerIndividualProviderWrapper>
              {children}
            </InnerIndividualProviderWrapper>
          </IndividualDependentsProvider>
        </IndividualHolderProvider>
      </IndividualPlanProvider>
    </IndividualFormProvider>
  );
}

// Componente wrapper para evitar a dependência circular
function InnerIndividualProviderWrapper({ children }: { children: React.ReactNode }) {
  const form = useIndividualForm();
  const plan = useIndividualPlan();
  const dependents = useIndividualDependents();
  const base = useBase();
  
  const [gracePeriodData, setGracePeriodData] = useState<GracePeriodData>({
    hasGracePeriod: false,
    previousOperator: 0
  });

  return (
    <InnerIndividualProvider
      form={form}
      plan={plan}
      dependents={dependents}
      base={base}
      gracePeriodData={gracePeriodData}
      setGracePeriodData={setGracePeriodData}
    >
      {children}
    </InnerIndividualProvider>
  );
}

export const useIndividual = () => useContext(IndividualContext);
