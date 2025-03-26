import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  IndividualHolderData, 
  Gender, 
  MaritalStatus, 
  ContactData,
  DatastonePhone,
  DatastoneEmail,
  DatastoneAddress
} from '../../types/individual';

// Constantes
const MAX_ADDITIONAL_CONTACTS = 3;
const MIN_INCOME = 1000;

// Validações
const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\(\d{2}\)\s\d{8,9}$|^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  name: /^[a-zA-ZÀ-ÿ\s]+$/
};

interface IndividualHolderContextData {
  holderData: IndividualHolderData;
  contactData: ContactData;
  setHolderData: React.Dispatch<React.SetStateAction<IndividualHolderData>>;
  setContactData: React.Dispatch<React.SetStateAction<ContactData>>;
  handleHolderSubmit: (data?: IndividualHolderData) => Promise<boolean>;
  updateContact: (type: 'phone' | 'email', item: DatastonePhone | DatastoneEmail, isMain: boolean) => void;
  removeContact: (type: 'phone' | 'email', id: string, isMain: boolean) => void;
  clearContacts: () => void;
  validateField: (field: keyof IndividualHolderData, value: any) => string | null;
  getSelectedAddress: () => DatastoneAddress | undefined;
  getSelectedPhone: () => DatastonePhone | undefined;
  getSelectedEmail: () => DatastoneEmail | undefined;
  updateAddress: (address: DatastoneAddress) => void;
  removeAddress: (id: string) => void;
  setCorrespondenceAddress: (id: string) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

interface IndividualHolderProviderProps {
  children: React.ReactNode;
  initialData?: IndividualHolderData;
}

const IndividualHolderContext = createContext<IndividualHolderContextData>({} as IndividualHolderContextData);

export function IndividualHolderProvider({ children, initialData }: IndividualHolderProviderProps) {
  const [holderData, setHolderData] = useState<IndividualHolderData>(initialData || {
    name: '',
    cpf: '',
    rg: '',
    birthDate: '',
    motherName: '',
    email: '',
    phone: '',
    phones: [],
    emails: [],
    addresses: [],
    additionalPhones: [],
    additionalEmails: []
  });

  const [contactData, setContactData] = useState<ContactData>({
    main: {
      phone: null,
      email: null
    },
    additional: {
      phones: [],
      emails: []
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };

  const validateAge = (birthDate: string): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age <= 100;
  };

  const validateField = (field: keyof IndividualHolderData, value: any): string | null => {
    if (!value && field !== 'income') return 'Campo obrigatório';
    
    switch (field) {
      case 'email':
        return REGEX.email.test(value) ? null : 'Email inválido';
      case 'phone':
        return REGEX.phone.test(value) ? null : 'Telefone inválido';
      case 'cpf':
        if (!REGEX.cpf.test(value)) return 'Formato de CPF inválido';
        return validateCPF(value) ? null : 'CPF inválido';
      case 'name':
      case 'motherName':
        if (!REGEX.name.test(value)) return 'Nome deve conter apenas letras';
        if (value.length < 3) return 'Nome deve ter no mínimo 3 caracteres';
        if (value.length > 100) return 'Nome deve ter no máximo 100 caracteres';
        return null;
      case 'income':
        if (isNaN(value)) return 'Renda deve ser um número';
        return value >= MIN_INCOME ? null : `Renda mínima deve ser R$ ${MIN_INCOME.toLocaleString('pt-BR')}`;
      case 'birthDate':
        const date = new Date(value);
        if (date >= new Date()) return 'Data de nascimento não pode ser futura';
        if (!validateAge(value)) return 'Idade deve ser menor que 100 anos';
        return null;
      case 'rg':
        if (value.length < 5) return 'RG inválido';
        return null;
      default:
        return value ? null : 'Campo obrigatório';
    }
  };

  const validateAddress = (address: DatastoneAddress): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!address.cep) errors.cep = 'CEP é obrigatório';
    if (!address.street) errors.street = 'Rua é obrigatória';
    if (!address.number) errors.number = 'Número é obrigatório';
    if (!address.neighborhood) errors.neighborhood = 'Bairro é obrigatório';
    if (!address.city) errors.city = 'Cidade é obrigatória';
    if (!address.state) errors.state = 'Estado é obrigatório';
    
    return errors;
  };

  const updateContact = (type: 'phone' | 'email', item: DatastonePhone | DatastoneEmail, isMain: boolean) => {
    if (isMain) {
      setContactData(prev => ({
        ...prev,
        main: {
          ...prev.main,
          [type]: item
        }
      }));
    } else {
      setContactData(prev => ({
        ...prev,
        additional: {
          ...prev.additional,
          [type === 'phone' ? 'phones' : 'emails']: [
            ...prev.additional[type === 'phone' ? 'phones' : 'emails'],
            item
          ]
        }
      }));
    }
  };

  const removeContact = (type: 'phone' | 'email', id: string, isMain: boolean) => {
    if (isMain) {
      setContactData(prev => ({
        ...prev,
        main: {
          ...prev.main,
          [type]: null
        }
      }));
    } else {
      setContactData(prev => ({
        ...prev,
        additional: {
          ...prev.additional,
          [type === 'phone' ? 'phones' : 'emails']: prev.additional[type === 'phone' ? 'phones' : 'emails']
            .filter(item => item.id !== id)
        }
      }));
    }
  };

