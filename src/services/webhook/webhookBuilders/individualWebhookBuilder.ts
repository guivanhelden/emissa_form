// individualWebhookBuilder.ts
import { BaseWebhookBuilder } from './baseWebhookBuilder';
import { IndividualWebhookData } from '../types/individual';
import { Operator, Supervisor } from '../types/base';

export class IndividualWebhookBuilder extends BaseWebhookBuilder {
  private data: any;
  private params: URLSearchParams;

  constructor(data: any) {
    super();
    this.data = data;
    this.params = new URLSearchParams();
    console.log('[IndividualWebhookBuilder] Construtor - dados recebidos:', data);
  }

  protected validatePlanData(): void {
    const { planData } = this.data;
    
    if (!planData) {
      throw new Error('Dados do plano não fornecidos');
    }

    // Validar campos obrigatórios
    if (!planData.type) {
      throw new Error('Tipo do plano não informado');
    }
    if (!planData.modality) {
      throw new Error('Modalidade não informada');
    }
    if (!planData.operator) {
      throw new Error('Operadora não informada');
    }
    if (!planData.accommodation) {
      throw new Error('Acomodação não informada');
    }
    if (!planData.nomePlano) {
      throw new Error('Nome do plano não informado');
    }
    if (!planData.vigencia) {
      throw new Error('Vigência não informada');
    }

    // Validações específicas para planos de adesão
    if (planData.type === 'adhesion' && !planData.administrator) {
      throw new Error('Administradora é obrigatória para planos de adesão');
    }
  }

  private buildPlanParams(): void {
    const planData = this.data.planData;

    // Tradução dos valores para português
    const translateModality = (modality: string): string => {
      const translations: Record<string, string> = {
        'health': 'saúde',
        'dental': 'odontológico',
        'both': 'saúde e odontológico'
      };
      return translations[modality] || modality;
    };

    const translateAccommodation = (accommodation: string): string => {
      const translations: Record<string, string> = {
        'private': 'apartamento',
        'shared': 'enfermaria',
        'nursery': 'berçário'
      };
      return translations[accommodation] || accommodation;
    };

    const translateCoparticipation = (coparticipacao: string | boolean): string => {
      if (typeof coparticipacao === 'boolean') {
        return coparticipacao ? 'sim' : 'não';
      }
      
      const translations: Record<string, string> = {
        'completa': 'sim completa',
        'parcial': 'sim parcial',
        'nao': 'não',
        'true': 'sim',
        'false': 'não'
      };
      return translations[coparticipacao] || coparticipacao;
    };

    // Dados do plano
    this.params.append('plan_type', planData.type || 'individual');
    this.params.append('plan_modality', translateModality(planData.modality || 'health'));
    this.params.append('plan_accommodation', translateAccommodation(planData.accommodation || 'private'));
    this.params.append('plan_validity', planData.vigencia || '');
    this.params.append('plan_administratorid', planData.administradora_id || '');
    this.params.append('plan_administrator', planData.administrator.nome || '');
    this.params.append('plan_association', planData.association || '');
    this.params.append('plan_name', planData.nomePlano || '');
    this.params.append('plan_coparticipation', translateCoparticipation(planData.coparticipation || ''));
    this.params.append('plan_value', planData.value ? planData.value : '0');

    // Adicionar operadora se existir
    if (planData.operator) {
      this.buildOperatorParams(planData.operator, planData.operatorName);
    }
  }

  private buildOperatorParams(operatorId: number | string, operatorName: string): void {
    this.params.append('operator_id', String(operatorId));
    this.params.append('operator_name', operatorName || '');
  }

  private buildBrokerParams(): void {
    const { brokerData } = this.data;
    
    this.params.append('broker_cpf', brokerData.document || '');
    this.params.append('broker_name', brokerData.name || '');
    this.params.append('broker_email', brokerData.email || '');
    this.params.append('broker_whatsapp', brokerData.whatsapp || '');
    this.params.append('broker_team', brokerData.equipe_nome || '');
  }

