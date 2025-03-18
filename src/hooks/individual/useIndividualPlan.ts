import { useIndividualPlan as useIndividualPlanContext } from '../../contexts/individual/IndividualPlanContext';
import { useBase } from '../base/useBase';
import { Operator } from '../../types/base';
import { IndividualPlanData } from '../../types/individual';

export function useIndividualPlan() {
  const context = useIndividualPlanContext();
  const { operators } = useBase();

  if (!context) {
    throw new Error('useIndividualPlan must be used within an IndividualPlanProvider');
  }

  const selectOperator = (operator: Operator) => {
    context.setPlanData(prev => ({
      ...prev,
      operator
    }));
  };

  const updatePlanData = (field: keyof IndividualPlanData, value: any) => {
    context.setPlanData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateMonthlyPrice = () => {
    // Lógica para calcular o preço mensal do plano
    // Pode incluir fatores como idade do titular, número de dependentes, etc.
    return context.planData.price;
  };

  const getSelectedOperatorProducts = () => {
    if (!context || !context.planData) return [];
    if (!context.planData.operator) return [];
    
    const operatorId = typeof context.planData.operator === 'number' 
      ? context.planData.operator 
      : context.planData.operator?.id;

    if (!operators) return [];
    
    const operator = operators.find(op => op?.id === operatorId);
    return operator && 'products' in operator ? operator.products : [];
  };

  return {
    ...context,
    selectOperator,
    updatePlanData,
    calculateMonthlyPrice,
    getSelectedOperatorProducts,
    hasSelectedOperator: !!(context && context.planData && context.planData.operator),
    monthlyPrice: calculateMonthlyPrice()
  };
}
