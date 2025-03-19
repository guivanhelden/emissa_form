/**
 * Utilitários para formatação de valores com suporte a localização
 */

// Verifica se há uma configuração de locale forçada
export const getLocale = (): string => {
  const forcedLocale = localStorage.getItem('forceLocale');
  return forcedLocale || 'pt-BR';
};

// Formata um valor monetário com o símbolo da moeda
export const formatCurrency = (value: number): string => {
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    // Fallback seguro para qualquer locale
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
};

// Formata um número com separadores de milhares
export const formatNumber = (value: number): string => {
  try {
    return new Intl.NumberFormat(getLocale()).format(value);
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    // Fallback seguro para qualquer locale
    return value.toString();
  }
};

// Formata uma data no padrão brasileiro (dd/mm/yyyy)
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Usa toLocaleDateString com fallback para formatação manual
    try {
      return dateObj.toLocaleDateString(getLocale());
    } catch (error) {
      // Fallback manual para formato brasileiro
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return typeof date === 'string' ? date : '';
  }
};

// Formata um CPF (XXX.XXX.XXX-XX)
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  // Remove caracteres não numéricos
  const digitsOnly = cpf.replace(/\D/g, '');
  
  // Aplica a máscara
  return digitsOnly
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Formata um CNPJ (XX.XXX.XXX/XXXX-XX)
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  
  // Remove caracteres não numéricos
  const digitsOnly = cnpj.replace(/\D/g, '');
  
  // Aplica a máscara
  return digitsOnly
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// Formata um telefone ((XX) XXXXX-XXXX)
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Verifica o tamanho para determinar se é celular (11 dígitos) ou fixo (10 dígitos)
  if (digitsOnly.length === 11) {
    return digitsOnly
      .replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else {
    return digitsOnly
      .replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
};

// Formata um WhatsApp com código do país (+55 (XX) XXXXX-XXXX)
export const formatWhatsApp = (phone: string): string => {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Verifica se o número já tem o código do país
  if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
    // Formata como +55 (XX) XXXXX-XXXX
    return digitsOnly.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 ($1) $2-$3');
  } else if (digitsOnly.length === 11) {
    // Adiciona o código do país e formata
    return `+55 (${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}-${digitsOnly.substring(7)}`;
  } else if (digitsOnly.length === 10) {
    // Adiciona o código do país e formata
    return `+55 (${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 6)}-${digitsOnly.substring(6)}`;
  }
  
  // Se não se encaixar nos padrões acima, retorna formatado como telefone normal
  return formatPhone(phone);
};

// Traduz relacionamentos para português
export const translateRelationship = (relationship: string): string => {
  const translations: Record<string, string> = {
    'spouse': 'Cônjuge',
    'son': 'Filho',
    'daughter': 'Filha',
    'father': 'Pai',
    'mother': 'Mãe',
    'brother': 'Irmão',
    'sister': 'Irmã',
    'grandfather': 'Avô',
    'grandmother': 'Avó',
    'grandson': 'Neto',
    'granddaughter': 'Neta',
    'father_in_law': 'Sogro',
    'mother_in_law': 'Sogra',
    'son_in_law': 'Genro',
    'daughter_in_law': 'Nora',
    'stepson': 'Enteado',
    'stepdaughter': 'Enteada',
    'other': 'Outro'
  };
  
  return translations[relationship] || relationship;
}; 