import { ReactNode } from 'react';

export type FormType = 'individual' | 'pme';

export type StepType = 
  | 'initial'
  | 'broker'
  | 'modality'
  | 'plan'
  | 'holder'
  | 'dependents'
  | 'address'
  | 'grace'
  | 'documents'
  | 'review'
  | 'contract'
  | 'company'
  | 'holders';

export interface BaseStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export interface GracePeriodData {
  hasGracePeriod: boolean;
  previousOperator: number | null;
  previousOperatorName?: string;
  documents?: UploadedFile[];
}

export interface BrokerData {
  id?: number | null;
  document: string;
  name: string;
  email: string;
  whatsapp: string;
  equipe_nome: string;
}

export interface Operator {
  id: number;
  nome: string;
  sku_op_adm: string;
  categoria_id: number;
  logo_url: string | null;
  categoria: string;
  operadora: boolean;
}

export interface Supervisor {
  id: number;
  equipe_nome: string;
}

export interface UploadedFile {
  url: string;
  name: string;
}

export interface UploadedFiles {
  [key: string]: UploadedFile[];
  company: UploadedFile[];
  grace: UploadedFile[];
  beneficiaries: UploadedFile[];
  quotation: UploadedFile[];
  additional: UploadedFile[];
}

export interface BaseContextData {
  formType: FormType | null;
  setFormType: (type: FormType | null) => void;
  step: StepType;
  setStep: (step: StepType) => void;
  operators: Operator[];
  setOperators: (data: Operator[]) => void;
  brokerData: BrokerData;
  setBrokerData: (data: BrokerData | ((prev: BrokerData) => BrokerData)) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (total: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  submitForm: (type: FormType, observacoes?: string) => Promise<void>;
}

export interface BaseProviderProps {
  children: ReactNode;
}

export interface BaseContextProps extends BaseProviderProps {
  formType?: FormType;
}
