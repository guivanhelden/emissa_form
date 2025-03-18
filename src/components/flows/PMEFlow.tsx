import React from 'react';
import { usePMEForm } from '../../contexts/pme/PMEContext';
import PMEModalityStep from '../steps/pme/PMEModalityStep';
import PMEBrokerStep from '../steps/pme/PMEBrokerStep';
import PMEContractStep from '../steps/pme/PMEContractStep';
import PMECompanyStep from '../steps/pme/PMECompanyStep';
import PMEGracePeriodStep from '../steps/pme/PMEGracePeriodStep';
import PMEHoldersStep from '../steps/pme/PMEHoldersStep';
import PMEDocumentsStep from '../steps/pme/PMEDocumentsStep';
import PMEReviewStep from '../steps/pme/PMEReviewStep';
import { useBase } from '../../hooks/base';

interface Step {
  id: string;
  component: React.ComponentType<any>;
  title: string;
}

const steps: Step[] = [
  {
    id: 'broker',
    component: PMEBrokerStep,
    title: 'Corretor'
  },
  {
    id: 'modality',
    component: PMEModalityStep,
    title: 'Modalidade'
  },
  {
    id: 'contract',
    component: PMEContractStep,
    title: 'Contrato'
  },
  {
    id: 'company',
    component: PMECompanyStep,
    title: 'Empresa'
  },
  {
    id: 'holders',
    component: PMEHoldersStep,
    title: 'Beneficiários'
  },
  {
    id: 'grace',
    component: PMEGracePeriodStep,
    title: 'Carência'
  },
  {
    id: 'documents',
    component: PMEDocumentsStep,
    title: 'Documentos'
  },
  {
    id: 'review',
    component: PMEReviewStep,
    title: 'Revisão'
  }
];

export default function PMEFlow() {
  const { step, setStep, modality, setModality, handleNext, handleBack: handleFormBack } = usePMEForm();
  const base = useBase();
  const { setFormType } = base;

  const handleBack = () => {
    if (step === 'broker') {
      setFormType(null);
    } else {
      handleFormBack();
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const CurrentStep = steps[currentStepIndex].component;

  const getStepProps = () => {
    const baseProps = {
      onBack: handleBack,
      onSubmit: handleNext
    };

    switch (step) {
      case 'broker':
        return {
          ...baseProps,
          selectedSupervisor: base.selectedSupervisor,
          onSupervisorSelect: base.setSelectedSupervisor,
          supervisors: base.supervisors,
          brokerData: base.brokerData,
          onBrokerDataChange: base.setBrokerData
        };
      case 'modality':
        return {
          ...baseProps,
          selectedModality: modality || '',
          onModalityChange: setModality
        };
      case 'contract':
        return {
          ...baseProps
        };
      case 'company':
        return {
          ...baseProps
        };
      case 'grace':
        return {
          ...baseProps,
          operators: base.operators
        };
      case 'holders':
        return {
          ...baseProps
        };
      case 'documents':
        return {
          ...baseProps
        };
      case 'review':
        return {
          ...baseProps,
          operators: base.operators,
          selectedSupervisor: base.selectedSupervisor,
          supervisors: base.supervisors,
          brokerData: base.brokerData
        };
      default:
        return baseProps;
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-8">{steps[currentStepIndex].title}</h2>
          <CurrentStep {...getStepProps()} />
        </div>
      </div>
    </div>
  );
}
