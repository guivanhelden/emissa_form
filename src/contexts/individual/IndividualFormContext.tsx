import React, { createContext, useContext, useState, useEffect } from 'react';
import { StepType } from '../../types/base';
import { useBase } from '../../hooks/base';

interface IndividualFormContextData {
  step: StepType;
  setStep: React.Dispatch<React.SetStateAction<StepType>>;
  handleBack: () => void;
  handleNext: () => void;
}

const IndividualFormContext = createContext<IndividualFormContextData>({} as IndividualFormContextData);

export function IndividualFormProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<StepType>('broker');
  const { setStep: setBaseStep } = useBase();

  const steps: StepType[] = [
    'broker',
    'plan',
    'holder',
    'dependents',
    'grace',
    'documents',
    'review'
  ];

  // Sincronizar o step com o BaseContext
  useEffect(() => {
    setBaseStep(step);
  }, [step, setBaseStep]);

  const handleBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setStep(nextStep);
    }
  };

  return (
    <IndividualFormContext.Provider
      value={{
        step,
        setStep,
        handleBack,
        handleNext
      }}
    >
      {children}
    </IndividualFormContext.Provider>
  );
}

export function useIndividualForm() {
  const context = useContext(IndividualFormContext);

  if (!context) {
    throw new Error('useIndividualForm must be used within an IndividualFormProvider');
  }

  return context;
}
