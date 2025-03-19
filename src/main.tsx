import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { routeGuard } from './lib/routeGuard';
import { debugUtils } from './lib/debugUtils';

// Ativar debug em ambiente de desenvolvimento
if (import.meta.env.DEV) {
  debugUtils.enable();
}

// Manipulador global de erros não capturados
window.addEventListener('error', (event) => {
  // Registra o erro detalhadamente
  console.error('Erro não capturado:', event.error);
  console.error('Mensagem de erro:', event.error?.message);
  console.error('Stack trace:', event.error?.stack);
  
  // Habilitar debug temporariamente para capturar este erro
  const wasEnabled = debugUtils.enabled;
  debugUtils.enable();
  
  // Registra informações detalhadas de depuração
  debugUtils.log('Erro não capturado em detalhe:');
  debugUtils.log(`Mensagem: ${event.error?.message}`);
  debugUtils.log(`URL: ${event.filename}`);
  debugUtils.log(`Linha: ${event.lineno}, Coluna: ${event.colno}`);
  debugUtils.log(`Stack: ${event.error?.stack}`);
  debugUtils.log(`Browser locale: ${navigator.language}`);
  debugUtils.log(`Document language: ${document.documentElement.lang}`);
  
  // Se for o erro específico de removeChild, previne a tela branca
  if (event.error && event.error.message && 
      (event.error.message.includes('removeChild') && event.error.message.includes('not a child')) ||
      event.error.message.includes('locale') || 
      event.error.message.includes('Intl')) {
    
    // Registra informações de debug
    debugUtils.log('Erro potencialmente relacionado à localização detectado e tratado');
    
    // Previne o comportamento padrão que causaria tela branca
    event.preventDefault();
    
    // Tenta limpar recursos após o erro
    routeGuard.cleanupAfterNavigation();
    
    // Tenta recarregar a página com parâmetro para forçar inglês
    if (!window.location.href.includes('forceLocale')) {
      debugUtils.log('Tentando recarregar com locale forçado');
      localStorage.setItem('forceLocale', 'en-US');
      window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'forceLocale=en-US';
    }
  }
  
  // Restaura estado do debug
  if (!wasEnabled) {
    debugUtils.disable();
  }
});

// Adiciona monitoramento para mudanças de rota
const originalPushState = history.pushState;
history.pushState = function(...args) {
  // Executa a função original
  const result = originalPushState.apply(this, args);
  
  // Prepara para navegação segura
  routeGuard.prepareForNavigation();
  
  // Dispara evento personalizado
  window.dispatchEvent(new Event('routechange'));
  
  return result;
};

// Adiciona monitoramento para navegação com botões do navegador
window.addEventListener('popstate', () => {
  routeGuard.prepareForNavigation();
});

// Verifica se há configuração de locale forçado
if (localStorage.getItem('forceLocale')) {
  debugUtils.log(`Usando locale forçado: ${localStorage.getItem('forceLocale')}`);
}

// Cria a raiz do React de forma segura
const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Erro ao renderizar aplicação:', error);
    
    // Renderiza uma mensagem de erro amigável em vez de tela branca
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(to bottom right, #2e1065, #1e1b4b, #4c1d95); color: white; text-align: center; padding: 20px;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Ops! Algo deu errado.</h1>
        <p style="font-size: 16px; max-width: 500px; margin-bottom: 24px;">Estamos enfrentando um problema técnico. Por favor, tente recarregar a página.</p>
        <button onclick="window.location.reload()" style="background: linear-gradient(to right, #8b5cf6, #6d28d9); border: none; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer;">
          Recarregar página
        </button>
        <button onclick="localStorage.setItem('forceLocale', 'en-US'); window.location.reload()" style="background: linear-gradient(to right, #4c1d95, #3730a3); border: none; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 12px;">
          Tentar em inglês
        </button>
      </div>
    `;
  }
}
