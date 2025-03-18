import { useIndividualDependents as useIndividualDependentsContext, Dependent } from '../../contexts/individual/IndividualDependentsContext';

export function useIndividualDependents() {
  const context = useIndividualDependentsContext();

  if (!context) {
    throw new Error('useIndividualDependents must be used within an IndividualDependentsProvider');
  }

  const addNewDependent = (dependent: Omit<Dependent, 'id'>) => {
    context.addDependent(dependent);
  };

  const updateDependentField = (id: string, field: keyof Dependent, value: string) => {
    context.updateDependent(id, { [field]: value });
  };

  const calculateDependentAge = (birthDate: string) => {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getDependentsByAgeGroup = () => {
    const groups = {
      children: [] as Dependent[],
      adults: [] as Dependent[],
      seniors: [] as Dependent[]
    };

    context.dependents.forEach(dependent => {
      const age = calculateDependentAge(dependent.birthDate);
      if (age < 18) {
        groups.children.push(dependent);
      } else if (age >= 60) {
        groups.seniors.push(dependent);
      } else {
        groups.adults.push(dependent);
      }
    });

    return groups;
  };

  const validateDependent = (dependent: Partial<Dependent>) => {
    const requiredFields: (keyof Dependent)[] = [
      'name',
      'cpf',
      'rg',
      'birthDate',
      'gender',
      'relationship',
      'maritalStatus'
    ];

    const missingFields = requiredFields.filter(field => !dependent[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`);
    }

    return true;
  };

  return {
    ...context,
    addNewDependent,
    updateDependentField,
    calculateDependentAge,
    getDependentsByAgeGroup,
    validateDependent,
    totalDependents: context.dependents.length,
    hasDependents: context.dependents.length > 0
  };
}
