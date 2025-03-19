import axios from 'axios';

// Criar instância axios para a API que usará o proxy PHP
const shiftDataApi = axios.create({
  // Use o arquivo PHP como proxy para todas as requisições
  baseURL: '/api-shiftdata-proxy.php?path=',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Flag para debug
const DEBUG = true;

// Função para verificar se o token está expirado
const tokenExpirado = () => {
  const expiracao = localStorage.getItem('shiftDataExpiracao');
  if (!expiracao) {
    DEBUG && console.log('Token não encontrado no localStorage');
    return true;
  }
  
  // Adiciona margem de segurança (30 minutos)
  const agora = new Date();
  const dataExpiracao = new Date(expiracao);
  const margemSeguranca = 30 * 60 * 1000; // 30 minutos em milissegundos
  
  const resultado = agora.getTime() + margemSeguranca > dataExpiracao.getTime();
  
  DEBUG && console.log(
    resultado 
      ? `Token expira em ${new Date(dataExpiracao).toLocaleString()} (expirado ou próximo de expirar)`
      : `Token válido até ${new Date(dataExpiracao).toLocaleString()}`
  );
  
  return resultado;
};

// Função para obter novo token através do proxy PHP
const obterNovoToken = async () => {
  DEBUG && console.log('Solicitando novo token...');
  
  try {
    // Usando o endpoint PHP no mesmo servidor
    const response = await fetch('/api-auth-shiftdata-token.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accessKey: import.meta.env.VITE_SHIFTDATA_ACCESS_KEY
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao solicitar token: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.accessToken && data.expiration) {
      localStorage.setItem('shiftDataToken', data.accessToken);
      localStorage.setItem('shiftDataExpiracao', data.expiration);
      
      DEBUG && console.log(`Novo token obtido! Válido até ${new Date(data.expiration).toLocaleString()}`);
      
      return data.accessToken;
    }
    
    throw new Error('Resposta da API não contém token válido');
  } catch (error) {
    console.error('Erro ao obter token:', error);
    throw error;
  }
};

// Interceptor para gerenciar o token automaticamente
shiftDataApi.interceptors.request.use(async (config) => {
  try {
    if (tokenExpirado()) {
      DEBUG && console.log('Token expirado, renovando...');
      try {
        const novoToken = await obterNovoToken();
        config.headers.Authorization = `Bearer ${novoToken}`;
        DEBUG && console.log('Token renovado com sucesso');
      } catch (error) {
        console.error('Erro ao renovar token automaticamente:', error);
        // Em caso de falha, tenta usar o token existente no .env como fallback
        const fallbackToken = import.meta.env.VITE_SHIFTDATA_API_TOKEN;
        if (fallbackToken) {
          DEBUG && console.log('Usando token fallback do .env');
          config.headers.Authorization = `Bearer ${fallbackToken}`;
        }
      }
    } else {
      const token = localStorage.getItem('shiftDataToken');
      DEBUG && console.log('Usando token armazenado no localStorage');
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Erro no interceptor de requisição:', error);
    // Assegura que a requisição continue mesmo em caso de erro
    const fallbackToken = import.meta.env.VITE_SHIFTDATA_API_TOKEN;
    if (fallbackToken) {
      config.headers.Authorization = `Bearer ${fallbackToken}`;
    }
  }
  
  return config;
}, (error) => {
  console.error('Erro no interceptor de requisição:', error);
  return Promise.reject(error);
});

// Interceptor para tratar erros 401 (token inválido)
shiftDataApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const configOriginal = error.config;
    
    // Se o erro for 401 e não tentamos renovar o token ainda
    if (error.response?.status === 401 && !configOriginal._retry) {
      DEBUG && console.log('Recebido erro 401, tentando renovar o token...');
      configOriginal._retry = true;
      
      try {
        // Limpa os tokens armazenados
        localStorage.removeItem('shiftDataToken');
        localStorage.removeItem('shiftDataExpiracao');
        
        // Obtém novo token
        const novoToken = await obterNovoToken();
        configOriginal.headers.Authorization = `Bearer ${novoToken}`;
        
        DEBUG && console.log('Token renovado após erro 401, repetindo requisição');
        
        // Repete a requisição original com o novo token
        return shiftDataApi(configOriginal);
      } catch (refreshError) {
        console.error('Erro ao renovar token após 401:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default shiftDataApi; 