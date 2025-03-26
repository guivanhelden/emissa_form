import { createClient } from '@supabase/supabase-js'
import { CompanyData, ContractData, Dependent, GracePeriodData, Holder, UploadedFiles } from '../types/pme'

const supabaseUrl = 'https://yqnuvxpxjtkddhhpaoxv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbnV2eHB4anRrZGRoaHBhb3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ2NjA2MiwiZXhwIjoyMDQ3MDQyMDYyfQ.Pyz5SMNXy0Wz7tPZJDa9nOHHADS_kixQJVYhZraneHI'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Cliente Supabase para o banco de dados PME
const pmeDatabaseUrl = 'https://axuiroefeifjcbtokddq.supabase.co'
const pmeDatabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dWlyb2VmZWlmamNidG9rZGRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjc4ODQ4NywiZXhwIjoyMDU4MzY0NDg3fQ.CumR6RgIEB1_aYrejnafZ04LrbLY_qB8SootoCE8BQE'

export const pmeSupabase = createClient(pmeDatabaseUrl, pmeDatabaseKey)

export const formatDocument = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Verifica se é CPF ou CNPJ baseado no tamanho
  if (numbers.length <= 11) {
    // Formata como CPF: 999.999.999-99
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
  } else {
    // Formata como CNPJ: 99.999.999/0001-99
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5')
  }
}

export const unformatDocument = (value: string) => {
  return value.replace(/\D/g, '')
}

// Interface para submissão do PME
export interface PMESubmission {
  modality: string;
  operator_id: number;
  plan_name: string;
  broker_id?: number;
  company: CompanyData;
  contract: ContractData;
  grace_period: GracePeriodData;
  holders: Holder[];
  files: UploadedFiles;
}

// Função para formatar data do formato DD/MM/YYYY para YYYY-MM-DD
export const formatDateForDatabase = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  
  // Verifica se a data já está no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  
  // Converte de DD/MM/YYYY para YYYY-MM-DD
  const parts = dateString.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  return null;
}

