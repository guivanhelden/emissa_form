import React from 'react';
import { FormField } from '../../common/FormField';
import { BrokerData, Supervisor } from '../../../types/base';
import { supabase, formatDocument, unformatDocument } from '../../../lib/supabase';
import { User, Mail, Phone, Users, Search, AlertCircle, CheckCircle } from 'lucide-react';

interface IndividualBrokerStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  brokerData: BrokerData;
  onBrokerDataChange: (data: BrokerData | ((prev: BrokerData) => BrokerData)) => void;
}

export function IndividualBrokerStep({
  onBack,
  onSubmit,
  brokerData,
  onBrokerDataChange,
}: IndividualBrokerStepProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const handleDocumentChange = async (value: string) => {
    const formattedDoc = formatDocument(value);
    onBrokerDataChange(prev => ({ ...prev, document: formattedDoc }));

    setError(null);
    setSuccess(false);
    const unformattedDoc = unformatDocument(formattedDoc);
    
    // Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos)
    if (unformattedDoc.length === 11 || unformattedDoc.length === 14) {
      setIsLoading(true);
      try {
        let formattedDocument;
        
        if (unformattedDoc.length === 11) {
          // Formata como CPF: XXX.XXX.XXX-XX
          formattedDocument = unformattedDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else {
          // Formata como CNPJ: XX.XXX.XXX/XXXX-XX
          formattedDocument = unformattedDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        
        console.log('Buscando dados para o documento:', formattedDocument);
        
        const { data, error } = await supabase
          .from('vw_corretor_backup')
          .select('id, cpf_cnpj, nome, email, equipe_id, whatsapp, equipe_nome')
          .eq('cpf_cnpj', formattedDocument)
          .single();

        console.log('Resposta do Supabase:', { data, error });

        if (error) {
          console.error('Erro Supabase:', error);
          setError('Erro ao buscar dados do corretor. Tente novamente.');
          throw error;
        }

        if (data) {
          console.log('Dados encontrados:', data);
          setSuccess(true);
          onBrokerDataChange(prev => ({
            ...prev,
            document: formattedDoc,
            name: data.nome || '',
            email: data.email || '',
            whatsapp: data.whatsapp || '',
            equipe_nome: data.equipe_nome || '',
            id: data.id
          }));
        } else {
          setError('Nenhum corretor encontrado com este documento.');
        }
      } catch (err) {
        console.error('Erro ao buscar dados do corretor:', err);
        setError('Erro ao buscar dados do corretor. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <User className="w-8 h-8 mr-3 text-purple-400" />
          Informações do Corretor
        </h2>
        <p className="text-white/80 text-lg">
          Preencha seus dados para continuar
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 text-white flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6 text-white flex items-start">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
          <span>Corretor encontrado!</span>
        </div>
      )}

      <form onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        // Validar se todos os campos necessários estão preenchidos
        if (!brokerData.document || !brokerData.name || !brokerData.email || 
            !brokerData.whatsapp || !brokerData.equipe_nome) {
          setError('Todos os campos são obrigatórios');
          return;
        }
        onSubmit(e);
      }} className="space-y-6">
        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
          {/* CPF/CNPJ */}
          <div className="w-full">
            <FormField label="CPF/CNPJ">
              <div className="relative">
                <input
                  type="text"
                  value={brokerData.document}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                         text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                         transition-colors"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-red-500 mt-2 italic flex items-center">
                <AlertCircle className="w-4 h-4 mr-1 text-purple-400 flex-shrink-0" />
                Informe seu CPF ou CNPJ para carregar seus dados automaticamente. Se ainda não for um corretor cadastrado, entre em contato com nosso time comercial.
              </p>
            </FormField>
          </div>

          {/* Nome Completo e E-mail */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <FormField label="Nome Completo">
                <div className="relative">
                  <input
                    type="text"
                    value={brokerData.name}
                    onChange={(e) => onBrokerDataChange(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>
            <div className="flex-1">
              <FormField label="E-mail">
                <div className="relative">
                  <input
                    type="email"
                    value={brokerData.email}
                    onChange={(e) => onBrokerDataChange(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>
          </div>

          {/* WhatsApp e Equipe */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <FormField label="WhatsApp">
                <div className="relative">
                  <input
                    type="tel"
                    value={brokerData.whatsapp}
                    onChange={(e) => onBrokerDataChange(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Phone className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>
            <div className="flex-1">
              <FormField label="Equipe">
                <div className="relative">
                  <input
                    type="text"
                    value={brokerData.equipe_nome}
                    className="w-full pl-12 pr-6 py-4 bg-white/10 border border-purple-500 rounded-lg
                           text-white placeholder:text-white/60 focus:outline-none focus:border-white/40
                           transition-colors"
                    required
                    disabled={true}
                    placeholder="Equipe"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 bg-white/10 py-4 px-6 border border-purple-400/30 rounded-lg shadow-lg text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
            disabled={isLoading}
          >
            ← Anterior
          </button>
          <button
            type="submit"
            disabled={
              isLoading ||
              !brokerData.document ||
              !brokerData.name ||
              !brokerData.email ||
              !brokerData.whatsapp ||
              !brokerData.equipe_nome
            }
            className="w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Carregando...' : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  );
}
