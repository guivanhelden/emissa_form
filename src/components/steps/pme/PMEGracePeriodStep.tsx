import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BaseStepProps } from '../../../types/base';
import { usePMEForm } from '../../../hooks/pme';
import { Operator } from '../../../types/base';
import { supabase } from '../../../lib/supabase';
import { OperatorLogo } from '../../common/OperatorLogo';
import { Clock, Search, Check, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useSafeDomOperations } from '../../../hooks/useSafeDomOperations';
import { useEffectCleanup } from '../../../hooks/useEffectCleanup';

const inputClasses = "w-full px-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition-colors";

export default function PMEGracePeriodStep({ onBack, onSubmit }: BaseStepProps) {
  const { gracePeriodData, setGracePeriodData } = usePMEForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredOperators, setOperators] = useState<Operator[]>([]);
  const [operatorsPerPage] = useState(20);
  const operatorsCache = useRef<Record<number, Operator[]>>({});

  const { safeRemoveChild } = useSafeDomOperations();

  const fetchOperators = useCallback(async (page: number, search: string = '') => {
    if (operatorsCache.current[page] && !search) {
      setOperators(operatorsCache.current[page]);
      return;
    }

    setIsLoading(true);

    try {
      const from = (page - 1) * operatorsPerPage;
      const to = from + operatorsPerPage - 1;

      let query = supabase
        .from('operadoras')
        .select('id, nome, logo_url, sku_op_adm, categoria_id, categoria, operadora', { count: 'exact' })
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
          setTotalPages(Math.ceil(count / operatorsPerPage));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar operadoras:', err);
    } finally {
      setIsLoading(false);
    }
  }, [operatorsPerPage]);

  useEffectCleanup(() => {
    // Código de efeito aqui, se necessário
    
    return () => {
      // Limpeza segura de elementos DOM, se necessário
      const modalElements = document.querySelectorAll('.modal-element');
      modalElements.forEach(element => {
        const parent = element.parentNode;
        if (element && parent) {
          safeRemoveChild(parent, element);
        }
      });
    };
  }, [safeRemoveChild]);

  useEffect(() => {
    if (gracePeriodData.hasGracePeriod) {
      fetchOperators(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, fetchOperators, gracePeriodData.hasGracePeriod]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOperatorSelect = (e: React.MouseEvent, operator: Operator) => {
    e.preventDefault();
    e.stopPropagation();
    
    setGracePeriodData({
      ...gracePeriodData,
      previousOperator: Number(operator.id),
      previousOperatorName: operator.nome,
    });
  };

  const handleHasGracePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGracePeriodData({
      ...gracePeriodData,
      hasGracePeriod: e.target.checked,
      previousOperator: e.target.checked ? gracePeriodData.previousOperator : null,
    });
  };

  const handlePageChange = (e: React.MouseEvent<HTMLButtonElement>, page: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(page);
    const operatorSection = document.querySelector('.operator-section');
    if (operatorSection) {
      operatorSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Clock className="w-8 h-8 mr-3 text-purple-400" />
          Carência
        </h2>
        <p className="text-white/80 text-lg">
          Informe se deseja aproveitar a carência de outra operadora
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="hasGracePeriod"
                type="checkbox"
                checked={gracePeriodData.hasGracePeriod}
                onChange={handleHasGracePeriodChange}
                className="focus:ring-purple-500 h-4 w-4 text-purple-600 bg-white/10 border-gray-600 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="hasGracePeriod" className="font-medium text-white">
                Possui carência de outra operadora?
              </label>
              <p className="text-white/60">
                Marque esta opção se você está vindo de outra operadora e deseja aproveitar
                a carência.
              </p>
            </div>
          </div>

          {gracePeriodData.hasGracePeriod && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
                  <Search className="w-6 h-6 mr-3 text-purple-400" />
                  Operadora Anterior
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
                      className={inputClasses + " pl-12"}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Search className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center text-white/80 py-8 flex items-center justify-center">
                      <div className="animate-spin mr-2">
                        <svg className="h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      Buscando operadoras...
                    </div>
                  ) : (
                    <div className="space-y-4 operator-section">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {filteredOperators.map(op => (
                          <OperatorLogo
                            key={op.id}
                            name={op.nome}
                            imageUrl={op.logo_url}
                            selected={gracePeriodData.previousOperator === Number(op.id)}
                            onClick={(e) => handleOperatorSelect(e, op)}
                            small
                          >
                            {gracePeriodData.previousOperator === Number(op.id) && (
                              <div className="shrink-0 text-emerald-300 ml-auto text-white">
                                <Check className="h-6 w-6 p-1 bg-emerald-500 rounded-full text-white" />
                              </div>
                            )}
                          </OperatorLogo>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => handlePageChange(e, currentPage - 1)}
                            disabled={currentPage === 1 || isLoading}
                            className={`px-4 py-2 rounded flex items-center ${
                              currentPage === 1 || isLoading
                                ? 'bg-white/10 text-white/60 cursor-not-allowed'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                          </button>
                          <div className="flex gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                type="button"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => handlePageChange(e, page)}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded ${
                                  currentPage === page
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => handlePageChange(e, currentPage + 1)}
                            disabled={currentPage === totalPages || isLoading}
                            className={`px-4 py-2 rounded flex items-center ${
                              currentPage === totalPages || isLoading
                                ? 'bg-white/10 text-white/60 cursor-not-allowed'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            Próxima
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 btn-secondary flex items-center justify-center gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
          <button
            type="submit"
            className="w-1/2 btn-primary from-violet-500/80 via-purple-500/80 to-violet-500/80
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Próximo
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
