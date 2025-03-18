import { usePMEContract as useBasePMEContract } from '../../contexts/pme/PMEContractContext';
import { ContractData } from '../../types/pme';

export function usePMEContract() {
  const {
    contractData,
    setContractData,
    updateContractField,
    clearContractData,
    isContractDataValid,
    calculateTotalValue,
  } = useBasePMEContract();

  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const parseValue = (value: string): number => {
    return Number(value.replace(/[^\d.,]/g, '').replace(',', '.'));
  };

  const handleValueChange = (value: string) => {
    const numericValue = parseValue(value);
    updateContractField('value', numericValue);
  };

  const getCoparticipationLabel = (coparticipation: ContractData['coparticipation']): string => {
    switch (coparticipation) {
      case 'none':
        return 'Sem coparticipação';
      case 'partial':
        return 'Coparticipação parcial';
      case 'full':
        return 'Coparticipação total';
      default:
        return '';
    }
  };

  const getTypeLabel = (type: ContractData['type']): string => {
    switch (type) {
      case 'compulsory':
        return 'Compulsório';
      case 'optional':
        return 'Opcional';
      default:
        return '';
    }
  };

  const getDiscountPercentage = (): number => {
    let discount = 0;

    // Desconto por tipo de contrato
    if (contractData.type === 'compulsory') {
      discount += 10; // 10% de desconto para contratos compulsórios
    }

    // Desconto por coparticipação
    switch (contractData.coparticipation) {
      case 'partial':
        discount += 15; // 15% de desconto para coparticipação parcial
        break;
      case 'full':
        discount += 30; // 30% de desconto para coparticipação total
        break;
      default:
        break;
    }

    return discount;
  };

  const getContractSummary = () => {
    return {
      type: getTypeLabel(contractData.type),
      coparticipation: getCoparticipationLabel(contractData.coparticipation),
      value: formatValue(contractData.value),
      discount: `${getDiscountPercentage()}%`,
    };
  };

  return {
    contractData,
    setContractData,
    updateContractField,
    clearContractData,
    isContractDataValid,
    calculateTotalValue,
    formatValue,
    parseValue,
    handleValueChange,
    getCoparticipationLabel,
    getTypeLabel,
    getDiscountPercentage,
    getContractSummary,
  };
}
