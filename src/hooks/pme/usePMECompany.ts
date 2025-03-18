import { usePMECompany as useBasePMECompany } from '../../contexts/pme/PMECompanyContext';

export function usePMECompany() {
  const {
    companyData,
    setCompanyData,
    updateCompanyField,
    updateResponsavelField,
    addSocio,
    removeSocio,
    updateSocio,
    clearCompanyData,
    isCompanyDataValid,
  } = useBasePMECompany();

  const formatCNPJ = (cnpj: string): string => {
    return cnpj
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatTelefone = (telefone: string): string => {
    return telefone
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const handleCNPJChange = (cnpj: string) => {
    const formattedCNPJ = formatCNPJ(cnpj);
    updateCompanyField('cnpj', formattedCNPJ);
  };

  const handleTelefoneChange = (telefone: string) => {
    const formattedTelefone = formatTelefone(telefone);
    updateResponsavelField('telefone', formattedTelefone);
  };

  const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) return false;

    // Elimina CNPJs inválidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    let peso = 5;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpj.charAt(i)) * peso--;
      if (peso < 2) peso = 9;
    }
    let digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (parseInt(cnpj.charAt(12)) !== digito) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    peso = 6;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpj.charAt(i)) * peso--;
      if (peso < 2) peso = 9;
    }
    digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (parseInt(cnpj.charAt(13)) !== digito) return false;

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

  return {
    companyData,
    setCompanyData,
    updateCompanyField,
    updateResponsavelField,
    addSocio,
    removeSocio,
    updateSocio,
    clearCompanyData,
    isCompanyDataValid,
    handleCNPJChange,
    handleTelefoneChange,
    validateCNPJ,
    validateEmail,
    validateTelefone,
  };
}