  private buildContactData(holderData: any): any {
    console.log('[IndividualWebhookBuilder] Dados de contato recebidos:', {
      phone: holderData.phone,
      email: holderData.email,
      phones: holderData.phones,
      emails: holderData.emails,
      additionalPhones: holderData.additionalPhones
    });

    const contact: any = {
      phone: holderData.phone || '',
      email: holderData.email || '',
      additionalPhones: {},
      additionalEmails: {}
    };

    // Busca por telefones e emails selecionados
    const selectedPhones = holderData.phones?.filter((p: any) => p.selected) || [];
    const selectedEmails = holderData.emails?.filter((e: any) => e.selected) || [];
    
    console.log('[IndividualWebhookBuilder] Telefones selecionados:', selectedPhones);
    console.log('[IndividualWebhookBuilder] Emails selecionados:', selectedEmails);

    // Define o telefone principal como o primeiro telefone selecionado
    if (selectedPhones.length > 0) {
      const mainPhone = selectedPhones[0];
      contact.phone = mainPhone.formattedNumber || `(${mainPhone.ddd}) ${mainPhone.number}`;
    } else if (!contact.phone && holderData.phone) {
      // Fallback para o campo phone padrão se não houver telefone selecionado
      contact.phone = holderData.phone;
    }

    // Define o email principal como o primeiro email selecionado
    if (selectedEmails.length > 0) {
      const mainEmail = selectedEmails[0];
      contact.email = mainEmail.address;
    } else if (!contact.email && holderData.email) {
      // Fallback para o campo email padrão se não houver email selecionado
      contact.email = holderData.email;
    }

    // Um telefone é válido se tiver o formato completo: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    const isValidPhone = (phone: string) => {
      return phone && phone.match(/^\(\d{2}\) \d{4,5}-\d{4}$/);
    };

    // Adiciona telefones adicionais selecionados (a partir do segundo)
    if (selectedPhones.length > 1) {
      const additionalSelectedPhones = selectedPhones.slice(1);
      
      additionalSelectedPhones
        .map((p: any) => p.formattedNumber || `(${p.ddd}) ${p.number}`)
        .filter((phone: string) => isValidPhone(phone))
        .forEach((phone: string, index: number) => {
          contact.additionalPhones[(index + 1).toString()] = phone;
        });
    }

    // Adiciona emails adicionais selecionados (a partir do segundo)
    if (selectedEmails.length > 1) {
      const additionalSelectedEmails = selectedEmails.slice(1);
      
      additionalSelectedEmails
        .map((e: any) => e.address)
        .filter((email: string) => email && email.includes('@'))
        .forEach((email: string, index: number) => {
          contact.additionalEmails[(index + 1).toString()] = email;
        });
    }

