import React from 'react';
import { FormField } from '../../../components/common/FormField';
import {
  IndividualPlanData,
  IndividualHolderData,
  IndividualDependentData,
  GracePeriodData,
  Operator,
  Supervisor
} from '../../../types';
import { useIndividualHolder } from '../../../contexts/individual/IndividualHolderContext';
import { Edit2, User, FileText, CreditCard, Building, Clock, CheckCircle, FileCheck } from 'lucide-react';

interface IndividualReviewStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent, observacoes?: string) => Promise<void>;
  onEditStep: (step: number) => void;
  planData: IndividualPlanData;
  dependents: IndividualDependentData[];
  gracePeriodData: GracePeriodData;
  operators: Operator[];
  selectedSupervisor: string;
  supervisors: Supervisor[];
  brokerData: {
    document: string;
    name: string;
    email: string;
    whatsapp: string;
    supervisorId: string;
    equipe_nome?: string;
    id?: number;
  };
}

export function IndividualReviewStep({
  onBack,
  onSubmit,
  onEditStep,
  planData,
  dependents,
  gracePeriodData,
  operators,
  selectedSupervisor,
  supervisors,
  brokerData,
}: IndividualReviewStepProps) {
  const { holderData, getSelectedEmail, getSelectedPhone, getSelectedAddress } = useIndividualHolder();
  const [observacoes, setObservacoes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const supervisor = supervisors?.find(s => String(s?.id) === String(selectedSupervisor));
  
  // Função para obter o nome da operadora
  const getOperatorName = () => {
    // Primeiro, verificar se existe operatorName
    if (planData.operatorName) {
      return planData.operatorName;
    }
    
    // Caso não exista, tentar obter do objeto operator
    if (!planData.operator) return '-';
    
    if (typeof planData.operator === 'object' && planData.operator !== null) {
      return planData.operator.nome || '-';
    }
    
    // Quando planData.operator é um número (ID), buscar o objeto correspondente no array de operadoras
    const operatorObj = operators.find(op => Number(op.id) === Number(planData.operator));
    return operatorObj?.nome || '-';
  };

  // Função para obter o nome da administradora
  const getAdministratorName = () => {
    if (!planData.administrator) return '-';
    
    // Quando planData.administrator é um objeto com a propriedade nome
    if (typeof planData.administrator === 'object' && planData.administrator !== null) {
      return planData.administrator.nome || '-';
    }
    
    // Quando planData.administrator é um número ou string (ID), buscar o objeto correspondente no array de administradoras
    if (operators && operators.length > 0) {
      const administratorId = Number(planData.administrator);
      const administratorObj = operators?.find(admin => Number(admin.administradora_id) === administratorId);
      if (administratorObj) {
        return administratorObj.nome;
      }
    }
    
    // Se não encontrou, retorna o ID como string
    return String(planData.administrator);
  };

  // Função para formatar o tipo de plano
  const getPlanType = () => {
    if (!planData.type) return 'Individual';
    
    return planData.type.toLowerCase() === 'adhesion' ? 'Adesão' : 'Individual';
  };

  const selectedEmail = getSelectedEmail();
  const selectedPhone = getSelectedPhone();
  const selectedAddress = getSelectedAddress();

  // Obter a URL do logo da operadora
  const operatorLogo = typeof planData.operator === 'object' && planData.operator 
    ? planData.operator.logo_url 
    : null;

  React.useEffect(() => {
    // Debug dos dados disponíveis
    console.log('=== Debug IndividualReviewStep ===');
    console.log('1. Dados do titular:', holderData);
    console.log('2. Email selecionado:', selectedEmail);
    console.log('3. Telefone selecionado:', selectedPhone);
    console.log('4. Endereço selecionado:', selectedAddress);
  }, [holderData, selectedEmail, selectedPhone, selectedAddress]);

  // Verificar todos os dados necessários
  if (!planData || !gracePeriodData || !holderData || !brokerData) {
    console.log('Dados faltando:', {
      planData: !planData,
      gracePeriodData: !gracePeriodData,
      holderData: !holderData,
      brokerData: !brokerData
    });
    return (
      <div className="text-white text-center p-8">
        Carregando dados... Por favor, verifique se todas as informações foram preenchidas corretamente nos passos anteriores.
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    try {
      // Verifica se a data está no formato ISO (YYYY-MM-DD)
      if (date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      
      // Verifica se a data está no formato DD/MM/YYYY
      if (date.includes('/')) {
        return date;
      }
      
      // Tenta converter de timestamp ou outro formato
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('pt-BR');
      }
      
      return date;
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return date || '-';
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatWhatsApp = (phone: string) => {
    if (!phone) return '-';
    // Remove qualquer caractere não numérico
    const cleanNumber = phone.replace(/\D/g, '');
    // Verifica se o número já tem o código do país
    if (cleanNumber.startsWith('55') && cleanNumber.length >= 12) {
      // Formata como +55 (XX) XXXXX-XXXX
      return cleanNumber.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 ($1) $2-$3');
    } else if (cleanNumber.length === 11 || cleanNumber.length === 10) {
      // Adiciona o código do país e formata
      return `+55 (${cleanNumber.substring(0, 2)}) ${cleanNumber.substring(2, cleanNumber.length - 4)}-${cleanNumber.substring(cleanNumber.length - 4)}`;
    }
    // Se não se encaixar nos padrões acima, retorna formatado como telefone normal
    return formatPhone(phone);
  };

  const translateRelationship = (relationship: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evitar múltiplos envios
    if (isSubmitting) return;
    
    // Atualizar estado para indicar que está enviando
    setIsSubmitting(true);
    
    try {
      await onSubmit(e, observacoes);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Section = ({ title, children, onEdit, icon: Icon }: { title: string; children: React.ReactNode; onEdit?: () => void; icon?: React.ComponentType<any> }) => (
    <div className="bg-white/10 rounded-lg p-6 space-y-4 mb-8 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
      <div className="flex justify-between items-center border-b border-purple-400/30 pb-3 mb-2">
        <h3 className="text-xl font-bold text-white flex items-center">
          {Icon && <Icon className="w-6 h-6 mr-3 text-purple-400" />}
          {title}
        </h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full hover:bg-white/10"
          >
            <Edit2 size={16} />
            <span className="text-sm">Editar</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: any }) => (
    <div className="mb-4 bg-white/5 p-3 rounded-md hover:bg-white/10 transition-all">
      <span className="block text-purple-300 text-sm mb-1 font-medium">{label}</span>
      <span className="text-white font-medium">{typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value}</span>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <CheckCircle className="w-8 h-8 mr-3 text-purple-400" />
          Revisão Final
        </h2>
        <p className="text-white/80 text-lg">
          Revise todas as informações antes de finalizar o processo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Dados do Corretor" onEdit={() => onEditStep(0)} icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="CPF" value={formatCPF(brokerData.document)} />
            <Field label="Nome Completo" value={brokerData.name} />
            <Field label="E-mail" value={brokerData.email} />
            <Field label="WhatsApp" value={formatWhatsApp(brokerData.whatsapp)} />
            <Field label="Supervisor" value={brokerData.equipe_nome || '-'} />
          </div>
        </Section>

        <Section title="Plano" icon={CreditCard}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tipo" value={getPlanType()} />
            <Field label="Operadora" value={getOperatorName()} />
            {planData.type && planData.type.toLowerCase() === 'adhesion' && (
              <>
                <Field label="Administradora" value={getAdministratorName()} />
                <Field label="Associação" value={planData.association || '-'} />
              </>
            )}
            <Field label="Nome do Plano" value={planData.nomePlano || '-'} />
            <Field label="Vigência" value={planData.vigencia || '-'} />
            <Field label="Acomodação" value={planData.accommodation === 'private' ? 'Apartamento' : 'Enfermaria'} />
            <Field 
              label="Coparticipação" 
              value={
                typeof planData.coparticipation === 'string' ? 
                  (planData.coparticipation === 'completa' ? 'Sim Completa' :
                   planData.coparticipation === 'parcial' ? 'Sim Parcial' :
                   planData.coparticipation === 'nao' ? 'Não' : '-') :
                  (planData.coparticipation ? 'Sim' : 'Não')
              } 
            />
            <Field label="Valor do Plano" value={formatCurrency(planData.value)} />
          </div>
          
          {operatorLogo && (
            <div className="mt-4 pt-4 border-t border-purple-400/30 bg-white/5 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="mr-4 flex-shrink-0 bg-white/80 p-2 rounded-lg shadow-md">
                  <img 
                    src={operatorLogo} 
                    alt={`Logo ${getOperatorName()}`}
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white">{getOperatorName()}</h4>
                  <p className="text-purple-300 text-sm">
                    Plano de Saúde Individual
                  </p>
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section title="Dados do Titular" onEdit={() => onEditStep(2)} icon={User}>
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="CPF do Titular" value={formatCPF(holderData.cpf || '')} />
              <Field label="Nome do Titular" value={holderData.name || '-'} />
              <Field label="Data de Nascimento" value={holderData.birthDate ? formatDate(holderData.birthDate) : '-'} />
              <Field label="Nome da Mãe" value={holderData.motherName || '-'} />
              <Field label="RG" value={holderData.rg || '-'} />
              <Field label="E-mail Principal" value={selectedEmail?.address || holderData.email || '-'} />
              <Field label="Telefone Principal" value={selectedPhone?.formattedNumber || holderData.phone || '-'} />
            </div>

            {/* Contatos Adicionais */}
            {(holderData.emails?.filter(email => email.selected)?.length > 0 || 
              holderData.phones?.filter(phone => phone.selected)?.length > 0) && (
              <div className="mt-4 pt-4 border-t border-purple-400/30">
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contatos Selecionados
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Emails Selecionados */}
                  {holderData.emails
                    ?.filter(email => email.selected)
                    .map((email, index) => (
                      <Field 
                        key={`email-${email.id}`}
                        label={`Email ${index + 1}`} 
                        value={email.address || '-'} 
                      />
                    ))
                  }
                  
                  {/* Telefones Selecionados */}
                  {holderData.phones
                    ?.filter(phone => phone.selected)
                    .map((phone, index) => (
                      <Field 
                        key={`phone-${phone.id}`}
                        label={`Telefone ${index + 1}`} 
                        value={phone.formattedNumber || '-'} 
                      />
                    ))
                  }
                </div>
              </div>
            )}

            {/* Endereço */}
            {holderData?.addresses && holderData.addresses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-400/30">
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Endereço
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {holderData.addresses
                    .filter(address => address.selected)
                    .map((address, index) => (
                      <React.Fragment key={address.id || index}>
                        <Field label="CEP" value={address.cep || '-'} />
                        <Field label="Logradouro" value={address.street || '-'} />
                        <Field label="Número" value={address.number || '-'} />
                        <Field label="Complemento" value={address.complement || '-'} />
                        <Field label="Bairro" value={address.neighborhood || '-'} />
                        <Field label="Cidade" value={address.city || '-'} />
                        <Field label="Estado" value={address.state || '-'} />
                      </React.Fragment>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {dependents.length > 0 && (
          <Section title="Dependentes" onEdit={() => onEditStep(3)} icon={User}>
            <div className="bg-gradient-to-r from-purple-600/20 to-violet-600/20 px-4 py-3 rounded-lg mb-6 border border-purple-500/30">
              <div className="text-sm">
                <p className="font-medium text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Total de Dependentes: <span className="ml-1 text-lg font-bold text-purple-300">{dependents.length}</span>
                </p>
              </div>
            </div>
            
            {dependents.map((dependent, index) => (
              <div key={index} className="border-t border-purple-400/30 pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center bg-gradient-to-r from-purple-700/50 to-violet-700/50 p-3 rounded-lg">
                  <User className="w-5 h-5 mr-2 text-purple-300" />
                  {index + 1}º Dependente - {dependent.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nome Completo" value={dependent.name} />
                  <Field label="CPF" value={formatCPF(dependent.cpf)} />
                  <Field label="Data de Nascimento" value={formatDate(dependent.birthDate)} />
                  <Field label="Parentesco" value={translateRelationship(dependent.relationship)} />
                </div>
              </div>
            ))}
          </Section>
        )}

        <Section title="Carência" onEdit={() => onEditStep(4)} icon={Clock}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Aproveitar Carência?" value={gracePeriodData.hasGracePeriod ? 'Sim' : 'Não'} />
            {gracePeriodData.hasGracePeriod && (
              <Field 
                label="Operadora Anterior" 
                value={
                  gracePeriodData.hasGracePeriod
                    ? (gracePeriodData.previousOperatorName || 
                      operators.find(op => Number(op.id) === gracePeriodData.previousOperator)?.nome || 
                      '-')
                    : 'Não se aplica'
                } 
              />
            )}
          </div>
        </Section>

        <div className="bg-white/10 rounded-lg p-6 space-y-4 mb-8 border border-purple-400/30 shadow-lg">
          <h3 className="text-xl font-bold text-white flex items-center border-b border-purple-400/30 pb-3 mb-2">
            <FileText className="w-6 h-6 mr-3 text-purple-400" />
            Observações
          </h3>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Adicione observações se necessário"
            className="w-full px-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                     text-white placeholder:text-white/60 focus:outline-none focus:border-purple-400
                     transition-colors min-h-[120px] shadow-inner"
          />
        </div>

        <div className="flex gap-4 mt-8 mb-10">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 bg-white/10 py-4 px-6 border border-purple-400/30 rounded-lg shadow-lg text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
            disabled={isSubmitting}
          >
            ← Anterior
          </button>
          <button
            type="submit"
            className={`w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Finalizar Processo'}
          </button>
        </div>
      </form>
    </div>
  );
}
