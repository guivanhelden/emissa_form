import { Operator, Supervisor } from '../../types/base';
import { PMEWebhookBuilder } from './webhookBuilders/pmeWebhookBuilder';
import { IndividualWebhookBuilder } from './webhookBuilders/individualWebhookBuilder';

export class WebhookService {
  private static BASE_URL = 'https://vhseguros.app.n8n.cloud/webhook/e05d9953-ac05-4ead-9792-c6c343469a15';

  private static async handleResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw new Error(`Erro na submissão do formulário: ${response.statusText}`);
    }
  }

  private static validateFormData(formData: any): void {
    if (!formData) {
      throw new Error('Dados do formulário não fornecidos');
    }

    if (!formData.formType) {
      throw new Error('Tipo de formulário não especificado');
    }

    if (!['individual', 'pme'].includes(formData.formType)) {
      throw new Error('Tipo de formulário inválido');
    }

    // Validações específicas para o tipo 'individual'
    if (formData.formType === 'individual') {
      if (!formData.holderData) {
        throw new Error('Dados do titular não fornecidos');
      }

      if (!formData.planData) {
        throw new Error('Dados do plano não fornecidos');
      }
    }
    
    // Validações específicas para o tipo 'pme'
    if (formData.formType === 'pme') {
      if (!formData.brokerData) {
        throw new Error('Dados do corretor não fornecidos');
      }
      
      if (!formData.contractData) {
        throw new Error('Dados do contrato não fornecidos');
      }
      
      if (!formData.companyData) {
        throw new Error('Dados da empresa não fornecidos');
      }
      
      if (!formData.holders) {
        throw new Error('Dados dos beneficiários não fornecidos');
      }
    }

    // Validação comum para ambos os tipos
    if (!formData.brokerData) {
      throw new Error('Dados do corretor não fornecidos');
    }
  }

  private static handleError(error: unknown): never {
    console.error('Erro ao enviar formulário:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.includes('Falha ao enviar formulário') 
        ? error.message 
        : `Falha ao enviar formulário: ${error.message}`;
      throw new Error(errorMessage);
    }
    
    throw new Error('Falha ao enviar formulário: Erro desconhecido');
  }

  static async submit(
    formData: any,
    operators: Operator[],
    supervisors: Supervisor[],
    observacoes?: string
  ): Promise<void> {
    try {
      // Extrair os arquivos do formData para evitar que sejam perdidos na estrutura
      const { uploadedFiles, documents, files, ...restFormData } = formData;
      
      // Criar uma cópia do formData com os arquivos na raiz
      const processedFormData = {
        ...restFormData,
        uploadedFiles: uploadedFiles || documents || files
      };

      console.log('[WebhookService] Iniciando submissão do formulário:', {
        processedFormData,
        uploadedFiles: processedFormData.uploadedFiles
      });
      
      // Validar dados do formulário
      this.validateFormData(processedFormData);
      
      let params: URLSearchParams;

      if (processedFormData.formType === 'pme') {
        const builder = new PMEWebhookBuilder(processedFormData, operators, supervisors);
        params = builder.build(observacoes);
      } else {
        console.log('[WebhookService] Dados antes de criar o builder:', processedFormData);
        
        const builder = new IndividualWebhookBuilder(processedFormData, operators, supervisors);
        params = builder.build(observacoes);
      }

      console.log('[WebhookService] Parâmetros gerados:', Array.from(params.entries()));

      // Converter os parâmetros para um objeto
      const requestData: Record<string, any> = {};
      params.forEach((value, key) => {
        // Verifica se é um documento JSON
        if (key.startsWith('documents_')) {
          try {
            requestData[key] = JSON.parse(value);
            console.log(`[WebhookService] Documento processado ${key}:`, requestData[key]);
          } catch (e) {
            console.error(`[WebhookService] Erro ao processar documento ${key}:`, e);
            requestData[key] = value;
          }
        } else {
          const keys = key.split('_');
          let current = requestData;
          
          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] || {};
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
        }
      });

      console.log('[WebhookService] Dados finais a serem enviados:', requestData);

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ data: requestData })
      });

      console.log('[WebhookService] Resposta do servidor:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseText = await response.text();
      console.log('[WebhookService] Corpo da resposta:', responseText);

      if (!response.ok) {
        console.error('Erro na resposta do webhook:', responseText);
        throw new Error(`Erro na submissão do formulário: ${response.statusText}. Detalhes: ${responseText}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  static buildFormData(
    formType: 'pme' | 'individual',
    data: Record<string, any>
  ): Record<string, any> {
    return {
      formType,
      ...data
    };
  }
}
