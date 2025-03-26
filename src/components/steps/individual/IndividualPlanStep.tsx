import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FormField } from '../../common/FormField';
import { Card } from '../../common/Card';
import { OperatorLogo } from '../../common/OperatorLogo';
import { IndividualPlanData, Administrator } from '../../../types/individual';
import { Operator } from '../../../types/base';
import { supabase } from '../../../lib/supabase';
import { Heart, Stethoscope, Smile, Search, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Building, Bed, GraduationCap, DollarSign, Percent, Ban, X } from 'lucide-react';
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

  // Referências para elementos do formulário
  const tipoPlanoRef = useRef<HTMLDivElement>(null);
  const modalidadeRef = useRef<HTMLDivElement>(null);
  const administradoraRef = useRef<HTMLDivElement>(null);
  const operadoraRef = useRef<HTMLDivElement>(null);
  const infoPlanoRef = useRef<HTMLDivElement>(null);
  const acomodacaoRef = useRef<HTMLDivElement>(null);
  const dadosPlanoRef = useRef<HTMLDivElement>(null);
  
  // Estado para mensagens de erro de validação
  const [formErrors, setFormErrors] = useState<{
    type: boolean;
    modality: boolean;
    administrator: boolean;
    association: boolean;
    operator: boolean;
    nomePlano: boolean;
    vigencia: boolean;
    accommodation: boolean;
    coparticipation: boolean;
    value: boolean;
  }>({
    type: false,
    modality: false,
    administrator: false,
    association: false,
    operator: false,
    nomePlano: false,
    vigencia: false,
    accommodation: false,
    coparticipation: false,
    value: false
  });
  
  // Estado para controlar a exibição do modal de erro
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      setValorPlano(formatValue(planData.value));
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
    
    // Limpar erro ao selecionar operadora
    setFormErrors(prev => ({
      ...prev,
      operator: false
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

  // Função para formatar valor em Real
  const formatValue = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valor);
  };

  // Inicializar estados com valores do contexto
  const [coparticipacao, setCoparticipacao] = useState<'completa' | 'parcial' | 'nao' | ''>(planData.coparticipation ? String(planData.coparticipation) as any : '');
  const [valorPlano, setValorPlano] = useState<string>(planData.value ? formatValue(planData.value) : '');

  const handleValueChange = (value: string) => {
    // Atualiza o estado local com o valor formatado
    setValorPlano(value);
    
    // Remove tudo que não for dígito para calcular o valor numérico
    const numericValue = Number(value.replace(/\D/g, '')) / 100;
    
    // Atualiza o contexto com o valor numérico
    onPlanDataChange(prev => ({
      ...prev,
      value: numericValue
    }));
    
    // Limpar erro
    if (value && value !== 'R$ 0,00') {
      setFormErrors(prev => ({
        ...prev,
        value: false
      }));
    }
  };

  // Função para mostrar mensagem de erro no modal
  const showErrorToast = (message: string, ref: React.RefObject<HTMLDivElement> | null) => {
    // Mostrar a mensagem de erro
    setErrorMessage(message);
    setShowErrorModal(true);

    // Rolar até o elemento com erro
    if (ref && ref.current) {
      console.log("Rolando até o elemento com erro");
      ref.current.scrollIntoView({ behavior: 'smooth' });
      // Adicionar uma classe para destacar visualmente o elemento com erro
      ref.current.classList.add('error-shake');
      setTimeout(() => {
        if (ref && ref.current) {
          ref.current.classList.remove('error-shake');
        }
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário submetido!");

    // Redefinir todos os erros
    const newErrors = {
      type: !planData.type,
      modality: !planData.modality,
      administrator: planData.type === 'adhesion' && !planData.administrator,
      association: planData.type === 'adhesion' && !planData.association,
      operator: !planData.operator,
      nomePlano: !planData.nomePlano,
      vigencia: !planData.vigencia,
      accommodation: !planData.accommodation,
      coparticipation: !coparticipacao,
      value: !valorPlano || valorPlano === 'R$ 0,00'
    };

    console.log("Erros de validação:", newErrors);
    setFormErrors(newErrors);

    // Verificar se há algum erro
    const hasError = Object.values(newErrors).some(error => error === true);
    console.log("Tem erro:", hasError);

    if (hasError) {
      // Determinar a mensagem de erro e qual elemento deve receber o foco
      let targetRef = null;
      let message = '';

      if (newErrors.type) {
        message = 'Selecione o tipo do plano';
        targetRef = tipoPlanoRef;
      } else if (newErrors.modality) {
        message = 'Selecione a modalidade de contratação';
        targetRef = modalidadeRef;
      } else if (newErrors.administrator || newErrors.association) {
        message = 'Preencha os dados da administradora e associação';
        targetRef = administradoraRef;
      } else if (newErrors.operator) {
        message = 'Selecione uma operadora';
        targetRef = operadoraRef;
      } else if (newErrors.nomePlano || newErrors.vigencia) {
        message = 'Preencha todas as informações do plano';
        targetRef = infoPlanoRef;
      } else if (newErrors.accommodation) {
        message = 'Selecione o tipo de acomodação';
        targetRef = acomodacaoRef;
      } else if (newErrors.value || newErrors.coparticipation) {
        message = 'Preencha todos os dados do plano';
        targetRef = dadosPlanoRef;
      }

      console.log("Mensagem de erro:", message);
      showErrorToast(message, targetRef);
      return;
    }

    try {
      // Os dados já foram atualizados nos handlers de cada campo
      // Apenas garantindo que estão sincronizados antes de avançar
      
      onPlanDataChange(prev => ({
        ...prev,
        coparticipation: coparticipacao,
      }));

      // Avançar para próxima etapa
      onSubmit(e);
    } catch (error) {
      console.error('Erro ao salvar dados do plano:', error);
      alert('Ocorreu um erro ao salvar os dados. Por favor, tente novamente.');
    }
  };

  const CheckIcon = () => (
    <div className="shrink-0 text-emerald-300 ml-auto text-white">
      <CheckCircle className="h-6 w-6 text-emerald-500" />
    </div>
  );
  
  // Componente para exibir o modal de erro
  const ErrorModal = () => {
    if (!showErrorModal) return null;
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
        <div className="bg-gray-900 border border-red-500 rounded-lg p-6 max-w-md w-full shadow-lg transform transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-red-500 rounded-full p-2 mr-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Campos obrigatórios</h3>
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-white text-lg">{errorMessage}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg text-white font-bold transition-all hover:from-violet-700 hover:to-purple-700"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Estilo para animação de shake quando há erro
  useEffect(() => {
    // Adicionar estilo para animação de erro
    const style = document.createElement('style');
    style.textContent = `
      @keyframes error-shake {
        0% { transform: translateX(0); }
        10% { transform: translateX(-5px); }
        20% { transform: translateX(5px); }
        30% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        50% { transform: translateX(-5px); }
        60% { transform: translateX(5px); }
        70% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
        90% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
      }
      
      .error-shake {
        animation: error-shake 0.6s ease-in-out;
        border-color: rgb(239, 68, 68) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Para o tipo do plano
  const handleTypeChange = (type: 'individual' | 'adhesion') => {
    onPlanDataChange(prev => ({ 
      ...prev, 
      type,
      ...(type === 'individual' ? { administrator: '', association: '' } : {})
    }));
    
    // Limpar erro ao selecionar tipo
    setFormErrors(prev => ({
      ...prev,
      type: false
    }));
  };

  // Para a modalidade 
  const handleModalityChange = (modality: 'health' | 'dental' | 'both') => {
    onPlanDataChange(prev => ({ 
      ...prev, 
      modality
    }));
    
    // Limpar erro ao selecionar modalidade
    setFormErrors(prev => ({
      ...prev,
      modality: false
    }));
  };

  // Para acomodação
  const handleAccommodationChange = (accommodation: 'private' | 'shared') => {
    onPlanDataChange(prev => ({ 
      ...prev, 
      accommodation
    }));
    
    // Limpar erro ao selecionar acomodação
    setFormErrors(prev => ({
      ...prev,
      accommodation: false
    }));
  };

  // Para coparticipação
  const handleCopartChange = (value: 'completa' | 'parcial' | 'nao') => {
    setCoparticipacao(value);
    onPlanDataChange(prev => ({ 
      ...prev, 
      coparticipation: value
    }));
    
    // Limpar erro ao selecionar coparticipação
    setFormErrors(prev => ({
      ...prev,
      coparticipation: false
    }));
  };

  // Funções para lidar com os campos de administradora e associação
  const handleAdministratorChange = (value: string | number | Administrator) => {
    if (value === '') {
      onPlanDataChange(prev => ({
        ...prev,
        administrator: ''
      }));
    } else {
      const selectedAdminId = typeof value === 'string' ? Number(value) : value;
      
      // Buscar o objeto completo da administradora selecionada
      if (typeof selectedAdminId === 'number') {
        const selectedAdmin = administrators.find(admin => admin.administradora_id === selectedAdminId);
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
      } else {
        onPlanDataChange(prev => ({
          ...prev,
          administrator: selectedAdminId
        }));
      }
    }
    
    // Limpar erro
    setFormErrors(prev => ({
      ...prev,
      administrator: false
    }));
  };

  const handleAssociationChange = (value: string) => {
    onPlanDataChange(prev => ({ 
      ...prev, 
      association: value 
    }));
    
    // Limpar erro
    if (value) {
      setFormErrors(prev => ({
        ...prev,
        association: false
      }));
    }
  };

  const handlePlanNameChange = (value: string) => {
    onPlanDataChange(prev => ({ 
      ...prev, 
      nomePlano: value 
    }));
    
    // Limpar erro
    if (value) {
      setFormErrors(prev => ({
        ...prev,
        nomePlano: false
      }));
    }
  };

  const handleVigenciaChange = (value: string) => {
    onPlanDataChange(prev => ({ 
      ...prev, 
      vigencia: value 
    }));
    
    // Limpar erro
    if (value) {
      setFormErrors(prev => ({
        ...prev,
        vigencia: false
      }));
    }
  };

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
        <div 
          ref={tipoPlanoRef}
          className={`bg-white/10 rounded-lg p-6 space-y-6 border ${formErrors.type ? 'border-red-500 shadow-red-500/30' : 'border-purple-400/30'} shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Tipo do Plano
            {formErrors.type && <AlertCircle className="w-5 h-5 ml-2 text-red-500" />}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card
              title="Individual/Familiar"
              icon={<Building size={32} className="text-purple-400" />}
              selected={planData.type === 'individual'}
              onClick={() => handleTypeChange('individual')}
            >
              {planData.type === 'individual' && <CheckIcon />}
            </Card>
            <Card
              title="Adesão"
              icon={<GraduationCap size={32} className="text-purple-400" />}
              selected={planData.type === 'adhesion'}
              onClick={() => handleTypeChange('adhesion')}
            >
              {planData.type === 'adhesion' && <CheckIcon />}
            </Card>
          </div>
          {formErrors.type && (
            <p className="text-red-500 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Selecione um tipo de plano
            </p>
          )}
        </div>

        <div 
          ref={modalidadeRef}
          className={`bg-white/10 rounded-lg p-6 space-y-6 border ${formErrors.modality ? 'border-red-500 shadow-red-500/30' : 'border-purple-400/30'} shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Modalidade de Contratação
            {formErrors.modality && <AlertCircle className="w-5 h-5 ml-2 text-red-500" />}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card
              title="Saúde"
              icon={<Heart size={32} className="text-purple-400" />}
              selected={planData.modality === 'health'}
              onClick={() => handleModalityChange('health')}
            >
              {planData.modality === 'health' && <CheckIcon />}
            </Card>
            <Card
              title="Odonto"
              icon={<Smile size={32} className="text-purple-400" />}
              selected={planData.modality === 'dental'}
              onClick={() => handleModalityChange('dental')}
            >
              {planData.modality === 'dental' && <CheckIcon />}
            </Card>
            <Card
              title="Saúde + Odonto"
              icon={<div className="flex gap-2"><Heart size={32} className="text-purple-400" /><Smile size={32} className="text-purple-400" /></div>}
              selected={planData.modality === 'both'}
              onClick={() => handleModalityChange('both')}
            >
              {planData.modality === 'both' && <CheckIcon />}
            </Card>
          </div>
          {formErrors.modality && (
            <p className="text-red-500 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Selecione uma modalidade de contratação
            </p>
          )}
        </div>

        {planData.type === 'adhesion' && (
          <div 
            ref={administradoraRef}
            className={`bg-white/10 rounded-lg p-6 space-y-6 border ${(formErrors.administrator || formErrors.association) ? 'border-red-500 shadow-red-500/30' : 'border-purple-400/30'} shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
          >
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
                      handleAdministratorChange(e.target.value);
                    }}
                    className={`w-full px-6 py-4 bg-white/10 border ${formErrors.administrator ? 'border-red-500' : 'border-purple-500/50'} rounded-lg
                             text-white focus:outline-none focus:border-white/40 transition-colors
                             [&>option]:bg-gray-900 [&>option]:text-white`}
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
                    onChange={(e) => handleAssociationChange(e.target.value)}
                    placeholder="Nome da associação"
                    className={`w-full px-6 py-4 bg-white/10 border ${formErrors.association ? 'border-red-500' : 'border-purple-500/50'} rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors`}
                    required
                  />
                </div>
              </FormField>
            </div>
            {(formErrors.administrator || formErrors.association) && (
              <p className="text-red-500 text-sm flex items-center mt-2">
                <AlertCircle className="w-4 h-4 mr-1" />
                Preencha os dados da administradora e associação
              </p>
            )}
          </div>
        )}

        <div 
          ref={operadoraRef}
          className={`bg-white/10 rounded-lg p-6 space-y-6 border ${formErrors.operator ? 'border-red-500 shadow-red-500/30' : 'border-purple-400/30'} shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
        >
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
          {formErrors.operator && (
            <p className="text-red-500 text-sm flex items-center mt-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              Selecione uma operadora
            </p>
          )}
        </div>

        <div 
          ref={infoPlanoRef}
          className={`bg-white/10 rounded-lg p-6 space-y-6 border ${(formErrors.nomePlano || formErrors.vigencia) ? 'border-red-500 shadow-red-500/30' : 'border-purple-400/30'} shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
        >
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
                  onChange={(e) => handlePlanNameChange(e.target.value)}
                  className={`w-full px-6 py-4 bg-white/10 border ${formErrors.nomePlano ? 'border-red-500' : 'border-purple-500/50'} rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors`}
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
                  onChange={(e) => handleVigenciaChange(e.target.value)}
                  className={`w-full px-6 py-4 bg-white/10 border ${formErrors.vigencia ? 'border-red-500' : 'border-purple-500/50'} rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors [color-scheme:dark]`}
                  required
                />
              </div>
            </FormField>
          </div>
          {(formErrors.nomePlano || formErrors.vigencia) && (
            <p className="text-red-500 text-sm flex items-center mt-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              Preencha todas as informações do plano
            </p>
          )}
        </div>

        <div 
          ref={acomodacaoRef}
          className={`bg-white/10 rounded-lg p-6 space-y-6 border ${formErrors.accommodation ? 'border-red-500 shadow-red-500/30' : 'border-purple-400/30'} shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Acomodação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card
              title="Apartamento"
              icon={<Building size={32} className="text-purple-400" />}
              selected={planData.accommodation === 'private'}
              onClick={() => handleAccommodationChange('private')}
            >
              {planData.accommodation === 'private' && <CheckIcon />}
            </Card>
            <Card
              title="Enfermaria"
              icon={<Bed size={32} className="text-purple-400" />}
              selected={planData.accommodation === 'shared'}
              onClick={() => handleAccommodationChange('shared')}
            >
              {planData.accommodation === 'shared' && <CheckIcon />}
            </Card>
          </div>
          {formErrors.accommodation && (
            <p className="text-red-500 text-sm flex items-center mt-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              Selecione o tipo de acomodação
            </p>
          )}
        </div>

        <div 
          ref={dadosPlanoRef}
          className={`bg-white/10 rounded-lg p-6 space-y-6 border ${(formErrors.value || formErrors.coparticipation) ? 'border-red-500 shadow-red-500/30' : 'border-purple-400/30'} shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20`}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
            Dados do Plano
          </h3>
          
          <div className="space-y-6">
            <FormField label="Valor do Plano">
              <div className="relative">
                <MaskedInput
                  type="text"
                  id="valor"
                  name="valor"
                  value={valorPlano}
                  onChange={handleValueChange}
                  mask={masks.currency}
                  placeholder="R$ 0,00"
                  className={`w-full pl-12 pr-6 py-4 bg-white/10 border ${formErrors.value ? 'border-red-500' : 'border-purple-500/50'} rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors`}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <DollarSign className="h-2 w-5 text-purple-400" />
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
                  onClick={() => handleCopartChange('completa')}
                >
                  {coparticipacao === 'completa' && <CheckIcon />}
                </Card>
                <Card
                  title="Sim Parcial"
                  icon={<Percent size={32} className="text-purple-400" />}
                  selected={coparticipacao === 'parcial'}
                  onClick={() => handleCopartChange('parcial')}
                >
                  {coparticipacao === 'parcial' && <CheckIcon />}
                </Card>
                <Card
                  title="Não"
                  icon={<Ban size={32} className="text-purple-400" />}
                  selected={coparticipacao === 'nao'}
                  onClick={() => handleCopartChange('nao')}
                >
                  {coparticipacao === 'nao' && <CheckIcon />}
                </Card>
              </div>
            </div>
          </div>
          {(formErrors.value || formErrors.coparticipation) && (
            <p className="text-red-500 text-sm flex items-center mt-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              Preencha todos os dados do plano
            </p>
          )}
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
            className="w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            Continuar
          </button>
        </div>
      </form>

      {/* Renderizar o modal de erro no final do componente */}
      <ErrorModal />
    </div>
  );
}
