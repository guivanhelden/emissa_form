import React, { useEffect, useState } from 'react';

// Versão atual da aplicação (deve ser atualizada a cada deploy)
const APP_VERSION = '1.0.0'; 
const VERSION_CHECK_INTERVAL = 60 * 1000; // 1 minuto

interface VersionCheckerProps {
  children?: React.ReactNode;
}

export function VersionChecker({ children }: VersionCheckerProps = {}) {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  
  useEffect(() => {
    // Verifica a versão armazenada no localStorage
    const storedVersion = localStorage.getItem('app_version');
    
    // Se não houver versão armazenada ou for diferente da atual, atualiza
    if (!storedVersion) {
      localStorage.setItem('app_version', APP_VERSION);
    } else if (storedVersion !== APP_VERSION) {
      // Limpa o cache do navegador
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }
      
      // Atualiza a versão no localStorage
      localStorage.setItem('app_version', APP_VERSION);
      
      // Indica que a página precisa ser atualizada
      setNeedsRefresh(true);
    }
    
    // Configura verificação periódica de versão
    const checkVersion = async () => {
      try {
        // Simula uma requisição para verificar a versão atual no servidor
        // Em produção, substitua por uma chamada real à API
        const response = await fetch('/version.json?t=' + new Date().getTime(), {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.version && data.version !== APP_VERSION) {
            setNeedsRefresh(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar versão:', error);
      }
    };
    
    // Verifica a versão imediatamente
    checkVersion();
    
    // Configura verificação periódica
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);
  
  // Se precisar atualizar, mostra um banner
  if (needsRefresh) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 flex justify-between items-center z-50">
        <p className="text-sm">Uma nova versão está disponível. Atualize a página para obter as últimas melhorias.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-white text-purple-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors"
        >
          Atualizar agora
        </button>
      </div>
    );
  }
  
  // Se não precisar atualizar, renderiza os filhos
  return <>{children}</>;
}
