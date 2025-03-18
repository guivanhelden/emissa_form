import React, { createContext, useContext, useState } from 'react';
import { CompanyData } from '../../types/pme';

interface PMECompanyContextData {
  companyData: CompanyData;
  setCompanyData: (data: CompanyData) => void;
  updateCompanyField: <K extends keyof CompanyData>(field: K, value: CompanyData[K]) => void;
  updateResponsavelField: <K extends keyof CompanyData['responsavel']>(
    field: K,
    value: CompanyData['responsavel'][K]
  ) => void;
  addSocio: (socio: { nome: string; cpf: string; participacao: string; isResponsavel: boolean; email: string; telefone: string; incluirComoTitular?: boolean }) => void;
  removeSocio: (index: number) => void;
  updateSocio: (index: number, socio: { nome: string; cpf: string; participacao: string; isResponsavel: boolean; email: string; telefone: string; incluirComoTitular?: boolean }) => void;
  clearCompanyData: () => void;
  isCompanyDataValid: () => boolean;
}

interface PMECompanyProviderProps {
  children: React.ReactNode;
}

const PMECompanyContext = createContext<PMECompanyContextData | undefined>(undefined);

export function PMECompanyProvider({ children }: PMECompanyProviderProps) {
  const [companyData, setCompanyData] = useState<CompanyData>({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    dataAbertura: '',
    naturezaJuridica: '',
    situacaoCadastral: '',
    cnae: '',
    cnaeDescricao: '',
    isMEI: false,
    // Endereço
    tipoLogradouro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    uf: '',
    cidade: '',
    socios: [],
  });

  const updateCompanyField = <K extends keyof CompanyData>(field: K, value: CompanyData[K]) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateResponsavelField = <K extends keyof CompanyData['responsavel']>(
    field: K,
    value: CompanyData['responsavel'][K]
  ) => {
    setCompanyData(prev => ({
      ...prev,
      responsavel: {
        ...prev.responsavel,
        [field]: value,
      },
    }));
  };

  const addSocio = (socio: { nome: string; cpf: string; participacao: string; isResponsavel: boolean; email: string; telefone: string; incluirComoTitular?: boolean }) => {
    setCompanyData(prev => ({
      ...prev,
      socios: [...(prev.socios || []), socio],
    }));
  };

  const removeSocio = (index: number) => {
    setCompanyData(prev => ({
      ...prev,
      socios: prev.socios ? prev.socios.filter((_, i) => i !== index) : [],
    }));
  };

  const updateSocio = (index: number, socio: { nome: string; cpf: string; participacao: string; isResponsavel: boolean; email: string; telefone: string; incluirComoTitular?: boolean }) => {
    setCompanyData(prev => ({
      ...prev,
      socios: prev.socios ? prev.socios.map((s, i) => (i === index ? socio : s)) : [],
    }));
  };

  const clearCompanyData = () => {
    setCompanyData({
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      dataAbertura: '',
      naturezaJuridica: '',
      situacaoCadastral: '',
      cnae: '',
      cnaeDescricao: '',
      isMEI: false,
      // Endereço
      tipoLogradouro: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cep: '',
      uf: '',
      cidade: '',
      socios: [],
    });
  };

  const isCompanyDataValid = (): boolean => {
    const {
      cnpj,
      razaoSocial,
    } = companyData;

    // Verifica se todos os campos obrigatórios estão preenchidos
    return !!(
      cnpj &&
      razaoSocial
    );
  };

  return (
    <PMECompanyContext.Provider
      value={{
        companyData,
        setCompanyData,
        updateCompanyField,
        updateResponsavelField,
        addSocio,
        removeSocio,
        updateSocio,
        clearCompanyData,
        isCompanyDataValid,
      }}
    >
      {children}
    </PMECompanyContext.Provider>
  );
}

export function usePMECompany() {
  const context = useContext(PMECompanyContext);
  if (!context) {
    throw new Error('usePMECompany must be used within a PMECompanyProvider');
  }
  return context;
}
