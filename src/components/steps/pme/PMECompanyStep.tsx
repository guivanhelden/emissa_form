import React, { useState } from 'react';
import { BaseStepProps } from '../../../types/base';
import { usePMECompany } from '../../../contexts/pme/PMEContext';
import { FormField } from '../../common/FormField';
import { FileText, Users, Building, MapPin, DollarSign, Calendar, CheckCircle, Mail, Phone } from 'lucide-react';

interface QSAResponse {
  identificador_de_socio: number;
  nome_socio: string;
}

interface CNPJResponse {
  razao_social: string;
  nome_fantasia: string;
  data_inicio_atividade: string;
  codigo_natureza_juridica: number;
  natureza_juridica: string;
  descricao_situacao_cadastral: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: number;
  uf: string;
  municipio: string;
  qsa: QSAResponse[];
}

export default function PMECompanyStep({ onBack, onSubmit }: BaseStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    companyData,
    updateCompanyField,
    addSocio,
    removeSocio,
    updateSocio,
    isCompanyDataValid,
  } = usePMECompany();

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/\D/g, '');
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatTelefone = (telefone: string) => {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Aplica a máscara de acordo com o padrão brasileiro
    if (numeroLimpo.length <= 10) {
      // Formato (XX) XXXX-XXXX para telefones fixos
      return numeroLimpo
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Formato (XX) XXXXX-XXXX para celulares
      return numeroLimpo
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  const handleCNPJChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cnpj = formatCNPJ(e.target.value);
    updateCompanyField('cnpj', e.target.value);
    
    if (cnpj.length === 14) {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (!response.ok) {
          throw new Error('CNPJ não encontrado');
        }
        
        const data: CNPJResponse = await response.json();
        
        // Informações Básicas
        updateCompanyField('razaoSocial', data.razao_social);
        updateCompanyField('nomeFantasia', data.nome_fantasia || '');
        updateCompanyField('dataAbertura', formatDate(data.data_inicio_atividade));
        updateCompanyField('naturezaJuridica', data.codigo_natureza_juridica.toString());
        updateCompanyField('natureza_juridica_nome', data.natureza_juridica);
        updateCompanyField('situacaoCadastral', data.descricao_situacao_cadastral);
        updateCompanyField('cnae', data.cnae_fiscal.toString());
        updateCompanyField('cnaeDescricao', data.cnae_fiscal_descricao);
        
        // Verifica se é MEI (Natureza Jurídica 2135)
        const isMEI = data.codigo_natureza_juridica === 2135;
        updateCompanyField('isMEI', isMEI);
        
        // Endereço
        updateCompanyField('tipoLogradouro', data.descricao_tipo_de_logradouro);
        updateCompanyField('logradouro', data.logradouro);
        updateCompanyField('numero', data.numero);
        updateCompanyField('complemento', data.complemento || '');
        updateCompanyField('bairro', data.bairro);
        updateCompanyField('cep', data.cep.toString());
        updateCompanyField('uf', data.uf);
        updateCompanyField('cidade', data.municipio);
        
        // Limpa a lista atual de sócios e adiciona os novos
        while (companyData.socios.length > 0) {
          removeSocio(0);
        }
        
        // Adiciona os sócios da API ou extrai da razão social se for MEI
        if (isMEI) {
          // Para MEI, extrai o nome do sócio da razão social (removendo números e pontuações iniciais)
          const nomeSocio = data.razao_social.replace(/^[\d\s.,-]+/, '').trim();
          if (nomeSocio) {
            addSocio({
              nome: nomeSocio,
              isResponsavel: true,
              incluirComoTitular: true,
            });
          }
        } else if (data.qsa && data.qsa.length > 0) {
          // Para não-MEI, adiciona os sócios da API
          data.qsa.forEach(socio => {
            addSocio({
              nome: socio.nome_socio,
              isResponsavel: false,
              incluirComoTitular: false,
            });
          });
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar dados do CNPJ');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddSocio = () => {
    addSocio({
      nome: '',
      isResponsavel: false,
      incluirComoTitular: false,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Building className="w-8 h-8 mr-3 text-purple-400" />
          Dados da Empresa
        </h2>
        <p className="text-white/80 text-lg">
          Preencha os dados da empresa
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <FileText className="w-6 h-6 mr-3 text-purple-400" />
            Informações Básicas
          </h3>
          
          <div className="space-y-6">
            <FormField label="CNPJ">
              <div className="relative">
                <input
                  type="text"
                  value={companyData.cnpj}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                  disabled={isLoading}
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                {isLoading && (
                  <p className="mt-2 text-white/80">Buscando dados...</p>
                )}
                {error && (
                  <p className="mt-2 text-red-500">{error}</p>
                )}
                {!isLoading && !error && (
                  <p className="text-sm text-red-500 mt-2 italic flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-purple-400 flex-shrink-0" />
                    Informe seu CNPJ e aguarde enquanto carregamos seus dados automaticamente.
                  </p>
                )}
              </div>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Razão Social">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.razaoSocial}
                    onChange={(e) => updateCompanyField('razaoSocial', e.target.value)}
                    placeholder="Digite a razão social"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Building className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
              <FormField label="Nome Fantasia">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.nomeFantasia}
                    onChange={(e) => updateCompanyField('nomeFantasia', e.target.value)}
                    placeholder="Digite o nome fantasia"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Building className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Data de Abertura">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.dataAbertura}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 8) {
                        const formattedValue = value
                          .replace(/(\d{2})(\d)/, '$1/$2')
                          .replace(/(\d{2})(\d)/, '$1/$2');
                        updateCompanyField('dataAbertura', formattedValue);
                      }
                    }}
                    placeholder="DD/MM/AAAA"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Calendar className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
              <FormField label="Natureza Jurídica">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.naturezaJuridica}
                    onChange={(e) => {
                      updateCompanyField('naturezaJuridica', e.target.value);
                      // Atualiza o campo isMEI se a natureza jurídica for 2135
                      updateCompanyField('isMEI', e.target.value === '2135');
                    }}
                    placeholder="Digite a natureza jurídica"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="É MEI">
                <div className="relative">
                  <div className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white flex items-center">
                    <input
                      type="checkbox"
                      checked={companyData.isMEI}
                      onChange={(e) => updateCompanyField('isMEI', e.target.checked)}
                      className="w-5 h-5 mr-3 bg-white/10 border border-purple-500/50 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-white">
                      {companyData.isMEI ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
              <FormField label="Situação Cadastral">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.situacaoCadastral}
                    onChange={(e) => updateCompanyField('situacaoCadastral', e.target.value)}
                    placeholder="Situação Cadastral"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="CNAE">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.cnae}
                    onChange={(e) => updateCompanyField('cnae', e.target.value)}
                    placeholder="CNAE"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
              <FormField label="Descrição CNAE">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.cnaeDescricao}
                    onChange={(e) => updateCompanyField('cnaeDescricao', e.target.value)}
                    placeholder="Descrição do CNAE"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>

            <FormField label="Descrição CNAE">
              <div className="relative">
                <input
                  type="text"
                  value={companyData.cnaeDescricao}
                  onChange={(e) => updateCompanyField('cnaeDescricao', e.target.value)}
                  placeholder="Descrição do CNAE"
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </FormField>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <MapPin className="w-6 h-6 mr-3 text-purple-400" />
            Endereço
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
              <div className="col-span-3">
                <FormField label="Logradouro">
                  <div className="relative">
                    <input
                      type="text"
                      value={`${companyData.tipoLogradouro} ${companyData.logradouro}`.trim()}
                      onChange={(e) => {
                        const value = e.target.value;
                        const firstSpace = value.indexOf(' ');
                        if (firstSpace > 0) {
                          updateCompanyField('tipoLogradouro', value.substring(0, firstSpace));
                          updateCompanyField('logradouro', value.substring(firstSpace + 1));
                        } else {
                          updateCompanyField('tipoLogradouro', value);
                          updateCompanyField('logradouro', '');
                        }
                      }}
                      placeholder="Tipo e nome do logradouro"
                      className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <MapPin className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </FormField>
              </div>
              <div className="col-span-1">
                <FormField label="Número">
                  <div className="relative">
                    <input
                      type="text"
                      value={companyData.numero}
                      onChange={(e) => updateCompanyField('numero', e.target.value)}
                      placeholder="Número"
                      className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Complemento">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.complemento}
                    onChange={(e) => updateCompanyField('complemento', e.target.value)}
                    placeholder="Complemento"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
              <FormField label="Bairro">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.bairro}
                    onChange={(e) => updateCompanyField('bairro', e.target.value)}
                    placeholder="Bairro"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <MapPin className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <FormField label="CEP">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.cep}
                    onChange={(e) => updateCompanyField('cep', e.target.value)}
                    placeholder="CEP"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <MapPin className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
              <FormField label="UF">
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.uf}
                    onChange={(e) => updateCompanyField('uf', e.target.value)}
                    placeholder="UF"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <MapPin className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
              <div className="col-span-2">
                <FormField label="Cidade">
                  <div className="relative">
                    <input
                      type="text"
                      value={companyData.cidade}
                      onChange={(e) => updateCompanyField('cidade', e.target.value)}
                      placeholder="Cidade"
                      className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <MapPin className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </FormField>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <Users className="w-6 h-6 mr-3 text-purple-400" />
            Sócios
          </h3>
          
          <div className="space-y-6">
            {companyData.socios?.map((socio, index) => (
              <div key={index} className="p-6 bg-white/5 border border-purple-500/30 rounded-lg space-y-6">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-medium text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-400" />
                    Sócio {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeSocio(index)}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors"
                  >
                    Remover
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <FormField label="Nome">
                    <div className="relative">
                      <input
                        type="text"
                        value={socio.nome}
                        onChange={(e) =>
                          updateSocio(index, { ...socio, nome: e.target.value })
                        }
                        placeholder="Nome do sócio"
                        className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Users className="h-5 w-5 text-purple-400" />
                      </div>
                    </div>
                  </FormField>
                  <div className="flex flex-col md:flex-row items-center md:items-center h-[74px] gap-4">
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={socio.isResponsavel}
                        onChange={(e) => {
                          // Se já existe um responsável, desmarca ele primeiro
                          if (e.target.checked) {
                            companyData.socios.forEach((s, i) => {
                              if (s.isResponsavel && i !== index) {
                                updateSocio(i, { ...s, isResponsavel: false });
                              }
                            });
                          }
                          updateSocio(index, { ...socio, isResponsavel: e.target.checked });
                        }}
                        className="w-4 h-4 rounded border-purple-500 text-purple-500 focus:ring-purple-500"
                      />
                      Responsável
                    </label>
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={socio.incluirComoTitular || false}
                        onChange={(e) =>
                          updateSocio(index, { ...socio, incluirComoTitular: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-purple-500 text-purple-500 focus:ring-purple-500"
                      />
                      Incluir como titular
                    </label>
                  </div>
                </div>

                {socio.isResponsavel && (
                  <div className="space-y-6 pt-4 border-t border-purple-500/30">
                    <FormField label="E-mail">
                      <div className="relative">
                        <input
                          type="email"
                          value={socio.email || ''}
                          onChange={(e) =>
                            updateSocio(index, { ...socio, email: e.target.value })
                          }
                          placeholder="E-mail do responsável"
                          className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                          required
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <Mail className="h-5 w-5 text-purple-400" />
                        </div>
                      </div>
                    </FormField>

                    <FormField label="Telefone">
                      <div className="relative">
                        <input
                          type="tel"
                          value={socio.telefone || ''}
                          onChange={(e) => {
                            const telefoneFormatado = formatTelefone(e.target.value);
                            updateSocio(index, { ...socio, telefone: telefoneFormatado });
                          }}
                          placeholder="(00) 00000-0000"
                          className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors"
                          required
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <Phone className="h-5 w-5 text-purple-400" />
                        </div>
                      </div>
                    </FormField>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSocio}
              className="w-full py-3 border-2 border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 hover:border-purple-500/50 transition-colors"
            >
              + Adicionar Sócio
            </button>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 bg-white/10 py-4 px-6 border border-purple-400/30 rounded-lg shadow-lg text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            ← Anterior
          </button>
          
          <button
            type="submit"
            className="w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isCompanyDataValid()}
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}