// Função para salvar uma submissão PME completa
export const savePMESubmission = async (submission: PMESubmission) => {
  try {
    console.log('Iniciando salvamento de submissão PME:', submission);
    
    // 1. Inserir a submissão principal e obter o ID
    console.log('Inserindo submissão principal...');
    console.log('ID da operadora antes de inserir:', submission.operator_id, typeof submission.operator_id);
    
    // Garantir que o operator_id seja um número válido
    const operatorId = typeof submission.operator_id === 'number' ? submission.operator_id : 
                      (submission.operator_id ? Number(submission.operator_id) : null);
    
    console.log('ID da operadora convertido:', operatorId, typeof operatorId);
    
    const { data: submissionData, error: submissionError } = await pmeSupabase
      .from('pme_submissions')
      .insert({
        modality: submission.modality,
        operator_id: operatorId,
        plan_name: submission.plan_name,
        broker_id: submission.broker_id,
        status: 'pending'
      })
      .select('id')
      .single();

    if (submissionError) {
      console.error('Erro ao inserir submissão principal:', submissionError);
      throw submissionError;
    }
    
    console.log('Submissão principal inserida com sucesso. ID:', submissionData.id);
    const submissionId = submissionData.id;

    // 2. Inserir dados da empresa
    console.log('Inserindo dados da empresa...');
    const { data: companyData, error: companyError } = await pmeSupabase
      .from('pme_companies')
      .insert({
        submission_id: submissionId,
        cnpj: submission.company.cnpj,
        razao_social: submission.company.razaoSocial,
        nome_fantasia: submission.company.nomeFantasia,
        data_abertura: formatDateForDatabase(submission.company.dataAbertura),
        natureza_juridica: submission.company.naturezaJuridica,
        natureza_juridica_nome: submission.company.naturezaJuridicaNome,
        situacao_cadastral: submission.company.situacaoCadastral,
        cnae: submission.company.cnae,
        cnae_descricao: submission.company.cnaeDescricao,
        is_mei: submission.company.isMEI,
        tipo_logradouro: submission.company.tipoLogradouro,
        logradouro: submission.company.logradouro,
        numero: submission.company.numero,
        complemento: submission.company.complemento,
        bairro: submission.company.bairro,
        cep: submission.company.cep,
        uf: submission.company.uf,
        cidade: submission.company.cidade,
        responsavel_nome: submission.company.socios?.find(s => s.isResponsavel)?.nome || '',
        responsavel_email: submission.company.socios?.find(s => s.isResponsavel)?.email || '',
        responsavel_telefone: submission.company.socios?.find(s => s.isResponsavel)?.telefone || ''
      })
      .select('id')
      .single();

    if (companyError) {
      console.error('Erro ao inserir dados da empresa:', companyError);
      throw companyError;
    }
    
    console.log('Dados da empresa inseridos com sucesso. ID:', companyData.id);

    // 3. Inserir sócios da empresa
    if (submission.company.socios && submission.company.socios.length > 0) {
      console.log('Inserindo sócios da empresa...');
      const sociosData = submission.company.socios.map(socio => ({
        company_id: companyData.id,
        nome: socio.nome,
        is_responsavel: socio.isResponsavel,
        email: socio.email,
        telefone: socio.telefone,
        incluir_como_titular: socio.incluirComoTitular
      }));

      console.log('Dados dos sócios preparados:', sociosData);
      const { error: sociosError } = await pmeSupabase
        .from('pme_company_partners')
        .insert(sociosData);

      if (sociosError) {
        console.error('Erro ao inserir sócios da empresa:', sociosError);
        throw sociosError;
      }
      
      console.log('Sócios da empresa inseridos com sucesso.');
    }

    // 4. Inserir dados do contrato
    console.log('Inserindo dados do contrato...');
    const { error: contractError } = await pmeSupabase
      .from('pme_contracts')
      .insert({
        submission_id: submissionId,
        type: submission.contract.type,
        coparticipation: submission.contract.coparticipation,
        value: submission.contract.value,
        validity_date: submission.contract.validityDate
      });

    if (contractError) {
      console.error('Erro ao inserir dados do contrato:', contractError);
      throw contractError;
    }
    
    console.log('Dados do contrato inseridos com sucesso.');

    // 5. Inserir período de carência
    console.log('Inserindo período de carência...');
    const { error: graceError } = await pmeSupabase
      .from('pme_grace_periods')
      .insert({
        submission_id: submissionId,
        has_grace_period: submission.grace_period.hasGracePeriod,
        reason: submission.grace_period.reason,
        previous_operator_id: submission.grace_period.previousOperator
      });

    if (graceError) {
      console.error('Erro ao inserir período de carência:', graceError);
      throw graceError;
    }
    
    console.log('Período de carência inserido com sucesso.');

    // 6. Inserir titulares e dependentes
    console.log('Inserindo titulares e dependentes...');
    for (const holder of submission.holders) {
      console.log('Inserindo titular:', holder.name);
      const { data: holderData, error: holderError } = await pmeSupabase
        .from('pme_holders')
        .insert({
          submission_id: submissionId,
          name: holder.name,
          cpf: holder.cpf,
          birth_date: formatDateForDatabase(holder.birthDate),
          email: holder.email,
          phone: holder.phone
        })
        .select('id')
        .single();

      if (holderError) {
        console.error('Erro ao inserir titular:', holderError);
        throw holderError;
      }
      
      console.log('Titular inserido com sucesso. ID:', holderData.id);

      // Inserir dependentes
      if (holder.dependents && holder.dependents.length > 0) {
        console.log('Inserindo dependentes para o titular:', holder.name);
        const dependentsData = holder.dependents.map(dependent => ({
          holder_id: holderData.id,
          name: dependent.name,
          cpf: dependent.cpf,
          birth_date: formatDateForDatabase(dependent.birthDate),
          relationship: dependent.relationship
        }));

        const { error: dependentsError } = await pmeSupabase
          .from('pme_dependents')
          .insert(dependentsData);

        if (dependentsError) {
          console.error('Erro ao inserir dependentes:', dependentsError);
          throw dependentsError;
        }
        
        console.log('Dependentes inseridos com sucesso.');
      }
    }

    // 7. Inserir arquivos
    console.log('Inserindo arquivos...');
    const allFiles = [
      ...(submission.files.company || []).map(file => ({ category: 'company', ...file })),
      ...(submission.files.grace || []).map(file => ({ category: 'grace', ...file })),
      ...(submission.files.beneficiaries || []).map(file => ({ category: 'beneficiaries', ...file })),
      ...(submission.files.quotation || []).map(file => ({ category: 'quotation', ...file }))
    ];

    if (allFiles.length > 0) {
      console.log('Preparando dados dos arquivos...');
      const filesData = allFiles.map(file => ({
        submission_id: submissionId,
        category: file.category,
        file_name: file.name,
        file_path: file.url,
        file_size: file.size,
        file_type: file.type
      }));

      const { error: filesError } = await pmeSupabase
        .from('pme_files')
        .insert(filesData);

      if (filesError) {
        console.error('Erro ao inserir arquivos:', filesError);
        throw filesError;
      }
      
      console.log('Arquivos inseridos com sucesso.');
    }

    console.log('Submissão PME salva com sucesso!');
    return { success: true, submissionId };
  } catch (error) {
    console.error('Erro ao salvar submissão PME:', error);
    return { success: false, error };
  }
}

