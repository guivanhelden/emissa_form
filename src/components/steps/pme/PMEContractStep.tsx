import React from 'react';
import { BaseStepProps } from '../../../types/base';
import { usePMEContract } from '../../../contexts/pme/PMEContext';
import { MaskedInput, masks } from '../../common/Input';
import { Card } from '../../common/Card';
import { FormField } from '../../common/FormField';
import { DataSelectionCard } from '../../common/DataSelectionCard';
import { FileText, Users, HelpCircle, DollarSign, Calendar, CheckCircle, XCircle, CreditCard } from 'lucide-react';

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

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
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

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
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

        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
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
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
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
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500/50 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
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
            disabled={!isContractDataValid}
            className="w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}