import { BaseWebhookBuilder } from './baseWebhookBuilder';
import { CompanyData, ContractData, Holder } from '../../../types/pme';
import { BrokerData, GracePeriodData, Operator, Supervisor, UploadedFiles } from '../../../types/base';

interface PMEWebhookData {
  formType: 'pme';
  modality: string | null;
  selectedOperator: number | null;
  planName: string;
  brokerData: BrokerData;
  contractData: ContractData;
  companyData: CompanyData;
  gracePeriodData: GracePeriodData;
  holders: Holder[];
  uploadedFiles: UploadedFiles;
  operatorName?: string;
}

export class PMEWebhookBuilder extends BaseWebhookBuilder {
  constructor(
    protected data: PMEWebhookData,
    operators: Operator[],
    supervisors: Supervisor[]
  ) {
    super(data, operators, supervisors);
  }

  private buildPlanParams(): void {
    // Dados do plano
    this.params.append('plan_type', 'pme');
    this.params.append('plan_modality', this.data.modality || 'health');
    this.params.append('plan_name', this.data.planName || '');
    
    // Traduzir a coparticipação para português
    let coparticipation = this.data.contractData.coparticipation || '';
    if (coparticipation === 'full') {
      coparticipation = 'sim_completa';
    } else if (coparticipation === 'partial') {
      coparticipation = 'sim_parcial';
    } else if (coparticipation === 'none') {
      coparticipation = 'nao';
    }
    
    this.params.append('plan_coparticipation', coparticipation);
    this.params.append('plan_value', this.data.contractData.value.toString());
    this.params.append('plan_vigencia', this.data.contractData.validityDate || new Date().toISOString().split('T')[0]);
    
    // Adicionar operadora se existir
    if (this.data.selectedOperator) {
      // Usar o operatorName do contexto se disponível
      const operatorName = this.data.operatorName || '';
      
      // Usar o formato correto para criar a estrutura aninhada
      this.params.append('operator_id', String(this.data.selectedOperator));
      this.params.append('operator_name', operatorName);
    }
  }

  private buildCompanyParams(): void {
    const { companyData } = this.data;
    
    this.params.append('company_cnpj', companyData.cnpj);
    this.params.append('company_name', companyData.razaoSocial);
    this.params.append('company_fantasyName', companyData.nomeFantasia);
    this.params.append('company_openDate', companyData.dataAbertura);
    this.params.append('company_cnae', companyData.cnae);
    this.params.append('company_cnaeDescricao', companyData.cnaeDescricao);
    this.params.append('company_naturezaJuridica', companyData.naturezaJuridica);
    this.params.append('company_natureza_juridica_nome', companyData.natureza_juridica_nome);
    this.params.append('company_situacaoCadastral', companyData.situacaoCadastral);
    this.params.append('company_isMEI', companyData.isMEI ? 'true' : 'false');
    this.params.append('company_city', companyData.cidade);
    
    // Endereço da empresa
    this.params.append('company_address_cep', companyData.cep || '');
    this.params.append('company_address_street', companyData.logradouro || '');
    this.params.append('company_address_number', companyData.numero || '');
    this.params.append('company_address_complement', companyData.complemento || '');
    this.params.append('company_address_neighborhood', companyData.bairro || '');
    this.params.append('company_address_city', companyData.cidade || '');
    this.params.append('company_address_state', companyData.uf || '');

    // Dados dos sócios
    if (companyData.socios && companyData.socios.length > 0) {
      companyData.socios.forEach((socio, index) => {
        this.params.append(`company_socio_${index + 1}_nome_socio`, socio.nome);
      });
    }
    
    // Dados do responsável
    // Verificar se responsavel existe
    if (companyData.responsavel) {
      this.params.append('responsible_name', companyData.responsavel.nome);
      this.params.append('responsible_email', companyData.responsavel.email);
      this.params.append('responsible_phone', companyData.responsavel.telefone);
    } 
    // Se não existir, procurar um sócio responsável
    else if (companyData.socios && companyData.socios.length > 0) {
      const socioResponsavel = companyData.socios.find(socio => socio.isResponsavel);
      
      if (socioResponsavel) {
        this.params.append('responsible_name', socioResponsavel.nome || '');
        this.params.append('responsible_email', socioResponsavel.email || '');
        this.params.append('responsible_phone', socioResponsavel.telefone || '');
      } else {
        // Usar o primeiro sócio se nenhum for marcado como responsável
        this.params.append('responsible_name', companyData.socios[0].nome || '');
        this.params.append('responsible_email', companyData.socios[0].email || '');
        this.params.append('responsible_phone', companyData.socios[0].telefone || '');
      }
    } 
    // Se não houver nem responsável nem sócios, usar valores vazios
    else {
      this.params.append('responsible_name', '');
      this.params.append('responsible_email', '');
      this.params.append('responsible_phone', '');
    }
  }

