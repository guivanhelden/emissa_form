import React, { createContext, useContext, useState } from 'react';
import { BrokerData } from '../../types/base';

interface BrokerContextData {
  brokerData: BrokerData;
  setBrokerData: React.Dispatch<React.SetStateAction<BrokerData>>;
}

const BrokerContext = createContext<BrokerContextData>({} as BrokerContextData);

export function BrokerProvider({ children }: { children: React.ReactNode }) {
  const [brokerData, setBrokerData] = useState<BrokerData>({
    id: null,
    document: '',
    name: '',
    email: '',
    whatsapp: '',
    equipe_nome: ''
  });

  return (
    <BrokerContext.Provider
      value={{
        brokerData,
        setBrokerData,
      }}
    >
      {children}
    </BrokerContext.Provider>
  );
}

export function useBroker() {
  const context = useContext(BrokerContext);

  if (!context) {
    throw new Error('useBroker must be used within a BrokerProvider');
  }

  const clearBrokerData = () => {
    context.setBrokerData({
      id: null,
      document: '',
      name: '',
      email: '',
      whatsapp: '',
      equipe_nome: ''
    });
  };

  const updateBrokerField = (field: keyof BrokerData, value: string) => {
    context.setBrokerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    ...context,
    clearBrokerData,
    updateBrokerField
  };
}
