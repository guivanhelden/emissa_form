import React from 'react';
import { FormField } from '../../../components/common/FormField';
import { Upload, Users, FileCheck, Clock, Plus, X, AlertCircle, Check, File } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useDocument } from '../../../contexts/base/DocumentContext';
import { UploadedFiles } from '../../../types/base';

// Interface estendida para arquivos com path (usado internamente no componente)
interface FileWithPath {
  url: string;
  name: string;
  path: string;
}

interface IndividualDocumentsStepProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent, files: UploadedFiles) => void;
}

export function IndividualDocumentsStep({
  onBack,
  onSubmit,
}: IndividualDocumentsStepProps) {
  const { setUploadedFiles, uploadedFiles: contextUploadedFiles } = useDocument();
  const [uploadedFiles, setLocalUploadedFiles] = React.useState<Record<string, FileWithPath[]>>({
    beneficiaries: [],
    quotation: [],
    grace: [],
    additional: []
  });

  // Sincronizar o estado local com o contexto global quando o componente é montado
  React.useEffect(() => {
    if (contextUploadedFiles) {
      // Convertemos os arquivos do contexto para o formato local com path
      const localFiles: Record<string, FileWithPath[]> = {
        beneficiaries: [],
        quotation: [],
        grace: [],
        additional: []
      };
      
      // Para cada categoria, verificamos se existem arquivos no contexto e os convertemos
      Object.keys(localFiles).forEach((category) => {
        if (contextUploadedFiles[category as keyof UploadedFiles]) {
          localFiles[category] = contextUploadedFiles[category as keyof UploadedFiles].map(file => {
            // Assumimos que os arquivos no contexto têm a propriedade path
            return file as unknown as FileWithPath;
          });
        }
      });
      
      setLocalUploadedFiles(localFiles);
      console.log('[IndividualDocumentsStep] Estado local sincronizado com contexto:', localFiles);
    }
  }, [contextUploadedFiles]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    // Verificamos se a categoria é válida para o contexto global
    if (!['beneficiaries', 'quotation', 'grace', 'additional'].includes(category)) {
      console.error(`Categoria inválida: ${category}`);
      return;
    }

    const files = Array.from(e.target.files || []);
    const maxFiles = category === 'additional' ? 10 : category === 'beneficiaries' ? 10 : 5;
    const maxSize = 2 * 1024 * 1024; // 2MB

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
      const folderMap: Record<string, string> = {
        beneficiaries: 'Documentos_Titular_Dependentes',
        quotation: 'Cotacao',
        grace: 'Documento_Carencia',
        additional: 'Documentos_Adicionais'
      };

      const uploadedUrls: FileWithPath[] = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${folderMap[category]}/${fileName}`;

          try {
            const { error: uploadError } = await supabase.storage
              .from('emissao_pf')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Erro no upload:', uploadError);
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('emissao_pf')
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

      // Atualiza o estado local
      setLocalUploadedFiles((prev: Record<string, FileWithPath[]>) => {
        const newLocalFiles = { ...prev };
        newLocalFiles[category] = [...(prev[category] || []), ...uploadedUrls];
        return newLocalFiles;
      });
      
      // Atualiza o contexto global
      // Criamos uma cópia do objeto anterior e adicionamos os novos arquivos
      const newGlobalFiles: UploadedFiles = {
        company: [...contextUploadedFiles.company],
        beneficiaries: [...contextUploadedFiles.beneficiaries],
        quotation: [...contextUploadedFiles.quotation],
        grace: [...contextUploadedFiles.grace],
        additional: [...contextUploadedFiles.additional]
      };
      
      // Adicionamos os novos arquivos na categoria específica
      // Convertemos FileWithPath para UploadedFile removendo a propriedade path
      const filesForContext = uploadedUrls.map(file => ({
        url: file.url,
        name: file.name
      }));
      
      newGlobalFiles[category as keyof UploadedFiles] = [
        ...newGlobalFiles[category as keyof UploadedFiles],
        ...filesForContext
      ];
      
      console.log('[IndividualDocumentsStep] Arquivos atualizados no contexto:', newGlobalFiles);
      setUploadedFiles(newGlobalFiles);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`Erro ao fazer upload dos arquivos: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const removeFile = async (category: string, index: number) => {
    // Verificamos se a categoria é válida para o contexto global
    if (!['beneficiaries', 'quotation', 'grace', 'additional'].includes(category)) {
      console.error(`Categoria inválida: ${category}`);
      return;
    }

    if (!uploadedFiles[category] || !uploadedFiles[category][index]) {
      console.error(`Arquivo não encontrado: categoria ${category}, índice ${index}`);
      return;
    }

    const file = uploadedFiles[category][index];
    
    try {
      // Apenas tentamos remover do storage se tivermos o path do arquivo
      if (file.path) {
        const { error } = await supabase.storage
          .from('emissao_pf')
          .remove([file.path]);

        if (error) {
          console.error('Erro ao remover arquivo do storage:', error);
          // Continuamos mesmo com erro para atualizar a UI
        }
      }

      // Atualiza o estado local
      setLocalUploadedFiles((prev: Record<string, FileWithPath[]>) => {
        const newLocalFiles = { ...prev };
        newLocalFiles[category] = prev[category].filter((_: FileWithPath, i: number) => i !== index);
        return newLocalFiles;
      });
      
      // Atualiza o contexto global
      // Criamos uma cópia do objeto anterior
      const newGlobalFiles: UploadedFiles = {
        company: [...contextUploadedFiles.company],
        beneficiaries: [...contextUploadedFiles.beneficiaries],
        quotation: [...contextUploadedFiles.quotation],
        grace: [...contextUploadedFiles.grace],
        additional: [...contextUploadedFiles.additional]
      };
      
      // Removemos o arquivo da categoria específica
      newGlobalFiles[category as keyof UploadedFiles] = 
        newGlobalFiles[category as keyof UploadedFiles].filter((_: any, i: number) => i !== index);
      
      console.log('[IndividualDocumentsStep] Arquivo removido do contexto:', category, index);
      setUploadedFiles(newGlobalFiles);
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      alert('Erro ao remover o arquivo. Por favor, tente novamente.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[IndividualDocumentsStep] Estado local dos arquivos:', uploadedFiles);
    console.log('[IndividualDocumentsStep] Contexto dos arquivos:', contextUploadedFiles);
    // Usar os arquivos do contexto no submit
    onSubmit(e, contextUploadedFiles);
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'beneficiaries': return <Users className="text-purple-400" size={24} />;
      case 'quotation': return <FileCheck className="text-purple-400" size={24} />;
      case 'grace': return <Clock className="text-purple-400" size={24} />;
      case 'additional': return <Plus className="text-purple-400" size={24} />;
      default: return <File className="text-purple-400" size={24} />;
    }
  };

  const renderFileList = (category: string) => {
    // Verificamos se a categoria existe no estado local
    if (!uploadedFiles[category]) {
      return null;
    }
    
    return (
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
  };

  const renderUploadField = (
    category: string, 
    label: string, 
    description: React.ReactNode,
    required: boolean = false
  ) => (
    <div className="bg-white/5 p-5 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 shadow-lg shadow-purple-900/10">
      <div className="flex items-center mb-3">
        {getCategoryIcon(category)}
        <h3 className="text-xl font-semibold text-white ml-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </h3>
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
          <p>
            {category === 'beneficiaries' || category === 'additional' 
              ? 'Máximo de 10 arquivos, 2MB cada. Formatos aceitos: PDF, JPG, PNG' 
              : 'Máximo de 5 arquivos, 2MB cada. Formatos aceitos: PDF, JPG, PNG'}
          </p>
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
    <div className="w-full max-w-3xl mx-auto">
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
          'beneficiaries',
          'Documentos do Titular e Dependentes',
          <div>
            <p className="font-medium mb-1">Documentação necessária:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>RG ou CNH do titular</li>
              <li>CPF do titular e dependentes</li>
              <li>Comprovante de residência</li>
              <li>Certidão de nascimento (para dependentes menores)</li>
            </ul>
          </div>,
          true
        )}

        {renderUploadField(
          'quotation',
          'Anexar Cotação',
          <p className="text-sm">Anexe aqui a cotação aprovada pelo cliente.</p>,
          true
        )}

        {renderUploadField(
          'grace',
          'Anexar Documento de Carência',
          <p className="text-sm">Anexe aqui o documento de carência, se aplicável.</p>
        )}

        {renderUploadField(
          'additional',
          'Documentos Adicionais',
          <p className="text-sm">Qualquer documento adicional que julgue necessário para a emissão.</p>
        )}

        <div className="flex gap-4 mt-10 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            ← Anterior
          </button>
          <button
            type="submit"
            className="w-1/2 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500
                    flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-lg shadow-purple-900/30
                    hover:shadow-purple-900/50 transition-all duration-200"
          >
            <Upload size={18} />
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}
