import React, { useState, useCallback, useRef } from 'react';
import { FormField } from '../../../components/common/FormField';
import { Card } from '../../../components/common/Card';
import { OperatorLogo } from '../../../components/common/OperatorLogo';
import { GracePeriodData, Operator } from '../../../types';
import { Clock, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface IndividualGraceStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  gracePeriodData: GracePeriodData;
  onGracePeriodDataChange: React.Dispatch<React.SetStateAction<GracePeriodData>>;
}

export function IndividualGraceStep({
  onBack,
  onSubmit,
  gracePeriodData,
  onGracePeriodDataChange,
}: IndividualGraceStepProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);
  const [errorOperators, setErrorOperators] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOperators, setTotalOperators] = useState(0);
  const [operatorsPerPage] = useState(8);
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
        .select('id, nome, logo_url, count:id', { count: 'exact' })
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

  React.useEffect(() => {
    fetchOperators(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchOperators]);

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

  const handleOperatorSelect = (e: React.MouseEvent, operator: Operator) => {
    e.preventDefault();
    e.stopPropagation();
    onGracePeriodDataChange(prev => ({
      ...prev,
      previousOperator: operator.id,
      previousOperatorName: operator.nome
    }));
  };

  const getPageCount = () => {
    return Math.ceil(totalOperators / operatorsPerPage);
  };

  const getVisiblePages = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    
    return [1, '...', current - 1, current, current + 1, '...', total];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se uma operadora foi selecionada quando há aproveitamento de carência
    if (gracePeriodData.hasGracePeriod && !gracePeriodData.previousOperator) {
      setErrorOperators('Por favor, selecione a operadora anterior');
      return;
    }
    
    onSubmit(e);
  };


  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Clock className="w-8 h-8 mr-3 text-purple-400" />
          Aproveitamento de Carência
        </h2>
        <p className="text-white/80 text-lg">
          Informe se há aproveitamento de carência
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Aproveitar Carência?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card
              title="Sim"
              icon={<Clock size={32} />}
              selected={gracePeriodData.hasGracePeriod}
              onClick={() => onGracePeriodDataChange(prev => ({ ...prev, hasGracePeriod: true }))}
            />
            <Card
              title="Não"
              icon={<XCircle size={32} />}
              selected={!gracePeriodData.hasGracePeriod}
              onClick={() => onGracePeriodDataChange(prev => ({ 
                ...prev, 
                hasGracePeriod: false,
                previousOperator: null,
                previousOperatorName: ''
              }))}
            />
          </div>
        </div>

        {gracePeriodData.hasGracePeriod && (
          <div className="p-6 bg-white/5 border border-purple-500/30 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              Operadora Anterior
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar operadora..."
                className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                         text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                         transition-colors"
              />

              {isLoadingOperators ? (
                <div className="text-center text-white/80 py-8">
                  Buscando operadoras...
                </div>
              ) : errorOperators ? (
                <div className="text-center text-red-400 py-8">
                  {errorOperators}
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      fetchOperators(currentPage, searchTerm);
                    }}
                    className="ml-2 text-purple-400 hover:text-purple-300"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : operators.length === 0 ? (
                <div className="text-center text-white/80 py-8">
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
                        selected={gracePeriodData.previousOperator === Number(operator.id)}
                        onClick={(e) => handleOperatorSelect(e, operator)}
                        small
                      />
                    ))}
                  </div>

                  {getPageCount() > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={(e) => handlePageChange(e, currentPage - 1)}
                        disabled={currentPage === 1 || isLoadingOperators}
                        className={`px-4 py-2 rounded ${currentPage === 1 || isLoadingOperators ? 'bg-white/10 text-white/60 cursor-not-allowed' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                      >
                        Anterior
                      </button>

                      {getVisiblePages(currentPage, getPageCount()).map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-4 py-2 text-white/60">...</span>
                        ) : (
                          <button
                            type="button"
                            key={`page-${page}`}
                            onClick={(e) => handlePageChange(e, page as number)}
                            disabled={isLoadingOperators}
                            className={`px-4 py-2 rounded ${currentPage === page ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button
                        type="button"
                        onClick={(e) => handlePageChange(e, currentPage + 1)}
                        disabled={currentPage === getPageCount() || isLoadingOperators}
                        className={`px-4 py-2 rounded ${currentPage === getPageCount() || isLoadingOperators ? 'bg-white/10 text-white/60 cursor-not-allowed' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                      >
                        Próximo
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
            className="w-1/2 px-6 py-3 rounded-lg border border-purple-500 text-white font-medium 
                     hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
          >
            ← Anterior
          </button>
          <button
            type="submit"
            disabled={gracePeriodData.hasGracePeriod && !gracePeriodData.previousOperator}
            className="w-1/2 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 
                     text-white font-medium hover:brightness-110 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}