  const clearContacts = () => {
    setContactData({
      main: {
        phone: null,
        email: null
      },
      additional: {
        phones: [],
        emails: []
      }
    });
  };

  const updateAddress = useCallback((address: DatastoneAddress) => {
    setHolderData(prev => {
      const addresses = [...prev.addresses];
      const index = addresses.findIndex(a => a.id === address.id);
      
      // Garantir que todos os campos existam, mesmo que vazios
      const updatedAddress = {
        id: address.id,
        selected: true,
        type: address.type || 'RESIDENTIAL',
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        cep: address.cep || '',
        district: address.district || address.neighborhood || '',
        postal_code: address.postal_code || address.cep || ''
      };
      
      if (index >= 0) {
        // Manter os campos existentes que não foram atualizados
        addresses[index] = {
          ...addresses[index],
          ...updatedAddress
        };
      } else {
        addresses.push(updatedAddress);
      }
      
      // Garantir que apenas o endereço atual esteja selecionado
      return {
        ...prev,
        addresses: addresses.map(addr => ({
          ...addr,
          selected: addr.id === updatedAddress.id
        }))
      };
    });
  }, []);

  const setCorrespondenceAddress = useCallback((id: string) => {
    setHolderData(prev => ({
      ...prev,
      addresses: prev.addresses.map(addr => ({
        ...addr,
        selected: addr.id === id
      }))
    }));
  }, []);

  const removeAddress = useCallback((id: string) => {
    setHolderData(prev => {
      const wasSelected = prev.addresses.find(addr => addr.id === id)?.selected;
      const filteredAddresses = prev.addresses.filter(address => address.id !== id);
      
      if (wasSelected && filteredAddresses.length > 0) {
        filteredAddresses[0].selected = true;
      }
      
      return {
        ...prev,
        addresses: filteredAddresses
      };
    });
  }, []);

  const handleHolderSubmit = async (data?: IndividualHolderData) => {
    try {
      setIsLoading(true);
      setError('');
      setFieldErrors({});

      // Usar os dados passados ou os dados do estado
      const currentData = data || holderData;

      console.log('=== Debug HolderSubmit ===');
      console.log('1. Dados do titular:', currentData);

      if (!currentData?.name || !currentData?.cpf) {
        console.error('Dados do titular estão vazios');
        setError('Dados do titular não encontrados');
        return false;
      }

      // Validar campos obrigatórios
      const requiredFields: (keyof IndividualHolderData)[] = ['name', 'cpf', 'birthDate', 'motherName', 'email', 'phone'];
      const validationErrors: Record<string, string> = {};
      
      requiredFields.forEach(field => {
        const value = currentData[field];
        console.log(`Validando campo ${field}:`, value);
        const error = validateField(field, value);
        if (error) {
          console.log(`Erro no campo ${field}:`, error);
          validationErrors[field] = error;
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        console.error('Erros de validação encontrados:', validationErrors);
        setFieldErrors(validationErrors);
        return false;
      }

      // Validar endereço principal
      const selectedAddress = currentData.addresses?.find(a => a.selected);
      console.log('2. Endereço selecionado:', selectedAddress);
      
      if (!selectedAddress) {
        const error = 'É necessário ter um endereço principal selecionado';
        console.error(error);
        setError(error);
        return false;
      }

      const addressErrors = validateAddress(selectedAddress);
      if (Object.keys(addressErrors).length > 0) {
        console.error('Erros no endereço:', addressErrors);
        setFieldErrors(addressErrors);
        return false;
      }

      // Pegar os dados selecionados
      const selectedEmail = currentData.emails?.find(e => e.selected);
      const selectedPhone = currentData.phones?.find(p => p.selected);

      console.log('3. Contatos selecionados:', {
        email: selectedEmail,
        phone: selectedPhone
      });

      // Dados validados com sucesso
      console.log('4. Dados validados com sucesso:', currentData);

      // Atualizar o estado se necessário
      if (data) {
        setHolderData(data);
      }

      return true;
    } catch (error) {
      console.error('5. Erro ao processar dados:', error);
      setError('Ocorreu um erro ao processar os dados do titular');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedAddress = useCallback(() => {
    return holderData.addresses.find(addr => addr.selected);
  }, [holderData.addresses]);

  const getSelectedPhone = useCallback(() => {
    return holderData.phones.find(phone => phone.selected);
  }, [holderData.phones]);

  const getSelectedEmail = useCallback(() => {
    return holderData.emails.find(email => email.selected);
  }, [holderData.emails]);

  return (
    <IndividualHolderContext.Provider
      value={{
        holderData,
        contactData,
        setHolderData,
        setContactData,
        handleHolderSubmit,
        updateContact,
        removeContact,
        clearContacts,
        validateField,
        getSelectedAddress,
        getSelectedPhone,
        getSelectedEmail,
        updateAddress,
        removeAddress,
        setCorrespondenceAddress,
        setIsLoading,
        setError,
        setFieldErrors
      }}
    >
      {children}
    </IndividualHolderContext.Provider>
  );
}

export function useIndividualHolder() {
  const context = useContext(IndividualHolderContext);

  if (!context) {
    throw new Error('useIndividualHolder must be used within an IndividualHolderProvider');
  }

  return context;
}