    console.log('[IndividualWebhookBuilder] Dados de contato formatados:', contact);
    return contact;
  }

  private buildHolderParams(): void {
    const holder = this.data.holderData;
    const contact = this.buildContactData(holder);

    // Dados pessoais
    this.params.append('holder_name', holder.name || '');
    this.params.append('holder_cpf', holder.cpf || '');
    this.params.append('holder_rg', holder.rg || '');
    this.params.append('holder_birthDate', holder.birthDate || '');
    this.params.append('holder_gender', holder.gender || '');
    this.params.append('holder_maritalStatus', holder.maritalStatus || '');
    this.params.append('holder_motherName', holder.motherName || '');
    this.params.append('holder_fatherName', holder.fatherName || '');
    this.params.append('holder_profession', holder.profession || '');
    this.params.append('holder_income', holder.income || '');
    this.params.append('holder_pep', holder.pep ? 'true' : 'false');

    // Contatos
    this.params.append('holder_contact_phone', contact.phone || '');
    this.params.append('holder_contact_email', contact.email || '');

    // Contatos adicionais
    Object.entries(contact.additionalPhones).forEach(([key, value]) => {
      this.params.append(`holder_contact_additionalPhones_${key}`, value || '');
    });

    Object.entries(contact.additionalEmails).forEach(([key, value]) => {
      this.params.append(`holder_contact_additionalEmails_${key}`, value || '');
    });

    // Endereço
    // Verifica se existe endereço no formato de objeto ou no array addresses
    if (holder.address) {
      this.params.append('holder_address_cep', holder.address.cep || '');
      this.params.append('holder_address_street', holder.address.street || '');
      this.params.append('holder_address_number', holder.address.number || '');
      this.params.append('holder_address_complement', holder.address.complement || '');
      this.params.append('holder_address_neighborhood', holder.address.neighborhood || '');
      this.params.append('holder_address_city', holder.address.city || '');
      this.params.append('holder_address_state', holder.address.state || '');
    } 
    // Verifica se existem endereços no array e usa o endereço selecionado
    else if (holder.addresses && holder.addresses.length > 0) {
      // Procura o endereço selecionado, ou usa o primeiro endereço da lista
      const selectedAddress = holder.addresses.find((addr: any) => addr.selected) || holder.addresses[0];
      
      if (selectedAddress) {
        this.params.append('holder_address_cep', selectedAddress.cep || selectedAddress.postal_code || '');
        this.params.append('holder_address_street', selectedAddress.street || '');
        this.params.append('holder_address_number', selectedAddress.number?.toString() || '');
        this.params.append('holder_address_complement', selectedAddress.complement || '');
        this.params.append('holder_address_neighborhood', selectedAddress.neighborhood || '');
        this.params.append('holder_address_city', selectedAddress.city || '');
        this.params.append('holder_address_state', selectedAddress.state || '');
      }
    }
    
    console.log('[IndividualWebhookBuilder] Parâmetros de endereço:', 
      Array.from(this.params.entries())
        .filter(([key]) => key.startsWith('holder_address_'))
    );
  }

  private buildDependentsParams(): void {
    const { dependents } = this.data;
    
    if (dependents && dependents.length > 0) {
      dependents.forEach((dependent, index) => {
        this.params.append(`dependents_${index + 1}_order`, (index + 1).toString());
        this.params.append(`dependents_${index + 1}_cpf`, dependent.cpf.replace(/\D/g, ''));
        this.params.append(`dependents_${index + 1}_name`, dependent.name);
        this.params.append(`dependents_${index + 1}_birthDate`, dependent.birthDate);
        this.params.append(`dependents_${index + 1}_motherName`, dependent.motherName);
        this.params.append(`dependents_${index + 1}_relationship`, dependent.relationship);
      });
    }
  }

  private buildGracePeriodParams(): void {
    const { gracePeriodData } = this.data;
    
    this.params.append('gracePeriod_hasGracePeriod', gracePeriodData?.hasGracePeriod ? 'true' : 'false');
    if (gracePeriodData?.hasGracePeriod) {
      this.params.append('gracePeriod_previousOperatorName', String(gracePeriodData.previousOperatorName || ''));
    }
  }

  private buildUploadedFilesParams(files: any): void {
    Object.entries(files).forEach(([key, value]) => {
      this.params.append(`files_${key}`, String(value));
    });
  }

  private buildDocumentParams(): void {
    // Os arquivos podem estar em diferentes locais, vamos tentar encontrá-los
    const uploadedFiles = this.data.uploadedFiles || this.data.documents || this.data.files;
    console.log('[IndividualWebhookBuilder] Tentando acessar arquivos:', {
      uploadedFiles,
      documents: this.data.documents,
      files: this.data.files
    });
    
    if (uploadedFiles) {
      // Documentos dos beneficiários
      if (uploadedFiles.beneficiaries && uploadedFiles.beneficiaries.length > 0) {
        const beneficiariesJson = JSON.stringify(
          uploadedFiles.beneficiaries.map((doc: any) => ({
            url: doc.url,
            name: doc.name
          }))
        );
        console.log('[IndividualWebhookBuilder] JSON beneficiários:', beneficiariesJson);
        this.params.append('documents_beneficiaries', beneficiariesJson);
      }

      // Documentos de cotação
      if (uploadedFiles.quotation && uploadedFiles.quotation.length > 0) {
        const quotationJson = JSON.stringify(
          uploadedFiles.quotation.map((doc: any) => ({
            url: doc.url,
            name: doc.name
          }))
        );
        console.log('[IndividualWebhookBuilder] JSON cotação:', quotationJson);
        this.params.append('documents_quotation', quotationJson);
      }

      // Documentos de carência
      if (uploadedFiles.grace && uploadedFiles.grace.length > 0) {
        const graceJson = JSON.stringify(
          uploadedFiles.grace.map((doc: any) => ({
            url: doc.url,
            name: doc.name
          }))
        );
        console.log('[IndividualWebhookBuilder] JSON carência:', graceJson);
        this.params.append('documents_grace', graceJson);
      }

      // Documentos adicionais
      if (uploadedFiles.additional && uploadedFiles.additional.length > 0) {
        const additionalJson = JSON.stringify(
          uploadedFiles.additional.map((doc: any) => ({
            url: doc.url,
            name: doc.name
          }))
        );
        console.log('[IndividualWebhookBuilder] JSON adicionais:', additionalJson);
        this.params.append('documents_additional', additionalJson);
      }
    }
    
    console.log('[IndividualWebhookBuilder] Todos os parâmetros:', 
      Array.from(this.params.entries())
        .filter(([key]) => key.startsWith('documents_'))
    );
  }

  public build(observacoes?: string): URLSearchParams {
    console.log('[IndividualWebhookBuilder] Iniciando build do webhook');
    console.log('=== Construindo Webhook ===');
    
    this.validatePlanData();
    this.buildPlanParams();
    this.buildBrokerParams();
    this.buildHolderParams();
    
    if (this.data.dependents?.length > 0) {
      this.buildDependentsParams();
    }

    if (this.data.gracePeriodData) {
      this.buildGracePeriodParams();
    }

    this.buildDocumentParams();
    
    if (observacoes) {
      this.addObservations(observacoes);
    }

    console.log('[IndividualWebhookBuilder] Parâmetros finais:', 
      Array.from(this.params.entries())
    );
    
    return this.params;
  }
}