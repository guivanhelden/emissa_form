import { useBroker as useBaseBroker } from '../../contexts/base/BrokerContext';
import { BrokerData } from '../../types/base';

export function useBroker() {
  const {
    brokerData,
    setBrokerData,
  } = useBaseBroker();

  const updateBrokerData = (field: keyof BrokerData, value: string) => {
    setBrokerData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearBrokerData = () => {
    setBrokerData({
      document: '',
      name: '',
      email: '',
      whatsapp: '',
      equipe_nome: ''
    });
  };

  const isBrokerDataValid = () => {
    return (
      brokerData.document &&
      brokerData.name &&
      brokerData.email &&
      brokerData.whatsapp &&
      brokerData.equipe_nome
    );
  };

  return {
    brokerData,
    setBrokerData,
    updateBrokerData,
    clearBrokerData,
    isBrokerDataValid,
  };
}
