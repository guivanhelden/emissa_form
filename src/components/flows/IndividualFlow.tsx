import React from 'react';
import { useIndividual } from '../../contexts/individual/IndividualContext';
import { useBase } from '../../hooks/base';
import { IndividualBrokerStep } from '../steps/individual/IndividualBrokerStep';
import { IndividualPlanStep } from '../steps/individual/IndividualPlanStep';
import { IndividualHolderStep } from '../steps/individual/IndividualHolderStep';
import { IndividualDependentsStep } from '../steps/individual/IndividualDependentsStep';
import { IndividualGraceStep } from '../steps/individual/IndividualGraceStep';
import { IndividualDocumentsStep } from '../steps/individual/IndividualDocumentsStep';
import { IndividualReviewStep } from '../steps/individual/IndividualReviewStep';

interface Step {
  id: string;
  component: React.ComponentType<any>;
  title: string;
}

const steps: Step[] = [
  {
    id: 'broker',
    component: IndividualBrokerStep,
    title: 'Corretor'
  },
  {
    id: 'plan',
    component: IndividualPlanStep,
    title: 'Plano'
  },
  {
    id: 'holder',
    component: IndividualHolderStep,
    title: 'Titular'
  },
  {
    id: 'dependents',
    component: IndividualDependentsStep,
    title: 'Dependentes'
  },
  {
    id: 'grace',
    component: IndividualGraceStep,
    title: 'Carência'
  },
  {
    id: 'documents',
    component: IndividualDocumentsStep,
    title: 'Documentos'
  },
  {
    id: 'review',
    component: IndividualReviewStep,
    title: 'Revisão'
  }
];

export function IndividualFlow() {
  const individual = useIndividual();
  const base = useBase();
  const { setFormType } = base;

  const handleBack = () => {
    if (individual.step === 'broker') {
      setFormType(null);
    } else {
      individual.handleBack();
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === individual.step);
  
  if (currentStepIndex === -1) {
    console.error(`Step não encontrado: ${individual.step}`);
    return null;
  }
  
  const CurrentStep = steps[currentStepIndex].component;

  const getStepProps = () => {
    const baseProps = {
      onBack: handleBack,
    };

    switch (individual.step) {
      case 'broker':
        return {
          ...baseProps,
          onSubmit: individual.handleBrokerSubmit,
          selectedSupervisor: base.selectedSupervisor,
          onSupervisorSelect: base.setSelectedSupervisor,
          supervisors: base.supervisors,
          brokerData: base.brokerData,
          onBrokerDataChange: base.setBrokerData
        };
      case 'plan':
        return {
          ...baseProps,
          onSubmit: individual.handlePlanSubmit,
          planData: individual.planData,
          onPlanDataChange: individual.setPlanData,
          operators: base.operators,
          currentPage: base.currentPage,
          totalPages: base.totalPages,
          onPageChange: base.setCurrentPage,
          searchTerm: base.searchTerm,
          onSearchChange: base.setSearchTerm
        };
      case 'holder':
        return {
          ...baseProps,
          onSubmit: individual.handleHolderSubmit, // Agora só avança para o próximo passo
          holderData: individual.holderData,
          onHolderDataChange: individual.setHolderData
        };
      case 'dependents':
        return {
          ...baseProps,
          onSubmit: individual.handleDependentsSubmit,
          dependents: individual.dependents,
          onDependentsChange: individual.setDependents
        };
      case 'grace':
        return {
          ...baseProps,
          onSubmit: individual.handleGraceSubmit,
          gracePeriodData: individual.gracePeriodData,
          onGracePeriodDataChange: individual.setGracePeriodData,
          operators: base.operators
        };
      case 'documents':
        return {
          ...baseProps,
          onSubmit: individual.handleDocumentsSubmit
        };
      case 'review':
        return {
          ...baseProps,
          onSubmit: individual.handleReviewSubmit,
          onEditStep: individual.handleEditStep,
          planData: individual.planData,
          holderData: individual.holderData,
          dependents: individual.dependents,
          addressData: individual.addressData,
          gracePeriodData: individual.gracePeriodData,
          operators: base.operators,
          selectedSupervisor: base.selectedSupervisor,
          supervisors: base.supervisors,
          brokerData: base.brokerData
        };
      default:
        return baseProps;
    }
  };

  if (individual.step === 'review' && !base.operators) {
    return <div className="text-white text-center p-8">Carregando dados...</div>;
  }
  
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
