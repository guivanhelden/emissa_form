import { usePMEHolders as useBasePMEHolders } from '../../contexts/pme/PMEHoldersContext';
import { Holder } from '../../types/pme';

export function usePMEHolders() {
  const {
    holders,
    setHolders,
    addHolder,
    removeHolder,
    updateHolder,
    addDependent,
    removeDependent,
    updateDependent,
    clearHolders,
    isHoldersDataValid,
    getTotalBeneficiaries,
  } = useBasePMEHolders();

  const formatCPF = (cpf: string): string => {
    return cpf
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatTelefone = (telefone: string): string => {
    return telefone
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const formatDate = (date: string): string => {
    return date
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substring(0, 10);
  };

  const handleHolderFieldChange = (index: number, field: keyof Holder, value: string) => {
    const holder = holders[index];
    let formattedValue = value;

    switch (field) {
      case 'cpf':
        formattedValue = formatCPF(value);
        break;
      case 'phone':
        formattedValue = formatTelefone(value);
        break;
      case 'birthDate':
        formattedValue = formatDate(value);
        break;
    }

    updateHolder(index, { ...holder, [field]: formattedValue });
  };

  const handleDependentFieldChange = (
    holderIndex: number,
    dependentIndex: number,
    field: keyof Holder['dependents'][0],
    value: string
  ) => {
    const dependent = holders[holderIndex].dependents[dependentIndex];
    let formattedValue = value;

    switch (field) {
      case 'cpf':
        formattedValue = formatCPF(value);
        break;
      case 'birthDate':
        formattedValue = formatDate(value);
        break;
    }

    updateDependent(holderIndex, dependentIndex, { ...dependent, [field]: formattedValue });
  };

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11) return false;

    // Elimina CPFs inválidos conhecidos
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (parseInt(cpf.charAt(9)) !== digito) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (parseInt(cpf.charAt(10)) !== digito) return false;

    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateTelefone = (telefone: string): boolean => {
    const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    return telefoneRegex.test(telefone);
  };

  const validateDate = (date: string): boolean => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(date)) return false;

    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);

    return (
      dateObj.getDate() === day &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getFullYear() === year &&
      dateObj <= new Date()
    );
  };

  return {
    holders,
    setHolders,
    addHolder,
    removeHolder,
    updateHolder,
    addDependent,
    removeDependent,
    updateDependent,
    clearHolders,
    isHoldersDataValid,
    getTotalBeneficiaries,
    handleHolderFieldChange,
    handleDependentFieldChange,
    validateCPF,
    validateEmail,
    validateTelefone,
    validateDate,
  };
}
