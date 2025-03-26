import React, { useCallback, useState, useRef, useEffect } from 'react';
import { FormField } from '../../common/FormField';
import { DataSelectionCard } from '../../common/DataSelectionCard';
import { useIndividualHolder } from '../../../contexts/individual/IndividualHolderContext';
import { shiftDataApi } from '../../../services';
import { 
  IndividualHolderData,
  DatastoneAddress,
  DatastonePhone,
  DatastoneEmail,
  Gender,
  MaritalStatus
} from '../../../types/individual';
import axios from 'axios';
import { AlertCircle, X } from 'lucide-react';

// Constantes
const SHIFTDATA_API_URL = import.meta.env.VITE_SHIFTDATA_API_URL || '/api-shiftgroup/api';
const SHIFTDATA_API_TOKEN = import.meta.env.VITE_SHIFTDATA_API_TOKEN || '';
if (!SHIFTDATA_API_TOKEN) {
  console.error('VITE_SHIFTDATA_API_TOKEN não configurado');
}

interface IndividualHolderStepProps {
  onBack: () => void;
  onSubmit: () => void; // Função que apenas avança para o próximo passo
}

export function IndividualHolderStep({
  onBack,
  onSubmit,
}: IndividualHolderStepProps) {
  const { 
    holderData, 
    contactData,
    setHolderData, 
    setContactData,
    updateContact,
    validateField,
    handleHolderSubmit,
    updateAddress,
    removeAddress,
    setCorrespondenceAddress
  } = useIndividualHolder();
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  
  // Referências para seções do formulário
  const dadosPessoaisRef = useRef<HTMLDivElement>(null);
  const contatoRef = useRef<HTMLDivElement>(null);
  const enderecoRef = useRef<HTMLDivElement>(null);

  // Estado para controlar o modal de erro
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estilo para animação de shake quando há erro
  useEffect(() => {
    // Adicionar estilo para animação de erro
    const style = document.createElement('style');
    style.textContent = `
      @keyframes error-shake {
        0% { transform: translateX(0); }
        10% { transform: translateX(-5px); }
        20% { transform: translateX(5px); }
        30% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        50% { transform: translateX(-5px); }
        60% { transform: translateX(5px); }
        70% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
        90% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
      }
      
      .error-shake {
        animation: error-shake 0.6s ease-in-out;
        border-color: rgb(239, 68, 68) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Função para mostrar mensagem de erro
  const showErrorToast = (message: string, ref: React.RefObject<HTMLDivElement> | null) => {
    // Mostrar a mensagem de erro
    setErrorMessage(message);
    setShowErrorModal(true);

    // Rolar até o elemento com erro
    if (ref && ref.current) {
      console.log("Rolando até o elemento com erro");
      ref.current.scrollIntoView({ behavior: 'smooth' });
      // Adicionar uma classe para destacar visualmente o elemento com erro
      ref.current.classList.add('error-shake');
      setTimeout(() => {
        if (ref && ref.current) {
          ref.current.classList.remove('error-shake');
        }
      }, 1000);
    }
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };

  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Função para limpar erros quando um campo é preenchido
  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Função para verificar se um campo específico tem erro
  const hasFieldError = (field: string): boolean => {
    return !!fieldErrors[field];
  };

  // Atualiza o handleFieldChange para limpar erros quando um campo é preenchido
  const handleFieldChange = (field: keyof IndividualHolderData, value: any) => {
    const error = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
    
    // Se o valor é válido, limpar o erro para este campo
    if (value && !error) {
      clearFieldError(field as string);
    }
    
    setHolderData(prev => ({ ...prev, [field]: value }));
  };

  const handleCpfChange = async (value: string) => {
    const formattedCpf = formatCpf(value);
    handleFieldChange('cpf', formattedCpf);
    setError(null);

    if (formattedCpf.replace(/\D/g, '').length === 11) {
      setIsLoading(true);
      setFieldErrors({});

      try {
        // Usando o serviço shiftDataApi em vez de fetch diretamente
        const response = await shiftDataApi.get(
          `/PessoaFisica?cpf=${value.replace(/\D/g, '')}`
        );

        // Verificar a resposta diretamente
        const responseData = response.data;
        
        if (responseData && responseData.result) {
          const person = responseData.result;
          
          // Filtra endereços, telefones e emails para remover valores inválidos
          const validEmails = person.Emails?.filter((email: any) => 
            email.Email && email.Email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
          ) || [];
          
          const validPhones = person.Telefones?.filter((phone: any) => 
            phone.DDD && phone.Telefone && phone.DDD.length >= 2 && phone.Telefone.length >= 8
          ) || [];
          
          console.log('Telefones retornados pela API:', person.Telefones);
          console.log('Telefones válidos:', validPhones);
          
          // Normalizar dados da API
          const normalizedData = {
            name: person.Nome || '',
            cpf: formattedCpf,
            rg: '', // ShiftData API não retorna RG
            birthDate: person.DataNascimento ? new Date(person.DataNascimento).toISOString().split('T')[0] : '',
            gender: person.Sexo === 'F' ? Gender.FEMALE : Gender.MALE,
            motherName: person.NomeMae || '',
            // Tratamento de múltiplos endereços
            addresses: person.Enderecos?.map((addr: any) => ({
              id: crypto.randomUUID(),
              selected: false,
              type: 'RESIDENTIAL',
              street: addr.Logradouro || '',
              number: addr.Numero || '',
              complement: addr.Complemento || '',
              neighborhood: addr.Bairro || '',
              city: addr.Cidade || '',
              state: addr.UF || '',
              cep: addr.CEP || '',
              district: addr.Bairro || '',
              postal_code: addr.CEP || ''
            })) || [],
            // Tratamento de múltiplos telefones (apenas válidos)
            phones: validPhones.map((phone: any) => {
              // Garantir formatação correta do telefone
              const formattedPhone = `(${phone.DDD}) ${phone.Telefone.replace(/^(\d+)(\d{4})$/, '$1-$2')}`;
              return {
                id: crypto.randomUUID(),
                selected: false,
                ddd: phone.DDD || '',
                number: phone.Telefone || '',
                formattedNumber: formattedPhone,
                type: phone.TipoTelefone?.includes('MÓVEL') ? 'MOBILE' : 'LANDLINE'
              };
            }),
            // Tratamento de múltiplos emails (apenas válidos)
            emails: validEmails.map((emailData: any) => ({
              id: crypto.randomUUID(),
              selected: false,
              address: emailData.Email || '', 
              type: 'PERSONAL'
            }))
          };

          console.log('Phones normalizados:', normalizedData.phones);

          setHolderData(prev => ({
            ...prev,
            ...normalizedData
          }));

          // Atualizar contatos principais se disponíveis
          if (normalizedData.phones.length > 0) {
            updateContact('phone', normalizedData.phones[0], true);
          }
          if (normalizedData.emails.length > 0) {
            updateContact('email', normalizedData.emails[0], true);
          }

          setError(null);
        } else {
          setError('Nenhum dado encontrado para o CPF informado. Por favor, preencha manualmente os campos.');
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        
        // Verificar códigos de erro específicos
        if (axios.isAxiosError(err) && (err.response?.status === 402 || err.response?.status === 429)) {
          // Código 402 (Payment Required) ou 429 (Too Many Requests) indicam possíveis problemas de saldo
          setError('Não foi possível consultar os dados automaticamente. Por favor, preencha manualmente os campos.');
        } else {
          setError('Erro ao buscar dados do titular. Por favor, preencha manualmente os campos.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const createPhone = (ddd: string, number: string): DatastonePhone => ({
    id: crypto.randomUUID(),
    type: 'MOBILE',
    ddd,
    number,
    formattedNumber: `(${ddd}) ${number}`,
    selected: false
  });

  const handleEmailSelection = (id: string) => {
    // Primeiro verifica se o email selecionado é válido
    const emailToSelect = holderData.emails.find(email => email.id === id);
    if (emailToSelect && (!emailToSelect.address || !emailToSelect.address.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))) {
      // Se for um email inválido, não permitir seleção
      return;
    }
    
    const updatedEmails = holderData.emails.map(email => ({
      ...email,
      selected: email.id === id ? !email.selected : email.selected
    }));

    setHolderData(prev => ({
      ...prev,
      emails: updatedEmails,
      email: updatedEmails.find(e => e.selected)?.address || '' 
    }));

    // Atualizar contatos
    const selectedEmails = updatedEmails.filter(email => email.selected);
    if (selectedEmails.length > 0) {
      // Primeiro email vai para o contato principal
      const mainEmail = selectedEmails[0];
      updateContact('email', {
        id: mainEmail.id,
        selected: true,
        address: mainEmail.address,
        type: mainEmail.type
      }, true);
      
      // Demais emails vão para contatos adicionais
      const additionalEmails = selectedEmails.slice(1).map(email => ({
        id: email.id,
        selected: true,
        address: email.address,
        type: email.type
      }));

      setContactData(prev => ({
        ...prev,
        additional: {
          ...prev.additional,
          emails: additionalEmails
        }
      }));
    } else {
      // Se não houver emails selecionados, limpa os campos
      setHolderData(prev => ({
        ...prev,
        email: ''
      }));
      setContactData(prev => ({
        ...prev,
        main: {
          ...prev.main,
          email: null
        },
        additional: {
          ...prev.additional,
          emails: []
        }
      }));
    }
  };

  const handlePhoneSelection = (id: string) => {
    // Primeiro verifica se o telefone selecionado é válido
    const phoneToSelect = holderData.phones.find(phone => phone.id === id);
    if (!phoneToSelect || !phoneToSelect.ddd || !phoneToSelect.number || phoneToSelect.ddd.length < 2) {
      // Se for um telefone inválido, não permitir seleção
      return;
    }
    
    const updatedPhones = holderData.phones.map(phone => ({
      ...phone,
      selected: phone.id === id ? !phone.selected : phone.selected
    }));

    // Garante que o telefone formatado seja exibido no campo principal
    const selectedPhone = updatedPhones.find(p => p.id === id && p.selected);
    const formattedNumber = selectedPhone 
      ? (selectedPhone.formattedNumber || `(${selectedPhone.ddd}) ${selectedPhone.number}`)
      : '';

    setHolderData(prev => ({
      ...prev,
      phones: updatedPhones,
      phone: formattedNumber
    }));

    // Atualizar contatos
    const selectedPhones = updatedPhones.filter(phone => phone.selected);
    if (selectedPhones.length > 0) {
      // Primeiro telefone vai para o contato principal
      const mainPhone = selectedPhones[0];
      
      // Garante que o formattedNumber esteja correto
      const formattedMainPhone = {
        ...mainPhone,
        formattedNumber: mainPhone.formattedNumber || `(${mainPhone.ddd}) ${mainPhone.number}`
      };
      
      updateContact('phone', formattedMainPhone, true);
      
      // Demais telefones vão para contatos adicionais
      const additionalPhones = selectedPhones.slice(1).map(phone => ({
        ...phone,
        formattedNumber: phone.formattedNumber || `(${phone.ddd}) ${phone.number}`
      }));

      setContactData(prev => ({
        ...prev,
        additional: {
          ...prev.additional,
          phones: additionalPhones
        }
      }));
    } else {
      // Se não houver telefones selecionados, limpa os campos
      setHolderData(prev => ({
        ...prev,
        phone: ''
      }));
      setContactData(prev => ({
        ...prev,
        main: {
          ...prev.main,
          phone: null
        },
        additional: {
          ...prev.additional,
          phones: []
        }
      }));
    }
  };

  const renderMultipleEmails = () => {
    // Verificar se existem emails e se são válidos
    const validEmails = holderData.emails?.filter(email => 
      email.address && email.address.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ) || [];
    
    if (validEmails.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold text-white mb-2">Emails Disponíveis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validEmails.map((email) => (
            <div
              key={email.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                email.selected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300'
              }`}
              onClick={() => handleEmailSelection(email.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{email.address}</p>
                  <p className="text-sm text-white/60">Tipo: {email.type}</p>
                </div>
                <input
                  type="checkbox"
                  checked={email.selected}
                  onChange={() => handleEmailSelection(email.id)}
                  className="h-5 w-5 text-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMultiplePhones = () => {
    // Verificar se existem telefones no array phones
    if (!holderData.phones || holderData.phones.length === 0) return null;
    
    // Filtramos os telefones para exibir apenas os válidos
    // Um telefone é válido se tiver DDD e número, mesmo que a formatação não seja exata
    const validPhones = holderData.phones.filter(phone => 
      phone.ddd && phone.number && phone.ddd.length >= 2
    );
    
    if (validPhones.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold text-white mb-2">Telefones Disponíveis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validPhones.map((phone) => (
            <div
              key={phone.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                phone.selected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300'
              }`}
              onClick={() => handlePhoneSelection(phone.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {phone.formattedNumber || `(${phone.ddd}) ${phone.number}`}
                  </p>
                  <p className="text-sm text-white/60">Tipo: {phone.type === 'MOBILE' ? 'Celular' : 'Fixo'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={phone.selected}
                  onChange={() => handlePhoneSelection(phone.id)}
                  className="h-5 w-5 text-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAddresses = () => {
    if (!holderData.addresses || holderData.addresses.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold text-white mb-2">Endereços Disponíveis</h4>
        <div className="grid grid-cols-1 gap-4">
          {holderData.addresses.map((address) => (
            <div
              key={address.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                address.selected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300'
              }`}
              onClick={() => handleAddressSelection(address.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{address.type}</p>
                  <p className="text-sm text-white/60">
                    {address.street}, {address.number}
                    {address.complement ? ` - ${address.complement}` : ''}
                  </p>
                  <p className="text-sm text-white/60">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                  <p className="text-sm text-white/60">CEP: {address.cep}</p>
                </div>
                <input
                  type="radio"
                  checked={address.selected}
                  onChange={() => handleAddressSelection(address.id)}
                  className="h-5 w-5 text-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleAddressSelection = async (id: string) => {
    const selectedAddress = holderData.addresses.find(address => address.id === id);
    if (!selectedAddress) return;

    try {
      // Atualiza o endereço selecionado no array de endereços
      const updatedAddresses = holderData.addresses.map(addr => {
        if (addr.id === id) {
          return {
            ...addr,
            selected: true,
            // Mapeamento correto dos campos
            cep: addr.postal_code || addr.cep || '',
            street: `${addr.type || ''} ${addr.street || ''}`.trim(),
            number: addr.number?.toString() || '',
            complement: addr.complement || '',
            neighborhood: addr.neighborhood || '',
            city: addr.city || '',
            state: addr.state || addr.district || '', // Usa state com fallback para district
            type: addr.type || ''
          };
        }
        return { ...addr, selected: false };
      });

      // Debug para verificar os valores antes da atualização
      console.log('Endereço selecionado:', selectedAddress);
      console.log('Endereços a serem atualizados:', updatedAddresses);

      // Atualiza o estado com os endereços atualizados
      await new Promise<void>((resolve) => {
        setHolderData(prev => ({
          ...prev,
          addresses: updatedAddresses
        }));
        setTimeout(resolve, 0);
      });

      // Debug para verificar os valores após a atualização
      console.log('Estado atualizado:', holderData);
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      setError('Erro ao atualizar endereço');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('=== Verificando campos obrigatórios ===');
    
    // Limpar erros anteriores
    setFieldErrors({});
    
    // Flag para acompanhar se há erros
    let hasErrors = false;
    
    // Verificar campos pessoais obrigatórios 
    const personalFields = [
      { key: 'cpf', label: 'CPF' },
      { key: 'name', label: 'Nome completo' },
      { key: 'birthDate', label: 'Data de nascimento' },
      { key: 'motherName', label: 'Nome da mãe' },
      { key: 'rg', label: 'RG' }
    ];
    
    personalFields.forEach(({ key, label }) => {
      if (!holderData[key as keyof typeof holderData]) {
        setFieldErrors(prev => ({
          ...prev,
          [key]: `O campo ${label} é obrigatório`
        }));
        hasErrors = true;
      }
    });
    
    // Verificar campos de contato
    const contactFields = [
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefone' }
    ];
    
    contactFields.forEach(({ key, label }) => {
      if (!holderData[key as keyof typeof holderData]) {
        setFieldErrors(prev => ({
          ...prev,
          [key]: `O campo ${label} é obrigatório`
        }));
        hasErrors = true;
      }
    });
    
    // Verificar campos de endereço
    const selectedAddress = holderData.addresses.find(addr => addr.selected);
    const addressFields = [
      { key: 'cep', label: 'CEP' },
      { key: 'street', label: 'Logradouro' },
      { key: 'number', label: 'Número' },
      { key: 'neighborhood', label: 'Bairro' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' }
    ];
    
    if (!selectedAddress || holderData.addresses.length === 0) {
      addressFields.forEach(({ key, label }) => {
        setFieldErrors(prev => ({
          ...prev,
          [key]: `O campo ${label} é obrigatório`
        }));
      });
      hasErrors = true;
    } else {
      addressFields.forEach(({ key, label }) => {
        if (!selectedAddress[key as keyof typeof selectedAddress]) {
          setFieldErrors(prev => ({
            ...prev,
            [key]: `O campo ${label} é obrigatório`
          }));
          hasErrors = true;
        }
      });
    }
    
    // Se há erros, exibir mensagem e parar o processamento
    if (hasErrors) {
      let targetRef = null;
      let message = '';
      
      // Definir a seção para onde rolar e a mensagem a exibir
      if (Object.keys(fieldErrors).some(key => ['cpf', 'name', 'birthDate', 'motherName', 'rg'].includes(key))) {
        message = 'Preencha todos os dados pessoais obrigatórios';
        targetRef = dadosPessoaisRef;
      } else if (Object.keys(fieldErrors).some(key => ['email', 'phone'].includes(key))) {
        message = 'Preencha todos os dados de contato obrigatórios';
        targetRef = contatoRef;
      } else {
        message = 'Preencha todos os dados de endereço obrigatórios';
        targetRef = enderecoRef;
      }
      
      showErrorToast(message, targetRef);
      return;
    }
    
    // Formatar os dados para envio
    const formattedData: IndividualHolderData = {
      ...holderData,
      phones: holderData.phones || [],
      emails: holderData.emails || [],
      addresses: holderData.addresses || [],
      additionalPhones: holderData.additionalPhones || [],
      additionalEmails: holderData.additionalEmails || []
    };

    console.log('1. Dados formatados para envio:', formattedData);

    // Validar os dados no contexto do titular
    const success = await handleHolderSubmit(formattedData);
    if (success) {
      console.log('2. Dados validados com sucesso');
      // Avançar para o próximo passo
      onSubmit();
    } else {
      // Se o handleHolderSubmit retornar falso, há erros que ele já deve ter tratado
      console.log('Falha na validação do contexto');
    }
  };

  // Modificar a função updateEmailManually para limpar erros
  const updateEmailManually = (emailValue: string) => {
    // Atualiza o valor do email no campo, independente da validação
    handleFieldChange('email', emailValue);
    
    // Se for um valor válido, limpar o erro
    if (emailValue && emailValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      clearFieldError('email');
    }
    
    // Identificador para o email manual
    const manualEmailId = 'manual-email';
    
    // Verifica se é um email válido completo
    const isValidEmail = emailValue && emailValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    
    if (isValidEmail) {
      // Se for válido, cria/atualiza o objeto de email
      const existingManualEmailIndex = holderData.emails?.findIndex(e => e.id === manualEmailId);
      
      const emailObj: DatastoneEmail = {
        id: manualEmailId,
        address: emailValue,
        type: 'PERSONAL' as 'PERSONAL',
        selected: true
      };
      
      // Atualiza o array de emails
      let updatedEmails: DatastoneEmail[] = [];
      
      if (existingManualEmailIndex >= 0) {
        // Se já existe um email manual, atualiza ele
        updatedEmails = [...(holderData.emails || [])];
        updatedEmails[existingManualEmailIndex] = {
          ...updatedEmails[existingManualEmailIndex],
          address: emailValue,
          selected: true
        };
        
        // Desmarca os outros emails
        updatedEmails = updatedEmails.map(e => 
          e.id !== manualEmailId ? {...e, selected: false} : e
        );
      } else {
        // Se não existe, cria um novo e desmarca os existentes
        updatedEmails = (holderData.emails || []).map(e => ({...e, selected: false}));
        updatedEmails.push(emailObj);
      }
      
      // Atualiza o estado
      setHolderData(prev => ({
        ...prev,
        emails: updatedEmails
      }));
      
      // Atualiza o contato
      updateContact('email', emailObj, true);
    } else {
      // Se o email for inválido, procura e remove o email manual se existir
      const existingManualEmailIndex = holderData.emails?.findIndex(e => e.id === manualEmailId);
      
      if (existingManualEmailIndex >= 0) {
        // Cria uma cópia do array atual de emails
        const updatedEmails = [...(holderData.emails || [])];
        
        // Remove o email manual
        updatedEmails.splice(existingManualEmailIndex, 1);
        
        // Atualiza o estado sem o email manual
        setHolderData(prev => ({
          ...prev,
          emails: updatedEmails
        }));
        
        // Se não tinha nenhum email selecionado, limpa o contato principal
        if (!updatedEmails.some(e => e.selected)) {
          // Criamos um objeto vazio mas com as propriedades necessárias
          const emptyEmail: DatastoneEmail = {
            id: 'empty',
            address: '',
            type: 'PERSONAL',
            selected: false
          };
          updateContact('email', emptyEmail, true);
        }
      }
    }
  };
  
  // Modificar a função updatePhoneManually para limpar erros
  const updatePhoneManually = (phoneValue: string) => {
    const formattedPhone = formatPhone(phoneValue);
    
    // Atualiza o valor formatado no campo de telefone
    handleFieldChange('phone', formattedPhone);
    
    // Se for um valor válido, limpar o erro
    if (formattedPhone && formattedPhone.match(/^\(\d{2}\) \d{4,5}-\d{4}$/)) {
      clearFieldError('phone');
    }
    
    // Identificador para o telefone manual
    const manualPhoneId = 'manual-phone';
    
    // Verifica se é um telefone válido completo
    const isValidPhone = formattedPhone && formattedPhone.match(/^\(\d{2}\) \d{4,5}-\d{4}$/);
    
    if (isValidPhone) {
      const [, ddd = '', number = ''] = formattedPhone.match(/\((\d{2})\) (.*)/) || [];
      
      // Verifica se já existe um telefone manual com o mesmo ID no array
      const existingManualPhoneIndex = holderData.phones?.findIndex(p => p.id === manualPhoneId);
      
      const phoneObj: DatastonePhone = {
        id: manualPhoneId,
        ddd,
        number,
        formattedNumber: formattedPhone,
        type: 'MOBILE' as 'MOBILE',
        selected: true
      };
      
      // Atualiza o array de telefones
      let updatedPhones: DatastonePhone[] = [];
      
      if (existingManualPhoneIndex >= 0) {
        // Se já existe um telefone manual, atualiza ele
        updatedPhones = [...(holderData.phones || [])];
        updatedPhones[existingManualPhoneIndex] = {
          ...updatedPhones[existingManualPhoneIndex],
          ddd,
          number,
          formattedNumber: formattedPhone,
          selected: true
        };
        
        // Desmarca os outros telefones
        updatedPhones = updatedPhones.map(p => 
          p.id !== manualPhoneId ? {...p, selected: false} : p
        );
      } else {
        // Se não existe, cria um novo e desmarca os existentes
        updatedPhones = (holderData.phones || []).map(p => ({...p, selected: false}));
        updatedPhones.push(phoneObj);
      }
      
      // Atualiza o estado
      setHolderData(prev => ({
        ...prev,
        phones: updatedPhones,
        ddd,
        number
      }));
      
      // Atualiza o contato
      updateContact('phone', phoneObj, true);
    } else {
      // Se o telefone for inválido, procura e remove o telefone manual se existir
      const existingManualPhoneIndex = holderData.phones?.findIndex(p => p.id === manualPhoneId);
      
      if (existingManualPhoneIndex >= 0) {
        // Cria uma cópia do array atual de telefones
        const updatedPhones = [...(holderData.phones || [])];
        
        // Remove o telefone manual
        updatedPhones.splice(existingManualPhoneIndex, 1);
        
        // Atualiza o estado sem o telefone manual
        setHolderData(prev => ({
          ...prev,
          phones: updatedPhones
        }));
        
        // Se não tinha nenhum telefone selecionado, limpa o contato principal
        if (!updatedPhones.some(p => p.selected)) {
          // Criamos um objeto vazio mas com as propriedades necessárias
          const emptyPhone: DatastonePhone = {
            id: 'empty',
            ddd: '',
            number: '',
            formattedNumber: '',
            type: 'MOBILE',
            selected: false
          };
          updateContact('phone', emptyPhone, true);
        }
      }
    }
  };

  // Componente para exibir o modal de erro
  const ErrorModal = () => {
    if (!showErrorModal) return null;
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
        <div className="bg-gray-900 border border-red-500 rounded-lg p-6 max-w-md w-full shadow-lg transform transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-red-500 rounded-full p-2 mr-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Campos obrigatórios</h3>
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-white text-lg">{errorMessage}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg text-white font-bold transition-all hover:from-violet-700 hover:to-purple-700"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mr-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Informações do Titular
        </h2>
        <p className="text-white/80 text-lg">
          Preencha os dados do titular do plano
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 text-white flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6 text-white flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Carregando dados...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da API Datastone */}
        <div className="space-y-6">
          {renderAddresses()}
          {renderMultipleEmails()}
          {renderMultiplePhones()}
          
          <div 
            ref={dadosPessoaisRef}
            className={`bg-white/10 rounded-lg p-6 space-y-6 border ${
              Object.keys(fieldErrors).some(key => ['cpf', 'name', 'birthDate', 'motherName', 'rg'].includes(key)) 
                ? 'border-red-500 shadow-red-500/30' 
                : 'border-purple-400/30'
            } shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Dados Pessoais</h3>
            
            <FormField 
              label="CPF do Titular"
              error={fieldErrors['cpf']}
            >
              <input
                type="text"
                value={holderData.cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                         text-white placeholder:text-white/60 focus:outline-none
                         transition-colors ${
                           hasFieldError('cpf') 
                             ? 'border-red-500 focus:border-red-400' 
                             : 'border-purple-500 focus:border-white/40'
                         }`}
                required
                disabled={isLoading}
              />
              {fieldErrors['cpf'] && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors['cpf']}
                </p>
              )}
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="Nome do Titular"
                error={fieldErrors['name']}
              >
                <input
                  type="text"
                  value={holderData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Nome completo"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             hasFieldError('name') 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                  required
                  disabled={isLoading}
                />
                {fieldErrors['name'] && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors['name']}
                  </p>
                )}
              </FormField>

              <FormField label="Data de Nascimento">
                <input
                  type="date"
                  value={holderData.birthDate}
                  onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white focus:outline-none focus:border-white/40 transition-colors"
                  required
                  disabled={isLoading}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome da Mãe">
                <input
                  type="text"
                  value={holderData.motherName}
                  onChange={(e) => handleFieldChange('motherName', e.target.value)}
                  placeholder="Nome da mãe"
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                  required
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="RG">
                <input
                  type="text"
                  value={holderData.rg}
                  onChange={(e) => handleFieldChange('rg', e.target.value)}
                  placeholder="00.000.000-0"
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                  required
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>

          <div 
            ref={contatoRef}
            className={`bg-white/10 rounded-lg p-6 space-y-6 border ${
              Object.keys(fieldErrors).some(key => ['email', 'phone'].includes(key)) 
                ? 'border-red-500 shadow-red-500/30' 
                : 'border-purple-400/30'
            } shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="E-mail"
                error={fieldErrors['email']}
              >
                <input
                  type="email"
                  value={holderData.email}
                  onChange={(e) => updateEmailManually(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             hasFieldError('email') 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                  required
                  disabled={isLoading}
                />
                {fieldErrors['email'] && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors['email']}
                  </p>
                )}
              </FormField>

              <FormField 
                label="Telefone"
                error={fieldErrors['phone']}
              >
                <input
                  type="text"
                  value={holderData.phone}
                  onChange={(e) => updatePhoneManually(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             hasFieldError('phone') 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                  required
                  disabled={isLoading}
                />
                {fieldErrors['phone'] && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors['phone']}
                  </p>
                )}
              </FormField>
            </div>

            {/* Campos adicionais de email */}
            {contactData.additional.emails.map((email, index) => (
              <div key={`additional-email-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={`E-mail adicional ${index + 1}`}>
                  <input
                    type="email"
                    value={email.address}
                    onChange={(e) => {
                      const newEmails = [...contactData.additional.emails];
                      newEmails[index] = {
                        ...email,
                        address: e.target.value
                      };
                      setContactData(prev => ({
                        ...prev,
                        additional: {
                          ...prev.additional,
                          emails: newEmails
                        }
                      }));
                    }}
                    className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                      text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </FormField>
              </div>
            ))}

            {/* Campos adicionais de telefone */}
            {contactData.additional.phones.map((phone, index) => (
              <div key={`additional-phone-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={`Telefone adicional ${index + 1}`}>
                  <input
                    type="text"
                    value={phone.formattedNumber}
                    onChange={(e) => {
                      const formattedPhone = formatPhone(e.target.value);
                      const [, ddd = '', number = ''] = formattedPhone.match(/\((\d{2})\) (.*)/) || [];
                      
                      const newPhones = [...contactData.additional.phones];
                      newPhones[index] = {
                        ...phone,
                        ddd,
                        number,
                        formattedNumber: formattedPhone
                      };
                      
                      setContactData(prev => ({
                        ...prev,
                        additional: {
                          ...prev.additional,
                          phones: newPhones
                        }
                      }));
                    }}
                    placeholder="(00) 00000-0000"
                    className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                      text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </FormField>
              </div>
            ))}
          </div>

          {/* Campos de Endereço */}
          <div 
            ref={enderecoRef}
            className={`bg-white/10 rounded-lg p-6 space-y-6 border ${
              Object.keys(fieldErrors).some(key => ['cep', 'street', 'number', 'neighborhood', 'city', 'state'].includes(key)) 
                ? 'border-red-500 shadow-red-500/30' 
                : 'border-purple-400/30'
            } shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="CEP"
                error={fieldErrors['cep']}
              >
                <input
                  type="text"
                  value={holderData.addresses.find(addr => addr.selected)?.postal_code || ''}
                  onChange={(e) => {
                    const formattedCep = formatCep(e.target.value);
                    const address = {
                      ...holderData.addresses[0] || {},
                      id: holderData.addresses[0]?.id || crypto.randomUUID(),
                      postal_code: formattedCep,
                      cep: formattedCep,
                      selected: true
                    };
                    updateAddress(address as DatastoneAddress);
                  }}
                  placeholder="00000-000"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             fieldErrors['cep'] 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                />
              </FormField>

              <FormField 
                label="Logradouro"
                error={fieldErrors['street']}
              >
                <input
                  type="text"
                  value={holderData.addresses.find(addr => addr.selected)?.street || ''}
                  onChange={(e) => {
                    const address = {
                      ...holderData.addresses[0] || {},
                      id: holderData.addresses[0]?.id || crypto.randomUUID(),
                      street: e.target.value,
                      selected: true
                    };
                    updateAddress(address as DatastoneAddress);
                  }}
                  placeholder="Rua, Avenida, etc"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             fieldErrors['street'] 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                />
              </FormField>

              <FormField 
                label="Número"
                error={fieldErrors['number']}
              >
                <input
                  type="text"
                  value={holderData.addresses.find(addr => addr.selected)?.number || ''}
                  onChange={(e) => {
                    const address = {
                      ...holderData.addresses[0] || {},
                      id: holderData.addresses[0]?.id || crypto.randomUUID(),
                      number: e.target.value,
                      selected: true
                    };
                    updateAddress(address as DatastoneAddress);
                  }}
                  placeholder="123"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             fieldErrors['number'] 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                />
              </FormField>

              <FormField 
                label="Complemento"
                error={fieldErrors['complement']}
              >
                <input
                  type="text"
                  value={holderData.addresses.find(addr => addr.selected)?.complement || ''}
                  onChange={(e) => {
                    const address = {
                      ...holderData.addresses[0] || {},
                      id: holderData.addresses[0]?.id || crypto.randomUUID(),
                      complement: e.target.value,
                      selected: true
                    };
                    updateAddress(address as DatastoneAddress);
                  }}
                  placeholder="Apto 123, Bloco B"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             fieldErrors['complement'] 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                />
              </FormField>

              <FormField 
                label="Bairro"
                error={fieldErrors['neighborhood']}
              >
                <input
                  type="text"
                  value={holderData.addresses.find(addr => addr.selected)?.neighborhood || ''}
                  onChange={(e) => {
                    const address = {
                      ...holderData.addresses[0] || {},
                      id: holderData.addresses[0]?.id || crypto.randomUUID(),
                      neighborhood: e.target.value,
                      selected: true
                    };
                    updateAddress(address as DatastoneAddress);
                  }}
                  placeholder="Nome do bairro"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             fieldErrors['neighborhood'] 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                />
              </FormField>

              <FormField 
                label="Cidade"
                error={fieldErrors['city']}
              >
                <input
                  type="text"
                  value={holderData.addresses.find(addr => addr.selected)?.city || ''}
                  onChange={(e) => {
                    const address = {
                      ...holderData.addresses[0] || {},
                      id: holderData.addresses[0]?.id || crypto.randomUUID(),
                      city: e.target.value,
                      selected: true
                    };
                    updateAddress(address as DatastoneAddress);
                  }}
                  placeholder="Nome da cidade"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             fieldErrors['city'] 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                />
              </FormField>

              <FormField 
                label="Estado"
                error={fieldErrors['state']}
              >
                <input
                  type="text"
                  value={holderData.addresses.find(addr => addr.selected)?.state || ''}
                  onChange={(e) => {
                    const address = {
                      ...holderData.addresses[0] || {},
                      id: holderData.addresses[0]?.id || crypto.randomUUID(),
                      state: e.target.value,
                      selected: true
                    };
                    updateAddress(address as DatastoneAddress);
                  }}
                  placeholder="UF"
                  className={`w-full px-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none
                           transition-colors ${
                             fieldErrors['state'] 
                               ? 'border-red-500 focus:border-red-400' 
                               : 'border-purple-500 focus:border-white/40'
                           }`}
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 bg-white/10 py-4 px-6 border border-purple-400/30 rounded-lg shadow-lg text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
            disabled={isLoading}
          >
            ← Anterior
          </button>
          <button
            type="submit"
            className="w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Continuar'}
          </button>
        </div>
      </form>

      <ErrorModal />
    </div>
  );
}
