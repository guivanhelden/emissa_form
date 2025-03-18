import { useIndividualForm as useIndividualFormContext } from '../../contexts/individual/IndividualFormContext';

export function useIndividualForm() {
  const context = useIndividualFormContext();

  if (!context) {
    throw new Error('useIndividualForm must be used within an IndividualFormProvider');
  }

  return {
    ...context,
    // Funções auxiliares específicas do hook podem ser adicionadas aqui
    isFirstStep: context.step === 'broker',
    isLastStep: context.step === 'review',
    canGoBack: context.step !== 'broker',
    canGoForward: context.step !== 'review'
  };
}
