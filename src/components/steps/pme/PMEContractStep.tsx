import React, { useRef, useState, useEffect } from 'react';
import { BaseStepProps } from '../../../types/base';
import { usePMEContract } from '../../../contexts/pme/PMEContext';
import { MaskedInput, masks } from '../../common/Input';
import { Card } from '../../common/Card';
import { FormField } from '../../common/FormField';
import { DataSelectionCard } from '../../common/DataSelectionCard';
import { FileText, Users, HelpCircle, DollarSign, Calendar, CheckCircle, XCircle, CreditCard, AlertCircle, X } from 'lucide-react';

const contractTypes = [
  {
    id: 'compulsory',
    title: 'Compulsório',
    icon: (
      <Users className="w-6 h-6 text-purple-400" />
    )
  },
  {
    id: 'optional',
    title: 'Livre Adesão',
    icon: (
      <Users className="w-6 h-6 text-purple-400" />
    )
  },
  {
    id: 'undefined',
    title: 'Indefinido',
    icon: (
      <HelpCircle className="w-6 h-6 text-purple-400" />
    )
  }
];

const coparticipationTypes = [
  {
    id: 'full',
    title: 'Sim Completa',
    icon: (
      <DollarSign className="w-6 h-6 text-purple-400" />
    )
  },
  {
    id: 'partial',
    title: 'Sim Parcial',
    icon: (
      <CreditCard className="w-6 h-6 text-purple-400" />
    )
  },
  {
    id: 'none',
    title: 'Não',
    icon: (
      <XCircle className="w-6 h-6 text-purple-400" />
    )
  }
];

export default function PMEContractStep({ onBack, onSubmit }: BaseStepProps) {
  const {
    contractData,
    updateContractField,
    handleValueChange,
    formatValue,
    isContractDataValid,
  } = usePMEContract();
  
  // Referências para as seções do formulário
  const typeRef = useRef<HTMLDivElement>(null);
  const coparticipationRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar erros de formulário
  const [formErrors, setFormErrors] = useState({
    type: false,
    coparticipation: false,
    value: false,
    validityDate: false
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

  // Função para validar e enviar o formulário
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar campos obrigatórios
    const errors = {
      type: !contractData.type,
      coparticipation: !contractData.coparticipation,
      value: !contractData.value,
      validityDate: !contractData.validityDate
    };
    
    setFormErrors(errors);
    
    // Se há algum erro, mostrar mensagem
    if (errors.type || errors.coparticipation || errors.value || errors.validityDate) {
      let targetRef = null;
      let message = '';
      
      if (errors.type) {
        message = 'Por favor, selecione um tipo de contratação';
        targetRef = typeRef;
      } else if (errors.coparticipation) {
        message = 'Por favor, selecione uma opção de coparticipação';
        targetRef = coparticipationRef;
      } else if (errors.value) {
        message = 'Por favor, informe o valor do contrato';
        targetRef = valuesRef;
      } else if (errors.validityDate) {
        message = 'Por favor, informe a data de vigência';
        targetRef = valuesRef;
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
          <FileText className="w-8 h-8 mr-3 text-purple-400" />
          Detalhes do Contrato
        </h2>
        <p className="text-white/80 text-lg">
          Informe os detalhes da contratação
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div 
          className={`bg-white/10 rounded-lg p-6 space-y-6 border shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20 ${
            formErrors.type 
              ? 'border-red-500' 
              : 'border-purple-400/30'
          }`}
          ref={typeRef}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <Users className="w-6 h-6 mr-3 text-purple-400" />
            Tipo da Contratação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contractTypes.map((type) => (
              <Card
                key={type.id}
                title={type.title}
                icon={type.icon}
                selected={contractData.type === type.id}
                onClick={() => updateContractField('type', type.id)}
                checkIcon={contractData.type === type.id ? <CheckCircle className="w-6 h-6 text-emerald-500 absolute top-2 right-2" /> : null}
              />
            ))}
          </div>
        </div>

        <div 
          className={`bg-white/10 rounded-lg p-6 space-y-6 border shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20 ${
            formErrors.coparticipation 
              ? 'border-red-500' 
              : 'border-purple-400/30'
          }`}
          ref={coparticipationRef}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <CreditCard className="w-6 h-6 mr-3 text-purple-400" />
            Coparticipação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coparticipationTypes.map((type) => (
              <Card
                key={type.id}
                title={type.title}
                icon={type.icon}
                selected={contractData.coparticipation === type.id}
                onClick={() => updateContractField('coparticipation', type.id)}
                checkIcon={contractData.coparticipation === type.id ? <CheckCircle className="w-6 h-6 text-emerald-500 absolute top-2 right-2" /> : null}
              />
            ))}
          </div>
        </div>

        <div 
          className={`bg-white/10 rounded-lg p-6 space-y-6 border shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20 ${
            formErrors.value || formErrors.validityDate
              ? 'border-red-500' 
              : 'border-purple-400/30'
          }`}
          ref={valuesRef}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center border-b border-purple-400/30 pb-3">
            <DollarSign className="w-6 h-6 mr-3 text-purple-400" />
            Valores e Datas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Valor do contrato">
              <div className="relative">
                <MaskedInput
                  type="text"
                  value={formatValue(contractData.value || 0)}
                  onChange={handleValueChange}
                  mask={masks.currency}
                  placeholder="R$ 0,00"
                  className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors ${formErrors.value ? 'border-red-500' : 'border-purple-500/50'}`}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                </div>
              </div>
            </FormField>

            <FormField label="Data da Vigência">
              <div className="relative">
                <input
                  type="date"
                  value={contractData.validityDate || ''}
                  onChange={(e) => updateContractField('validityDate', e.target.value)}
                  className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors ${formErrors.validityDate ? 'border-red-500' : 'border-purple-500/50'}`}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </FormField>
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