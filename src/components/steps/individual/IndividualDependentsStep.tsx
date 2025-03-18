import React from 'react';
import { FormField } from '../../../components/common/FormField';
import { IndividualDependentData } from '../../../types';
import { Trash2 } from 'lucide-react';
import { useIndividualDependents } from '../../../contexts/individual/IndividualDependentsContext';
import { IoPeopleOutline } from 'react-icons/io5';

interface IndividualDependentsStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  dependents: IndividualDependentData[];
  onDependentsChange: React.Dispatch<React.SetStateAction<IndividualDependentData[]>>;
}

const RELATIONSHIP_OPTIONS = [
  'Cônjuge',
  'Filho(a)',
  'Pai/Mãe',
  'Sogro(a)',
  'Outros'
];

export function IndividualDependentsStep({
  onBack,
  onSubmit,
  dependents,
  onDependentsChange,
}: IndividualDependentsStepProps) {
  const { handleDependentsSubmit } = useIndividualDependents();
  const [hasDependents, setHasDependents] = React.useState(dependents.length > 0);
  const [dependentCount, setDependentCount] = React.useState(dependents.length || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleDependentsSubmit();
      onSubmit(e);
    } catch (error) {
      console.error('Erro ao submeter dependentes:', error);
      // Aqui você pode adicionar uma notificação de erro para o usuário
    }
  };

  const handleDependentCountChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value);
    setDependentCount(count);
    setHasDependents(count > 0);

    if (count === 0) {
      onDependentsChange([]);
    } else {
      onDependentsChange(prev => {
        if (count > prev.length) {
          // Adicionar novos dependentes
          return [
            ...prev,
            ...Array(count - prev.length).fill(0).map(() => ({
              id: crypto.randomUUID(),
              name: '',
              cpf: '',
              birthDate: '',
              relationship: ''
            }))
          ];
        } else {
          // Remover dependentes excedentes
          return prev.slice(0, count);
        }
      });
    }
  }, [onDependentsChange]);

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };

  const updateDependent = React.useCallback((index: number, field: keyof IndividualDependentData, value: string) => {
    onDependentsChange(prev => {
      const updated = [...prev];
      if (field === 'cpf') {
        updated[index] = { ...updated[index], [field]: formatCpf(value) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  }, [onDependentsChange]);

  const removeDependent = React.useCallback((index: number) => {
    const newCount = dependentCount - 1;
    setDependentCount(newCount);
    setHasDependents(newCount > 0);
    onDependentsChange(prev => prev.filter((_, i) => i !== index));
  }, [dependentCount, onDependentsChange]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <IoPeopleOutline className="w-8 h-8 mr-3 text-purple-400" />
          Dependentes
        </h2>
        <p className="text-white/80 text-lg">
          Adicione os dependentes do plano
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-xl font-semibold text-white mb-4">Configuração de Dependentes</h3>
          
          <FormField label="Terá Dependentes?">
            <select
              value={hasDependents ? dependentCount.toString() : '0'}
              onChange={handleDependentCountChange}
              className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                       text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                       transition-colors [&>option]:text-purple-900 [&>option]:bg-white"
            >
              <option value="0">Não terá</option>
              <option value="1">1 dependente</option>
              <option value="2">2 dependentes</option>
              <option value="3">3 dependentes</option>
              <option value="4">4 dependentes</option>
              <option value="5">5 dependentes</option>
            </select>
          </FormField>
        </div>

        {hasDependents && dependents.map((dependent, index) => (
          <div key={index} className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {index + 1}º Dependente
              </h3>
              <button
                type="button"
                onClick={() => removeDependent(index)}
                className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-500/20"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField label="Nome Completo">
                <input
                  type="text"
                  value={dependent.name}
                  onChange={(e) => updateDependent(index, 'name', e.target.value)}
                  placeholder="Nome do dependente"
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                  required
                />
              </FormField>

              <FormField label="CPF">
                <input
                  type="text"
                  value={dependent.cpf}
                  onChange={(e) => updateDependent(index, 'cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField label="Data de Nascimento">
                <input
                  type="date"
                  value={dependent.birthDate}
                  onChange={(e) => updateDependent(index, 'birthDate', e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white focus:outline-none focus:border-white/40 transition-colors"
                  required
                />
              </FormField>

              <FormField label="Parentesco">
                <select
                  value={dependent.relationship}
                  onChange={(e) => updateDependent(index, 'relationship', e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors [&>option]:text-purple-900 [&>option]:bg-white"
                  required
                >
                  <option value="">Selecione o parentesco</option>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        ))}

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 btn-secondary flex items-center justify-center gap-2"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={
              hasDependents &&
              dependents.some(
                d => !d.name || !d.cpf || !d.birthDate || !d.relationship
              )
            }
            className="w-1/2 btn-primary from-violet-500/80 via-purple-500/80 to-violet-500/80
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}
