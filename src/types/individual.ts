import { Operator, Supervisor, BrokerData, GracePeriodData } from './base';

export type IndividualType = 'individual' | 'adhesion';
export type Accommodation = 'private' | 'shared' | 'nursery';

export interface Administrator {
  id: string;
  nome: string;
  administradora_id: number;
  logo_url: string | null;
  status: boolean;
}

export interface BasePlanData {
  operator: Operator | null;
  productCode: string;
  productName: string;
  price: number;
}

export interface IndividualPlanData extends Omit<BasePlanData, 'operator'> {
  nomePlano: string;
  vigencia: string;
  operator: Operator | null | number;
  operatorName?: string; // Nome da operadora selecionada
  planName: string;
  coparticipation: boolean | string;
  value: number;
  administrator: Administrator | string | number;
  association: string;
  type: string;
  modality: string;
  accommodation: string;
  validity: string;
  coverage: string;
  network: string;
  region: string;
}

export enum Gender {
  MALE = 'M',
  FEMALE = 'F'
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  SEPARATED = 'SEPARATED'
}

export interface DatastoneAddress {
  id: string;
  type: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  selected?: boolean;
  district?: string;
  postal_code?: string;
  priority?: number;
}

export interface DatastonePhone {
  id: string;
  selected: boolean;
  number: string;
  type: 'MOBILE' | 'LANDLINE';
  ddd?: string;
  formattedNumber?: string;
}

export interface DatastoneEmail {
  id: string;
  selected: boolean;
  address: string;
  type: string;
}

export interface IndividualHolderData {
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  motherName: string;
  email: string;
  phone: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  profession?: string;
  income?: number;
  phones: DatastonePhone[];
  emails: DatastoneEmail[];
  addresses: DatastoneAddress[];
  additionalPhones: DatastonePhone[];
  additionalEmails: DatastoneEmail[];
}

export interface ContactData {
  main: {
    phone: DatastonePhone | null;
    email: DatastoneEmail | null;
  };
  additional: {
    phones: DatastonePhone[];
    emails: DatastoneEmail[];
  };
}

export interface IndividualDependentData {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  relationship: string;
  rg?: string;
  gender?: 'M' | 'F';
  maritalStatus?: string;
}

export interface IndividualFormData {
  step: string;
  planData: IndividualPlanData;
  holderData: IndividualHolderData;
  dependents: IndividualDependentData[];
  gracePeriodData: GracePeriodData;
  brokerData: BrokerData;
  selectedSupervisor: Supervisor | null;
}

// Utilitários de tipo para conversões
export type StringOrBoolean = string | boolean;
export type StringOrNumber = string | number;
export type StringOrAdministrator = string | Administrator;
export type OperatorOrNumber = Operator | number | null;