// Função para obter uma submissão PME pelo ID
export const getPMESubmission = async (submissionId: string) => {
  try {
    // 1. Obter dados da submissão principal
    const { data: submission, error: submissionError } = await pmeSupabase
      .from('pme_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;

    // 2. Obter dados da empresa
    const { data: company, error: companyError } = await pmeSupabase
      .from('pme_companies')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (companyError) throw companyError;

    // 3. Obter sócios da empresa
    const { data: partners, error: partnersError } = await pmeSupabase
      .from('pme_company_partners')
      .select('*')
      .eq('company_id', company.id);

    if (partnersError) throw partnersError;

    // 4. Obter dados do contrato
    const { data: contract, error: contractError } = await pmeSupabase
      .from('pme_contracts')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (contractError) throw contractError;

    // 5. Obter período de carência
    const { data: gracePeriod, error: graceError } = await pmeSupabase
      .from('pme_grace_periods')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (graceError) throw graceError;

    // 6. Obter titulares
    const { data: holders, error: holdersError } = await pmeSupabase
      .from('pme_holders')
      .select('*')
      .eq('submission_id', submissionId);

    if (holdersError) throw holdersError;

    // 7. Obter dependentes para cada titular
    const holdersWithDependents = await Promise.all(holders.map(async (holder) => {
      const { data: dependents, error: dependentsError } = await pmeSupabase
        .from('pme_dependents')
        .select('*')
        .eq('holder_id', holder.id);

      if (dependentsError) throw dependentsError;

      return {
        ...holder,
        dependents
      };
    }));

    // 8. Obter arquivos
    const { data: files, error: filesError } = await pmeSupabase
      .from('pme_files')
      .select('*')
      .eq('submission_id', submissionId);

    if (filesError) throw filesError;

    // Organizar arquivos por categoria
    const uploadedFiles = {
      company: files.filter(file => file.category === 'company'),
      grace: files.filter(file => file.category === 'grace'),
      beneficiaries: files.filter(file => file.category === 'beneficiaries'),
      quotation: files.filter(file => file.category === 'quotation')
    };

    return {
      success: true,
      data: {
        ...submission,
        company: {
          ...company,
          socios: partners
        },
        contract,
        grace_period: gracePeriod,
        holders: holdersWithDependents,
        files: uploadedFiles
      }
    };
  } catch (error) {
    console.error('Erro ao obter submissão PME:', error);
    return { success: false, error };
  }
}