  private buildContractParams(): void {
    const { contractData } = this.data;
    
    // Traduzir o tipo de contrato para português
    let contractType = contractData.type;
    if (contractType === 'compulsory') {
      contractType = 'compulsorio';
    } else if (contractType === 'optional') {
      contractType = 'livre_adesao';
    } else if (contractType === 'undefined') {
      contractType = 'indefinido';
    }
    
    // Traduzir a coparticipação para português
    let coparticipation = contractData.coparticipation;
    if (coparticipation === 'full') {
      coparticipation = 'sim_completa';
    } else if (coparticipation === 'partial') {
      coparticipation = 'sim_parcial';
    } else if (coparticipation === 'none') {
      coparticipation = 'nao';
    }
    
    this.params.append('contract_type', contractType);
    this.params.append('contract_coparticipation', coparticipation);
    this.params.append('contract_value', contractData.value.toString());
  }

  private buildBrokerParams(): void {
    const { brokerData } = this.data;
    
    // Adicionar o ID do corretor aos parâmetros
    if (brokerData.id) {
      this.params.append('broker_id', String(brokerData.id));
    }
    
    this.params.append('broker_cpf', brokerData.document || '');
    this.params.append('broker_name', brokerData.name || '');
    this.params.append('broker_email', brokerData.email || '');
    this.params.append('broker_whatsapp', brokerData.whatsapp || '');
    this.params.append('broker_team', brokerData.equipe_nome || '');
  }

  private buildHoldersParams(): void {
    const { holders } = this.data;
    
    holders.forEach((holder, index) => {
      const holderPrefix = index === 0 ? 'holder' : `holder_${index + 1}`;
  
      // Dados pessoais do titular
      this.params.append(`${holderPrefix}_name`, holder.name);
      this.params.append(`${holderPrefix}_cpf`, holder.cpf);
      this.params.append(`${holderPrefix}_birthDate`, holder.birthDate);
  
      // Contato do titular
      this.params.append(`${holderPrefix}_contact_email`, holder.email);
      this.params.append(`${holderPrefix}_contact_phone`, holder.phone);
  
      // Dependentes do titular específico
      if (holder.dependents && holder.dependents.length > 0) {
        holder.dependents.forEach((dependent, dIndex) => {
          this.params.append(`${holderPrefix}_dependent_${dIndex + 1}_order`, (dIndex + 1).toString());
          this.params.append(`${holderPrefix}_dependent_${dIndex + 1}_cpf`, dependent.cpf);
          this.params.append(`${holderPrefix}_dependent_${dIndex + 1}_name`, dependent.name);
          this.params.append(`${holderPrefix}_dependent_${dIndex + 1}_birthDate`, dependent.birthDate);
          this.params.append(`${holderPrefix}_dependent_${dIndex + 1}_relationship`, dependent.relationship);
        });
      }
    });
  }
  

  private buildGracePeriodParams(): void {
    const { gracePeriodData } = this.data;
    
    this.params.append('gracePeriod_hasGracePeriod', gracePeriodData?.hasGracePeriod ? 'true' : 'false');
    if (gracePeriodData?.hasGracePeriod) {
      console.log('[PMEWebhookBuilder] Operadora anterior ID:', gracePeriodData.previousOperator);
      
      // Usar o previousOperatorName do gracePeriodData se disponível
      const previousOperatorName = gracePeriodData.previousOperatorName || '';
      
      this.params.append('gracePeriod_previousOperator', String(gracePeriodData.previousOperator));
      this.params.append('gracePeriod_previousOperatorName', previousOperatorName);
      
      console.log('[PMEWebhookBuilder] Operadora anterior:', {
        id: gracePeriodData.previousOperator,
        name: previousOperatorName
      });
    }
  }

  private buildUploadedFilesParams(): void {
    const { uploadedFiles } = this.data;
    
    if (uploadedFiles) {
      Object.entries(uploadedFiles).forEach(([section, files]) => {
        if (Array.isArray(files)) {
          files.forEach((file, index) => {
            this.params.append(`files_${section}_${index + 1}_url`, file.url || '');
            this.params.append(`files_${section}_${index + 1}_name`, file.name || '');
          });
        }
      });
    }
  }

  build(observacoes?: string): URLSearchParams {
    console.log('[PMEWebhookBuilder] Iniciando build do webhook');
    console.log('=== Construindo Webhook PME ===');
    
    // Dados básicos
    this.params.append('formType', this.data.formType);
    
    // Construir parâmetros em ordem hierárquica
    this.buildPlanParams();
    this.buildBrokerParams();
    this.buildCompanyParams();
    this.buildContractParams();
    this.buildHoldersParams();
    this.buildGracePeriodParams();
    this.buildUploadedFilesParams();
    
    // Observações
    if (observacoes) {
      this.params.append('observations', observacoes);
    }

    console.log('[PMEWebhookBuilder] Parâmetros finais:', Array.from(this.params.entries()));
    return this.params;
  }
}
