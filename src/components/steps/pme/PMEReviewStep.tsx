import React from 'react';
import { BaseStepProps } from '../../../types/base';
import { usePMEForm, usePMECompany, usePMEContract, usePMEHolders } from '../../../contexts/pme/PMEContext';
import { useOperator, useBroker, useDocument } from '../../../hooks/base';
import { Edit2, FileText, User, Briefcase, Building, FileCheck, Clock, CreditCard, CheckCircle } from 'lucide-react';
import { WebhookService } from '../../../services/webhook/webhookService';
import { useBase } from '../../../hooks/base/useBase';

export default function PMEReviewStep({ onBack, onSubmit: propOnSubmit }: BaseStepProps) {
  const { 
    modality, 
    planName, 
    gracePeriodData, 
    operator, 
    operatorName, 
    setModality,
    setOperator,
    setOperatorName,
    setPlanName,
    setGracePeriodData
  } = usePMEForm();
  const { companyData, clearCompanyData } = usePMECompany();
  const { contractData, getContractSummary, clearContractData } = usePMEContract();
  const { holders, getTotalBeneficiaries, clearHolders } = usePMEHolders();
  const { operators } = useOperator();
  const { brokerData } = useBroker();
  const { uploadedFiles, clearAllFiles } = useDocument();
  const { setFormType } = useBase(); // Usar o contexto para resetar o formulário
  
  // Adicionar estado para controlar o envio do formulário
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Encontrar a operadora pelo ID em vez de pelo nome da modalidade
  const selectedOperator = operators.find(op => op.id === operator);
  const contractSummary = getContractSummary();
  const [observacoes, setObservacoes] = React.useState('');

  // Função para resetar todos os dados do formulário
  const resetAllData = () => {
    // Resetar dados do formulário PME
    setModality('');
    setOperator(null);
    setOperatorName('');
    setPlanName('');
    
    // Resetar dados da empresa
    clearCompanyData();
    
    // Resetar dados do contrato
    clearContractData();
    
    // Resetar titulares e dependentes
    clearHolders();
    
    // Resetar dados de carência
    setGracePeriodData({
      hasGracePeriod: false,
      previousOperator: 0,
      documents: []
    });
    
    // Limpar documentos
    clearAllFiles();
    
    // Limpar localStorage para garantir que não haja dados persistidos
    try {
      localStorage.removeItem('pmeFormData');
      localStorage.removeItem('pmeCompanyData');
      localStorage.removeItem('pmeContractData');
      localStorage.removeItem('pmeHoldersData');
      localStorage.removeItem('pmeGracePeriodData');
      localStorage.removeItem('pmeDocuments');
      
      // Remover quaisquer outros dados relacionados ao formulário PME
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('pme') || key.includes('form'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('Dados do formulário PME limpos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar dados do localStorage:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evitar múltiplos envios
    if (isSubmitting) return;
    
    // Atualizar estado para indicar que está enviando
    setIsSubmitting(true);
    
    try {
      // Log detalhado para debug
      console.log('=== Debug companyData ===');
      console.log('companyData completo:', companyData);
      console.log('companyData.responsavel:', companyData.responsavel);
      console.log('socios:', companyData.socios);
      
      // Encontrar o sócio responsável
      const socioResponsavel = companyData.socios?.find(socio => socio.isResponsavel);
      console.log('Sócio responsável:', socioResponsavel);
      
      // Preparar os dados para envio conforme a interface PMEWebhookData
      const formData = {
        formType: 'pme' as const,
        modality: modality,
        selectedOperator: operator,
        operatorName: operatorName, // Adicionar o nome da operadora
        planName: planName || '',
        brokerData: brokerData,
        contractData: contractData,
        companyData: companyData,
        gracePeriodData: gracePeriodData,
        holders: holders,
        uploadedFiles: uploadedFiles
      };

      console.log('=== Enviando Formulário PME ===');
      console.log('1. Dados do formulário preparados:', formData);
      console.log('2. Documentos incluídos:', uploadedFiles);

      // Adicionar campos temporários para passar na validação do WebhookService
      // Isso será removido quando a validação for atualizada
      const dataWithFallbacks = {
        ...formData,
        // Campos temporários para passar na validação atual
        holderData: holders.length > 0 ? {
          name: holders[0].name,
          cpf: holders[0].cpf,
          email: holders[0].email,
          phone: holders[0].phone
        } : { name: '', cpf: '', email: '', phone: '' },
        planData: {
          type: 'pme',
          modality: modality || 'saude',
          operator: operator,
          nomePlano: planName || '',
          vigencia: contractData.validityDate || new Date().toISOString().split('T')[0]
        }
      };

      await WebhookService.submit(dataWithFallbacks, operators, [], observacoes);
      
      // Limpar todos os dados após envio bem-sucedido
      resetAllData();
      
      alert('Formulário PME enviado com sucesso!');
      
      // Redirecionar para a página inicial após o envio bem-sucedido
      setFormType(''); // Usar o contexto para resetar o formulário
      
      // Chamar o onSubmit original se necessário
      if (propOnSubmit) {
        propOnSubmit(e);
      }
    } catch (error) {
      console.error('Erro detalhado:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar formulário PME');
    } finally {
      // Resetar o estado de envio, independentemente do resultado
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
      <span className="text-white font-medium">{value || '-'}</span>
    </div>
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // Verifica se a data está no formato ISO (YYYY-MM-DD)
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      
      // Verifica se a data está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        return dateString;
      }
      
      // Tenta converter de timestamp ou outro formato
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
      
      return dateString;
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return dateString || '-';
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '-';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
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
        <Section title="Corretor" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome" value={brokerData.name} />
            <Field label="CPF/CNPJ" value={formatCPF(brokerData.document)} />
            <Field label="E-mail" value={brokerData.email} />
            <Field label="WhatsApp" value={formatWhatsApp(brokerData.whatsapp)} />
            <Field label="Equipe" value={brokerData.equipe_nome} />
          </div>
        </Section>

        <Section title="Plano" icon={CreditCard}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Modalidade" value={
              modality === 'saude' ? 'Saúde' :
              modality === 'odonto' ? 'Odontológico' :
              modality === 'saude_odonto' ? 'Saúde + Odontológico' : 
              modality || '-'
            } />
            <Field label="Operadora" value={operatorName || '-'} />
            

          </div>
          
          {selectedOperator && (
            <div className="mt-4 pt-4 border-t border-purple-400/30 bg-white/5 p-4 rounded-lg">
              <div className="flex items-center">
                {selectedOperator.logo_url && (
                  <div className="mr-4 flex-shrink-0 bg-white/80 p-2 rounded-lg shadow-md">
                    <img 
                      src={selectedOperator.logo_url} 
                      alt={`Logo ${selectedOperator.nome}`}
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-medium text-white">{operatorName}</h4>
                  <p className="text-purple-300 text-sm">
                    {selectedOperator.operadora ? 'Operadora de Saúde' : 'Administradora de Benefícios'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section title="Contrato" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tipo" value={contractSummary.type} />
            <Field label="Coparticipação" value={contractSummary.coparticipation} />
            <Field label="Valor Total Contrato" value={contractSummary.value} />
            <Field label="Data da Vigência" value={formatDate(contractSummary.validityDate)} />
          </div>
        </Section>

        <Section title="Empresa" icon={Building}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="CNPJ" value={formatCNPJ(companyData.cnpj)} />
            <Field label="Razão Social" value={companyData.razaoSocial} />
            <Field label="Nome Fantasia" value={companyData.nomeFantasia} />
            <Field label="Data de Abertura" value={formatDate(companyData.dataAbertura)} />
            <Field label="Natureza Jurídica" value={companyData.naturezaJuridica} />
            <Field label="CNAE" value={companyData.cnae} />
            <Field label="Descrição CNAE" value={companyData.cnaeDescricao} />
          </div>

          <div className="mt-4 pt-4 border-t border-purple-400/30">
            <h4 className="text-lg font-medium text-white mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Endereço
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Logradouro" value={`${companyData.tipoLogradouro} ${companyData.logradouro}, ${companyData.numero}`} />
              <Field label="Complemento" value={companyData.complemento} />
              <Field label="Bairro" value={companyData.bairro} />
              <Field label="CEP" value={companyData.cep} />
              <Field label="Cidade" value={companyData.cidade} />
              <Field label="UF" value={companyData.uf} />
            </div>
          </div>
        </Section>

        {companyData.responsavel && (
          <Section title="Responsável" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome" value={companyData.responsavel.nome} />
              <Field label="E-mail" value={companyData.responsavel.email} />
              <Field label="Telefone" value={formatPhone(companyData.responsavel.telefone)} />
            </div>
          </Section>
        )}

        {(companyData.socios ?? []).length > 0 && (
          <Section title="Sócios" icon={Briefcase}>
            {(companyData.socios ?? []).map((socio, index) => (
              <div key={index} className="border-t border-purple-400/30 pt-4 mt-4 first:border-0 first:pt-0 first:mt-0">
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white mr-2 text-sm">
                    {index + 1}
                  </span>
                  Sócio {socio.isResponsavel && <span className="text-sm font-normal bg-purple-500/50 px-2 py-0.5 rounded-full text-white ml-2">(Responsável)</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nome" value={socio.nome} />
                  <Field label="E-mail" value={socio.email} />
                  <Field label="Telefone" value={formatPhone(socio.telefone)} />
                  <Field label="Incluir como Titular" value={socio.incluirComoTitular ? 'Sim' : 'Não'} />
                </div>
              </div>
            ))}
          </Section>
        )}

        {gracePeriodData && (
          <Section title="Carência" icon={Clock}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Possui carência de outra operadora" value={gracePeriodData.hasGracePeriod ? 'Sim' : 'Não'} />
              {gracePeriodData.hasGracePeriod && (
                <>
                  <Field label="Operadora anterior" value={gracePeriodData.previousOperatorName || '-'} />
                  <div className="col-span-2">
                    
                  </div>
                </>
              )}
            </div>
          </Section>
        )}

        <Section title="Beneficiários" icon={User}>
          <div className="bg-gradient-to-r from-purple-600/20 to-violet-600/20 px-4 py-3 rounded-lg mb-6 border border-purple-500/30">
            <div className="text-sm">
              <p className="font-medium text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Total de Beneficiários: <span className="ml-1 text-lg font-bold text-purple-300">{getTotalBeneficiaries()}</span>
              </p>
            </div>
          </div>

          {holders.map((holder, index) => (
            <div key={index} className="border-t border-purple-400/30 pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center bg-gradient-to-r from-purple-700/50 to-violet-700/50 p-3 rounded-lg">
                <User className="w-5 h-5 mr-2 text-purple-300" />
                Titular {index + 1} - {holder.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome" value={holder.name} />
                <Field label="CPF" value={formatCPF(holder.cpf)} />
                <Field label="Data de Nascimento" value={formatDate(holder.birthDate)} />
                <Field label="E-mail" value={holder.email} />
                <Field label="Telefone" value={formatPhone(holder.phone)} />
              </div>

              {holder.dependents.length > 0 && (
                <div className="mt-6 bg-white/5 p-4 rounded-lg">
                  <h5 className="text-md font-medium text-white mb-4 flex items-center border-b border-purple-400/30 pb-2">
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Dependentes <span className="bg-purple-500/50 text-white text-xs px-2 py-0.5 rounded-full ml-2">{holder.dependents.length}</span>
                  </h5>
                  {holder.dependents.map((dependent, depIndex) => (
                    <div key={depIndex} className="pl-4 border-l-2 border-purple-500/50 mt-3 ml-2 pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Nome" value={dependent.name} />
                        <Field label="CPF" value={formatCPF(dependent.cpf)} />
                        <Field label="Data de Nascimento" value={formatDate(dependent.birthDate)} />
                        <Field label="Parentesco" value={translateRelationship(dependent.relationship)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>

        <Section title="Documentos" icon={FileCheck}>
          {Object.entries(uploadedFiles).map(([key, files]) => {
            if (files.length === 0) return null;
            
            const sectionTitles: Record<string, string> = {
              company: 'Documentos da Empresa',
              beneficiaries: 'Documentos dos Beneficiários',
              quotation: 'Cotação',
              grace: 'Documentos de Carência'
            };
            
            return (
              <div key={key} className="mb-5 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-all">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center border-b border-purple-400/30 pb-2">
                  <FileText className="w-5 h-5 mr-2 text-purple-400" />
                  {sectionTitles[key] || key}
                </h4>
                <ul className="list-none pl-2">
                  {files.map((file, idx) => (
                    <li key={idx} className="text-white py-1 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
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
