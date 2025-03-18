import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FormField } from '../../common/FormField';
import { Card } from '../../common/Card';
import { OperatorLogo } from '../../common/OperatorLogo';
import { IndividualPlanData, Administrator } from '../../../types/individual';
import { Operator } from '../../../types/base';
import { supabase } from '../../../lib/supabase';
import { Heart, Stethoscope, Smile, Search, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Building, Bed, GraduationCap, DollarSign, Percent, Ban } from 'lucide-react';
import { MaskedInput, masks } from '../../common/Input';

interface IndividualPlanStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  planData: IndividualPlanData;
  onPlanDataChange: React.Dispatch<React.SetStateAction<IndividualPlanData>>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function IndividualPlanStep({
  onBack,
  onSubmit,
  planData,
  onPlanDataChange,
  searchTerm,
  onSearchChange,
}: IndividualPlanStepProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);
  const [isLoadingAdministrators, setIsLoadingAdministrators] = useState(false);
  const [errorOperators, setErrorOperators] = useState<string | null>(null);
  // Este estado é usado internamente na função fetchAdministrators
  const [errorAdministrators, setErrorAdministrators] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOperators, setTotalOperators] = useState(0);
  const [operatorsPerPage] = useState(20);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const operatorsCache = useRef<Record<number, Operator[]>>({});

  const fetchOperators = useCallback(async (page: number, search: string = '') => {
    if (operatorsCache.current[page] && !search) {
      setOperators(operatorsCache.current[page]);
      return;
    }

    setIsLoadingOperators(true);
    setErrorOperators(null);

    try {
      const from = (page - 1) * operatorsPerPage;
      const to = from + operatorsPerPage - 1;

      let query = supabase
        .from('operadoras')
        .select('id, nome, logo_url, categoria_id, operadora, sku_op_adm, categoria, count:id', { count: 'exact' })
        .eq('operadora', true)
        .order('categoria_id', { ascending: true });

      if (search.trim()) {
        const normalizedSearch = search.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        query = query.ilike('nome', `%${normalizedSearch}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      
      if (data) {
        if (!search) {
          operatorsCache.current[page] = data;
        }
        setOperators(data);
        if (count !== null) {
          setTotalOperators(count);
        }
      }
    } catch (err) {
      setErrorOperators('Erro ao carregar operadoras');
      console.error('Erro ao buscar operadoras:', err);
    } finally {
      setIsLoadingOperators(false);
    }
  }, [operatorsPerPage]);

  // Efeito para sincronizar os estados locais com o contexto global
  useEffect(() => {
    if (planData.value) {
      setValorPlano(String(planData.value));
    }
    
    if (planData.coparticipation) {
      setCoparticipacao(String(planData.coparticipation) as any);
    }
  }, [planData]);

  useEffect(() => {
    fetchOperators(currentPage, searchTerm);
    fetchAdministrators();
  }, [currentPage, searchTerm, fetchOperators]);

  const fetchAdministrators = async () => {
    setIsLoadingAdministrators(true);
    setErrorAdministrators(null);

    try {
      const { data, error } = await supabase
        .from('administradora')
        .select('*')
        .eq('status', true);

      if (error) throw error;
      
      if (data) {
        setAdministrators(data);
      }
    } catch (err) {
      setErrorAdministrators('Erro ao carregar administradoras');
      console.error('Erro ao buscar administradoras:', err);
    } finally {
      setIsLoadingAdministrators(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchOperators(1, value);
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleOperatorSelect = (e: React.MouseEvent, operator: Operator) => {
    e.preventDefault();
    e.stopPropagation();
    onPlanDataChange(prev => ({
      ...prev,
      operator: Number(operator.id),
      operatorName: operator.nome
    }));
  };

  const getPageCount = () => {
    return Math.ceil(totalOperators / operatorsPerPage);
  };

  // Função auxiliar para paginação - não utilizada atualmente
  // const getVisiblePages = (current: number, total: number) => {
  //   if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  //   
  //   if (current <= 3) return [1, 2, 3, 4, '...', total];
  //   if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  //   
  //   return [1, '...', current - 1, current, current + 1, '...', total];
  // };

  const handlePageChange = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(page);
    const operatorSection = document.querySelector('.operator-section');
    if (operatorSection) {
      operatorSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Inicializar estados com valores do contexto
  const [coparticipacao, setCoparticipacao] = useState<'completa' | 'parcial' | 'nao' | ''>(planData.coparticipation ? String(planData.coparticipation) as any : '');
  const [valorPlano, setValorPlano] = useState<string>(planData.value ? String(planData.value) : '');

  // Função para formatar valor em Real
  const formatarValor = (valor: string) => {
    // Remove tudo que não for dígito
    valor = valor.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para obter o valor em reais
    const valorNumerico = Number(valor) / 100;
    
    // Formata o valor para o padrão brasileiro
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valorNumerico);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    const valorFormatado = formatarValor(valor);
    setValorPlano(valorFormatado);
    
    // Atualizar o contexto imediatamente - converter string para number
    const valorNumerico = Number(valor) / 100;
    onPlanDataChange(prev => ({
      ...prev,
      value: valorNumerico
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Os dados já foram atualizados nos handlers de cada campo
      // Apenas garantindo que estão sincronizados antes de avançar
      
      // Extrai o valor numérico do formato brasileiro (R$ X.XXX,XX)
      // Remove R$, pontos e substitui vírgula por ponto para converter para número
      const valorLimpo = valorPlano.replace(/[R$\s.]/g, '').replace(',', '.');
      const valorNumerico = parseFloat(valorLimpo) || 0;
      
      onPlanDataChange(prev => ({
        ...prev,
        coparticipation: coparticipacao,
        value: valorNumerico,
      }));

      // Avançar para próxima etapa
      onSubmit(e);
    } catch (error) {
      console.error('Erro ao salvar dados do plano:', error);
    }
  };

  const CheckIcon = () => (
    <div className="shrink-0 text-emerald-300 ml-auto text-white">
      <CheckCircle className="h-6 w-6 text-emerald-500" />
    </div>
  );
  

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Stethoscope className="w-8 h-8 mr-3 text-purple-400" />
          Informações do Plano
        </h2>
        <p className="text-white/80 text-lg">
          Selecione as características do plano
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Tipo do Plano
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card
              title="Individual/Familiar"
              icon={<Building size={32} className="text-purple-400" />}
              selected={planData.type === 'individual'}
              onClick={() => onPlanDataChange(prev => ({ 
                ...prev, 
                type: 'individual',
                ...(planData.type === 'individual' ? { administrator: '', association: '' } : {})
              }))}
            >
              {planData.type === 'individual' && <CheckIcon />}
            </Card>
            <Card
              title="Adesão"
              icon={<GraduationCap size={32} className="text-purple-400" />}
              selected={planData.type === 'adhesion'}
              onClick={() => onPlanDataChange(prev => ({ 
                ...prev, 
                type: 'adhesion',
                ...(planData.type === 'adhesion' ? { administrator: '', association: '' } : {})
              }))}
            >
              {planData.type === 'adhesion' && <CheckIcon />}
            </Card>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Modalidade de Contratação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card
              title="Saúde"
              icon={<Heart size={32} className="text-purple-400" />}
              selected={planData.modality === 'health'}
              onClick={() => onPlanDataChange(prev => ({ 
                ...prev, 
                modality: 'health'
              }))}
            >
              {planData.modality === 'health' && <CheckIcon />}
            </Card>
            <Card
              title="Odonto"
              icon={<Smile size={32} className="text-purple-400" />}
              selected={planData.modality === 'dental'}
              onClick={() => onPlanDataChange(prev => ({ 
                ...prev, 
                modality: 'dental'
              }))}
            >
              {planData.modality === 'dental' && <CheckIcon />}
            </Card>
            <Card
              title="Saúde + Odonto"
              icon={<div className="flex gap-2"><Heart size={32} className="text-purple-400" /><Smile size={32} className="text-purple-400" /></div>}
              selected={planData.modality === 'both'}
              onClick={() => onPlanDataChange(prev => ({ 
                ...prev, 
                modality: 'both'
              }))}
            >
              {planData.modality === 'both' && <CheckIcon />}
            </Card>
          </div>
        </div>

        {planData.type === 'adhesion' && (
          <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
              <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
              Administradora e Associação
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                label="Administradora"
              >
                <div className="relative">
                  <select
                    id="administrator"
                    value={typeof planData.administrator === 'object' ? planData.administrator.administradora_id : planData.administrator}
                    onChange={(e) => {
                      const selectedAdminId = e.target.value ? Number(e.target.value) : '';
                      if (selectedAdminId === '') {
                        onPlanDataChange(prev => ({
                          ...prev,
                          administrator: ''
                        }));
                      } else {
                        // Buscar o objeto completo da administradora selecionada
                        const selectedAdmin = administrators.find(admin => admin.administradora_id === Number(selectedAdminId));
                        if (selectedAdmin) {
                          onPlanDataChange(prev => ({
                            ...prev,
                            administrator: selectedAdmin
                          }));
                        } else {
                          onPlanDataChange(prev => ({
                            ...prev,
                            administrator: selectedAdminId
                          }));
                        }
                      }
                    }}
                    className="w-full px-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                             text-white focus:outline-none focus:border-white/40 transition-colors
                             [&>option]:bg-gray-900 [&>option]:text-white"
                    required
                  >
                    <option value="">Selecione uma administradora</option>
                    {administrators.map((admin) => (
                      <option key={admin.id} value={admin.administradora_id}>
                        {admin.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </FormField>

              <FormField label="Associação">
                <div className="relative">
                  <input
                    type="text"
                    value={planData.association}
                    onChange={(e) => onPlanDataChange(prev => ({ ...prev, association: e.target.value }))}
                    placeholder="Nome da associação"
                    className="w-full px-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                    required
                  />
                </div>
              </FormField>
            </div>
          </div>
        )}

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Operadora
          </h3>
          <p className="text-sm text-red-500 mb-4 italic flex items-center">
            <AlertCircle className="w-4 h-4 mr-1 text-purple-400 flex-shrink-0" />
            Se a operadora desejada não estiver na lista, selecione "Outras"
          </p>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar operadora..."
                className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                         text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                         transition-colors"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-5 w-5 text-purple-400" />
              </div>
            </div>

            {isLoadingOperators ? (
              <div className="text-center text-white/80 py-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3"></div>
                Buscando operadoras...
              </div>
            ) : errorOperators ? (
              <div className="text-center text-red-400 py-8 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                {errorOperators}
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    void fetchOperators(currentPage, searchTerm);
                  }}
                  className="ml-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center text-white/80 py-8 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2 text-purple-400" />
                {searchTerm ? 'Nenhuma operadora encontrada com este nome.' : 'Nenhuma operadora disponível.'}
              </div>
            ) : (
              <div className="space-y-4 operator-section">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {operators.map(operator => (
                    <OperatorLogo
                      key={operator.id}
                      name={operator.nome}
                      imageUrl={operator.logo_url}
                      selected={planData.operator === Number(operator.id)}
                      onClick={(e) => handleOperatorSelect(e, operator)}
                      small
                    >
                      {planData.operator === Number(operator.id) && <CheckIcon />}
                    </OperatorLogo>
                  ))}
                </div>
                {getPageCount() > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <button
                      type="button"
                      onClick={(e) => handlePageChange(e, currentPage - 1)}
                      disabled={currentPage === 1 || isLoadingOperators}
                      className={`px-4 py-2 rounded flex items-center transition-all ${
                        currentPage === 1 || isLoadingOperators
                          ? 'bg-white/10 text-white/60 cursor-not-allowed'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5 mr-1" />
                      Anterior
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: getPageCount() }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={(e) => handlePageChange(e, page)}
                          disabled={isLoadingOperators}
                          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handlePageChange(e, currentPage + 1)}
                      disabled={currentPage === getPageCount() || isLoadingOperators}
                      className={`px-4 py-2 rounded flex items-center transition-all ${
                        currentPage === getPageCount() || isLoadingOperators
                          ? 'bg-white/10 text-white/60 cursor-not-allowed'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Próxima
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Informações do Plano
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome do Plano" required>
              <div className="relative">
                <input
                  type="text"
                  value={planData.nomePlano || ''}
                  onChange={(e) => onPlanDataChange(prev => ({ ...prev, nomePlano: e.target.value }))}
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                  placeholder="Digite o nome do plano"
                  required
                />
              </div>
            </FormField>
            <FormField label="Vigência" required>
              <div className="relative">
                <input
                  type="date"
                  value={planData.vigencia || ''}
                  onChange={(e) => onPlanDataChange(prev => ({ ...prev, vigencia: e.target.value }))}
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors [color-scheme:dark]"
                  required
                />
              </div>
            </FormField>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Acomodação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card
              title="Apartamento"
              icon={<Building size={32} className="text-purple-400" />}
              selected={planData.accommodation === 'private'}
              onClick={() => onPlanDataChange(prev => ({ 
                ...prev, 
                accommodation: 'private'
              }))}
            >
              {planData.accommodation === 'private' && <CheckIcon />}
            </Card>
            <Card
              title="Enfermaria"
              icon={<Bed size={32} className="text-purple-400" />}
              selected={planData.accommodation === 'shared'}
              onClick={() => onPlanDataChange(prev => ({ 
                ...prev, 
                accommodation: 'shared'
              }))}
            >
              {planData.accommodation === 'shared' && <CheckIcon />}
            </Card>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Dados do Plano
          </h3>
          
          <div className="space-y-6">
            <FormField label="Valor do Plano">
              <div className="relative">
                <input
                  type="text"
                  id="valor"
                  name="valor"
                  value={valorPlano}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </FormField>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">
                Coparticipação
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                  title="Sim Completa"
                  icon={<DollarSign size={32} className="text-purple-400" />}
                  selected={coparticipacao === 'completa'}
                  onClick={() => {
                    setCoparticipacao('completa');
                    onPlanDataChange(prev => ({ ...prev, coparticipation: 'completa' }));
                  }}
                >
                  {coparticipacao === 'completa' && <CheckIcon />}
                </Card>
                <Card
                  title="Sim Parcial"
                  icon={<Percent size={32} className="text-purple-400" />}
                  selected={coparticipacao === 'parcial'}
                  onClick={() => {
                    setCoparticipacao('parcial');
                    onPlanDataChange(prev => ({ ...prev, coparticipation: 'parcial' }));
                  }}
                >
                  {coparticipacao === 'parcial' && <CheckIcon />}
                </Card>
                <Card
                  title="Não"
                  icon={<Ban size={32} className="text-purple-400" />}
                  selected={coparticipacao === 'nao'}
                  onClick={() => {
                    setCoparticipacao('nao');
                    onPlanDataChange(prev => ({ ...prev, coparticipation: 'nao' }));
                  }}
                >
                  {coparticipacao === 'nao' && <CheckIcon />}
                </Card>
              </div>
            </div>
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
            disabled={
              !planData.type ||
              !planData.modality ||
              !planData.operator ||
              !planData.accommodation ||
              (planData.type === 'adhesion' && (!planData.administrator || !planData.association)) ||
              !coparticipacao ||
              !valorPlano
            }
            className="w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}
