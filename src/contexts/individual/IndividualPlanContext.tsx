import React, { createContext, useContext, useState } from 'react';
import { IndividualPlanData } from '../../types/individual';

interface IndividualPlanContextData {
  planData: IndividualPlanData;
  setPlanData: React.Dispatch<React.SetStateAction<IndividualPlanData>>;
  handlePlanSubmit: () => void;
}

const IndividualPlanContext = createContext<IndividualPlanContextData>({} as IndividualPlanContextData);

export function IndividualPlanProvider({ children }: { children: React.ReactNode }) {
  const [planData, setPlanData] = useState<IndividualPlanData>({
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

  const handlePlanSubmit = () => {
    // Validação dos campos obrigatórios do plano
    if (!planData.type || 
        !planData.modality || 
        !planData.operator || 
        !planData.accommodation ||
        (planData.type === 'adhesion' && (!planData.administrator || !planData.association))) {
      throw new Error('Por favor, preencha todos os campos obrigatórios');
    }
  };

  return (
    <IndividualPlanContext.Provider
      value={{
        planData,
        setPlanData,
        handlePlanSubmit
      }}
    >
      {children}
    </IndividualPlanContext.Provider>
  );
}

export function useIndividualPlan() {
  const context = useContext(IndividualPlanContext);

  if (!context) {
    throw new Error('useIndividualPlan must be used within an IndividualPlanProvider');
  }

  return context;
}
