import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '../../common/Card';
import { OperatorLogo } from '../../common/OperatorLogo';
import { Operator } from '../../../types/base';
import { supabase } from '../../../lib/supabase';
import { usePMEForm } from '../../../contexts/pme/PMEContext';
import { Heart, Stethoscope, Smile, Search, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PMEModalityStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PMEModalityStep({
  onBack,
  onSubmit,
}: PMEModalityStepProps) {
  const { 
    modality, 
    setModality,
    operator,
    setOperator,
    setOperatorName
  } = usePMEForm();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);
  const [errorOperators, setErrorOperators] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOperators, setTotalOperators] = useState(0);
  const [operatorsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const operatorsCache = useRef<Record<number, Operator[]>>({});
  
  // Referências para as seções do formulário
  const modalityRef = useRef<HTMLDivElement>(null);
  const operatorRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar erros de formulário
  const [formErrors, setFormErrors] = useState({
    modality: false,
    operator: false
  });
  
  // Estado para controlar o modal de erro
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
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
  
  // Função para mostrar mensagem de erro
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

  useEffect(() => {
    if (modality) {
      fetchOperators(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, fetchOperators, modality]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchOperators(1, value);
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleOperatorSelect = (e: React.MouseEvent, selectedOperator: Operator) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Atualiza o ID da operadora e o nome
    setOperator(Number(selectedOperator.id));
    setOperatorName(selectedOperator.nome);
  };

  const getPageCount = () => {
    return Math.ceil(totalOperators / operatorsPerPage);
  };

  const handlePageChange = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(page);
    const operatorSection = document.querySelector('.operator-section');
    if (operatorSection) {
      operatorSection.scrollIntoView({ behavior: 'smooth' });
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

  // Adicionar função de validação e exibição de erros
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar campos obrigatórios
    const errors = {
      modality: !modality,
      operator: !operator || operator === 0
    };
    
    setFormErrors(errors);
    
    // Se há algum erro, mostrar mensagem
    if (errors.modality || errors.operator) {
      let targetRef = null;
      let message = '';
      
      if (errors.modality) {
        message = 'Por favor, selecione uma modalidade de plano';
        targetRef = modalityRef;
      } else if (errors.operator) {
        message = 'Por favor, selecione uma operadora';
        targetRef = operatorRef;
      }
      
      showErrorToast(message, targetRef);
      return;
    }
    
    // Se não há erros, prosseguir
    onSubmit(e);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Stethoscope className="w-8 h-8 mr-3 text-purple-400" />
          Modalidade do Plano
        </h2>
        <p className="text-white/80 text-lg">
          Escolha a modalidade do plano que deseja contratar
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div 
          className={`bg-white/10 rounded-lg p-6 space-y-6 border shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20 ${
            formErrors.modality 
              ? 'border-red-500' 
              : 'border-purple-400/30'
          }`} 
          ref={modalityRef}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              title="Saúde"
              icon={<Heart size={32} className="text-purple-400" />}
              selected={modality === 'saude'}
              onClick={() => {
                setModality('saude');
                setOperator(0);
                setOperatorName('');
              }}
            >
              {modality === 'saude' && <CheckIcon />}
            </Card>
            <Card
              title="Saúde + Odonto"
              icon={<div className="flex gap-2"><Heart size={32} className="text-purple-400" /><Smile size={32} className="text-purple-400" /></div>}
              selected={modality === 'saude_odonto'}
              onClick={() => {
                setModality('saude_odonto');
                setOperator(0);
                setOperatorName('');
              }}
            >
              {modality === 'saude_odonto' && <CheckIcon />}
            </Card>
            <Card
              title="Odonto"
              icon={<Smile size={32} className="text-purple-400" />}
              selected={modality === 'odonto'}
              onClick={() => {
                setModality('odonto');
                setOperator(0);
                setOperatorName('');
              }}
            >
              {modality === 'odonto' && <CheckIcon />}
            </Card>
          </div>
        </div>

        {modality && (
          <div 
            className={`bg-white/10 rounded-lg p-6 space-y-6 border shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20 ${
              formErrors.operator 
                ? 'border-red-500' 
                : 'border-purple-400/30'
            }`} 
            ref={operatorRef}
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
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500 rounded-lg
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
                    {operators.map(op => (
                      <OperatorLogo
                        key={op.id}
                        name={op.nome}
                        imageUrl={op.logo_url}
                        selected={operator === Number(op.id)}
                        onClick={(e) => handleOperatorSelect(e, op)}
                        small
                      >
                        {operator === Number(op.id) && <CheckIcon />}
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
        )}

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

      <ErrorModal />
    </div>
  );
}
