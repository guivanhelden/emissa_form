import { BaseStepProps, GracePeriodData as BaseGracePeriodData, BrokerData, Operator, Supervisor, UploadedFile } from './base';

export interface CompanyData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  dataAbertura: string;
  naturezaJuridica: string;
  natureza_juridica_nome: string;
  situacaoCadastral: string;
  cnae: string;
  cnaeDescricao: string;
  isMEI: boolean;
  // Endereço
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  cidade: string;
  responsavel: {
    nome: string;
    email: string;
    telefone: string;
  };
  socios: {
    nome: string;
    isResponsavel: boolean;
    email?: string;
    telefone?: string;
    incluirComoTitular?: boolean;
  }[];
}

export interface GracePeriodData extends BaseGracePeriodData {
  documents: UploadedFile[];
}

export interface PMEStepProps extends BaseStepProps {
  // Adicione props específicas para os steps PME aqui
}

export type PMEFormStep =
  | 'broker'
  | 'modality'
  | 'contract'
  | 'company'
  | 'grace'
  | 'holders'
  | 'documents'
  | 'review';

export interface PMEContextData {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  modality: string | null;
  setModality: (modality: string) => void;
  selectedOperator: number | null;
  setSelectedOperator: (operatorId: number | null) => void;
  companyData: CompanyData;
  setCompanyData: (data: CompanyData) => void;
  gracePeriodData: GracePeriodData;
  setGracePeriodData: (data: GracePeriodData) => void;
  holders: Holder[];
  setHolders: (holders: Holder[]) => void;
  contractData: ContractData;
  setContractData: (data: ContractData) => void;
  planName: string;
  setPlanName: (name: string) => void;
  uploadedFiles: UploadedFiles;
  setUploadedFiles: (files: UploadedFiles) => void;
}

export interface Holder {
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
  dependents: Dependent[];
}

export interface Dependent {
  name: string;
  cpf: string;
  birthDate: string;
  relationship: string;
}

export interface ContractData {
  type: 'compulsory' | 'optional';
  coparticipation: 'none' | 'partial' | 'full';
  value: number;
  validityDate?: string;
}

export interface UploadedFiles {
  company: UploadedFile[];
  grace: UploadedFile[];
  beneficiaries: UploadedFile[];
  quotation: UploadedFile[];
}
