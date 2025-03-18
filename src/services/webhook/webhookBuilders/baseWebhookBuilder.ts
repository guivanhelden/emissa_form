import { BrokerData, Operator, Supervisor } from '../../../types/base';

export abstract class BaseWebhookBuilder {
  protected params: URLSearchParams;
  protected operators: Operator[];
  protected supervisors: Supervisor[];
  protected formData: Record<string, any> = {};

  constructor(
    protected data: any,
    operators: Operator[],
    supervisors: Supervisor[]
  ) {
    this.params = new URLSearchParams();
    this.operators = operators;
    this.supervisors = supervisors;
  }

  protected buildBrokerParams(brokerData: BrokerData): void {
    this.formData.broker = {
      document: brokerData.document,
      name: brokerData.name,
      email: brokerData.email,
      whatsapp: brokerData.whatsapp,
      id: brokerData.id?.toString() || '',
      supervisor: {
        name: brokerData.equipe_nome || ''
      }
    };
  }

  protected buildGracePeriodParams(hasGracePeriod: boolean, previousOperator?: number): void {
    this.formData.gracePeriod = {
      hasGracePeriod,
      previousOperator: hasGracePeriod && previousOperator ? {
        id: previousOperator.toString(),
        name: this.operators.find(op => op.id === previousOperator)?.nome || ''
      } : null
    };
  }

  protected buildUploadedFilesParams(files: Record<string, Array<{ url: string; name: string }>>): void {
    this.formData.files = Object.entries(files).reduce((acc, [section, sectionFiles]) => {
      acc[section] = sectionFiles.map((file, index) => ({
        url: file.url,
        name: file.name,
        order: index + 1
      }));
      return acc;
    }, {} as Record<string, any>);
  }

  protected buildOperatorParams(operatorId: number, operatorName?: string): void {
    this.formData.operator = {
      id: operatorId.toString(),
      name: operatorName || this.operators.find(op => op.id === operatorId)?.nome || ''
    };
  }

  protected addObservations(observacoes?: string): void {
    if (observacoes) {
      this.formData.observations = observacoes;
    }
  }

  protected convertFormDataToParams(): void {
    console.log('Debug - Iniciando conversão de formData para params');
    
    const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
      if (!obj || typeof obj !== 'object') {
        return {};
      }

      return Object.keys(obj).reduce((acc: Record<string, string>, key: string) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;

        // Se já for uma chave com prefixo (contém underscore), mantém a estrutura
        if (key.includes('_')) {
          acc[key] = value.toString();
          return acc;
        }

        if (value === null || value === undefined) {
          return acc;
        }

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              Object.assign(acc, flattenObject(item, `${newKey}_${index + 1}`));
            } else {
              acc[`${newKey}_${index + 1}`] = item.toString();
            }
          });
        } else if (typeof value === 'object') {
          Object.assign(acc, flattenObject(value, newKey));
        } else {
          acc[newKey] = value.toString();
        }

        return acc;
      }, {});
    };

    try {
      console.log('Debug - Estrutura antes do flatten:', this.formData);
      const flatParams = flattenObject(this.formData);
      console.log('Debug - Estrutura após flatten:', flatParams);

      // Limpa os parâmetros existentes
      this.params = new URLSearchParams();

      // Adiciona os novos parâmetros
      Object.entries(flatParams).forEach(([key, value]) => {
        if (key && value) {
          this.params.append(key, value);
        }
      });

      console.log('Debug - Parâmetros finais:', 
        Array.from(this.params.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join('\n')
      );
    } catch (error) {
      console.error('Erro na conversão:', error);
      throw new Error(`Erro ao converter dados: ${error.message}`);
    }
  }

  abstract build(observacoes?: string): URLSearchParams;
}
