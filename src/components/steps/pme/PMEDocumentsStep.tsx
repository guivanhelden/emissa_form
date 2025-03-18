import React from 'react';
import { FormField } from '../../../components/common/FormField';
import { Upload, FileText, Users, FileCheck, Clock, Plus, File, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useDocument } from '../../../contexts/base/DocumentContext';

interface UploadedFiles {
  company: { url: string; name: string; path: string }[];
  beneficiaries: { url: string; name: string; path: string }[];
  quotation: { url: string; name: string; path: string }[];
  grace: { url: string; name: string; path: string }[];
  additional: { url: string; name: string; path: string }[];
}

interface PMEDocumentsStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent, files: UploadedFiles) => void;
}

export default function PMEDocumentsStep({
  onBack,
  onSubmit,
}: PMEDocumentsStepProps) {
  const { setUploadedFiles, uploadedFiles: contextUploadedFiles } = useDocument();
  const [uploadedFiles, setLocalUploadedFiles] = React.useState<UploadedFiles>({
    company: [],
    beneficiaries: [],
    quotation: [],
    grace: [],
    additional: []
  });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: keyof UploadedFiles
  ) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = category === 'additional' ? 10 : 
                     category === 'beneficiaries' ? 99 : 
                     category === 'company' ? 999 : 5;
    const maxSize = 5 * 1024 * 1024; // 5MB


    // Validar número de arquivos
    if (files.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos para ${category}`);
      return;
    }

    // Validar tamanho dos arquivos
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`Arquivo ${file.name} excede o limite de 2MB`);
        return;
      }
    }

    try {
      const folderMap = {
        company: 'Documentos_Empresa',
        beneficiaries: 'Documentos_Titular_Dependentes',
        quotation: 'Cotacao',
        grace: 'Documento_Carencia',
        additional: 'Documentos_Adicionais'
      };

      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${folderMap[category]}/${fileName}`;

          try {
            const { error: uploadError } = await supabase.storage
              .from('emissao_pme')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Erro no upload:', uploadError);
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('emissao_pme')
              .getPublicUrl(filePath);

            return {
              url: publicUrl,
              name: file.name,
              path: filePath
            };
          } catch (error) {
            console.error(`Erro ao fazer upload do arquivo ${file.name}:`, error);
            throw error;
          }
        })
      );

      setLocalUploadedFiles(prev => ({
        ...prev,
        [category]: [...prev[category], ...uploadedUrls]
      }));
      
      // Atualizar o contexto global com os arquivos
      setUploadedFiles(prev => {
        const newFiles = {
          ...prev,
          [category]: [...(prev[category] || []), ...uploadedUrls]
        };
        console.log('[PMEDocumentsStep] Arquivos atualizados no contexto:', newFiles);
        return newFiles;
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`Erro ao fazer upload dos arquivos: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const removeFile = async (category: keyof UploadedFiles, index: number) => {
    const file = uploadedFiles[category][index];
    const fileName = file.path.split('/').pop();

    try {
      const { error } = await supabase.storage
        .from('emissao_pme')
        .remove([file.path]);

      if (error) {
        throw error;
      }

      setLocalUploadedFiles(prev => ({
        ...prev,
        [category]: prev[category].filter((_, i) => i !== index)
      }));
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      alert('Erro ao remover o arquivo. Por favor, tente novamente.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PMEDocumentsStep] Estado local dos arquivos:', uploadedFiles);
    console.log('[PMEDocumentsStep] Contexto dos arquivos:', contextUploadedFiles);
    // Usar os arquivos do contexto no submit
    onSubmit(e, contextUploadedFiles);
  };

  const renderFileList = (category: keyof UploadedFiles) => (
    <div className="mt-2 space-y-2">
      {uploadedFiles[category].map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-purple-500/30 hover:border-purple-500/60 transition-all duration-200"
        >
          <div className="flex items-center">
            <File size={18} className="text-purple-400 mr-2" />
            <span className="text-white/90 truncate">{file.name}</span>
          </div>
          <button
            type="button"
            onClick={() => removeFile(category, index)}
            className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-white/5"
            aria-label="Remover arquivo"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );

  // Função para renderizar o ícone correto para cada categoria
  const getCategoryIcon = (category: keyof UploadedFiles) => {
    switch(category) {
      case 'company': return <FileText className="text-purple-400" size={24} />;
      case 'beneficiaries': return <Users className="text-purple-400" size={24} />;
      case 'quotation': return <FileCheck className="text-purple-400" size={24} />;
      case 'grace': return <Clock className="text-purple-400" size={24} />;
      case 'additional': return <Plus className="text-purple-400" size={24} />;
      default: return <File className="text-purple-400" size={24} />;
    }
  };

  // Função para renderizar o campo de upload com estilo melhorado
  const renderUploadField = (
    category: keyof UploadedFiles, 
    label: string, 
    description: React.ReactNode
  ) => (
    <div className="bg-white/5 p-5 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 shadow-lg shadow-purple-900/10">
      <div className="flex items-center mb-3">
        {getCategoryIcon(category)}
        <h3 className="text-xl font-semibold text-white ml-2">{label}</h3>
      </div>
      
      <div className="mb-4 text-white/80 pl-2 border-l-2 border-purple-500/50">
        {description}
      </div>
      
      <div className="relative">
        <input
          type="file"
          onChange={(e) => handleFileChange(e, category)}
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="w-full px-6 py-4 bg-white/10 border-2 border-dashed border-purple-500/50 rounded-lg
                   text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg
                   file:border-0 file:bg-purple-500 file:text-white
                   hover:file:bg-purple-400 file:cursor-pointer hover:border-purple-500
                   focus:outline-none focus:border-white/40 transition-all duration-200"
        />
        <div className="mt-2 flex items-center text-sm text-white/60">
          <AlertCircle size={16} className="mr-1" />
          <p>Tamanho máximo de 5MB por arquivo. Formatos aceitos: PDF, JPG, PNG</p>
        </div>
      </div>
      
      {uploadedFiles[category].length > 0 && (
        <div className="mt-3 p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="flex items-center mb-2 text-white/90">
            <Check size={16} className="mr-1 text-green-400" />
            <span className="text-sm font-medium">
              {uploadedFiles[category].length} {uploadedFiles[category].length === 1 ? 'arquivo enviado' : 'arquivos enviados'}
            </span>
          </div>
          {renderFileList(category)}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Upload className="w-8 h-8 mr-3 text-purple-400" />
          Upload de Documentos
        </h2>
        <p className="text-white/80 text-lg">
          Faça o upload dos documentos necessários para emissão do contrato
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderUploadField(
          'company',
          'Documentos da Empresa',
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Contrato Social ou Requerimento do Empresário ou Certificado de Microempreendedor (MEI)</li>
            <li>RG ou CNH do responsável pela empresa</li>
            <li>Cartão CNPJ</li>
          </ul>
        )}

        {renderUploadField(
          'beneficiaries',
          'Documentos do Titular e Dependentes',
          <div>
            <p className="font-medium mb-1">Documentação conforme grau de parentesco:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Cônjuge: certidão de casamento ou declaração de união estável</li>
              <li>Filhos: certidão de nascimento ou documento de identificação</li>
              <li>Enteados: documento que comprove vínculo com cônjuge do titular</li>
              <li>Demais dependentes: documentos que comprovem o grau de parentesco</li>
            </ul>
          </div>
        )}

        {renderUploadField(
          'quotation',
          'Anexar Cotação',
          <p className="text-sm">Anexe aqui a cotação realizada no PDC.</p>
        )}

        {renderUploadField(
          'grace',
          'Anexar Documento de Carência',
          <p className="text-sm">Anexe aqui o documento de carência.</p>
        )}

        {renderUploadField(
          'additional',
          'Documentos Adicionais',
          <p className="text-sm">Qualquer documento que julgue necessário e pertinente para emissão do contrato.</p>
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
    </div>
  );
}
