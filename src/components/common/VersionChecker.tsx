import React, { useEffect, useState } from 'react';

const VERSION_CHECK_INTERVAL = 60 * 1000; // 1 minuto

interface VersionCheckerProps {
  children?: React.ReactNode;
}

export function VersionChecker({ children }: VersionCheckerProps = {}) {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [currentAppVersion, setCurrentAppVersion] = useState('');
  
  useEffect(() => {
    // Função para obter a versão atual do servidor
    const fetchCurrentVersion = async () => {
      try {
        // Tenta buscar o arquivo na pasta assets primeiro, depois tenta na raiz como fallback
        const urls = [
          '/assets/version.json',
          '/version.json',
          '/dist/version.json'
        ];
        
        let response;
        let fetchSuccess = false;
        
        // Tenta cada URL até encontrar uma que funcione
        for (const url of urls) {
          try {
            response = await fetch(`${url}?t=${new Date().getTime()}`, {
              cache: 'no-store'
            });
            
            if (response.ok) {
              // Verificar o tipo de conteúdo antes de tentar fazer o parse como JSON
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                fetchSuccess = true;
                break;
              } else {
                console.log(`Resposta não é JSON para ${url}: ${contentType}`);
                continue;
              }
            }
          } catch (err) {
            console.log(`Falha ao buscar ${url}:`, err);
          }
        }
        
        if (fetchSuccess && response) {
          try {
            const data = await response.json();
            if (data.version) {
              setCurrentAppVersion(data.version);
              
              // Verifica a versão armazenada no localStorage
              const storedVersion = localStorage.getItem('app_version');
              
              // Se não houver versão armazenada ou for diferente da atual, atualiza
              if (!storedVersion) {
                localStorage.setItem('app_version', data.version);
              } else if (storedVersion !== data.version) {
                // Limpa o cache do navegador
                if ('caches' in window) {
                  caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                      caches.delete(cacheName);
                    });
                  });
                }
                
                // Indica que a página precisa ser atualizada
                setNeedsRefresh(true);
              }
            }
          } catch (error) {
            console.error('Erro ao verificar versão:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar versão:', error);
      }
    };
    
    // Verifica a versão imediatamente
    fetchCurrentVersion();
    
    // Configura verificação periódica
    const interval = setInterval(() => {
      fetchCurrentVersion();
    }, VERSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);
  
  console.log('Versão atual:', currentAppVersion, 'Precisa atualizar:', needsRefresh);
  
  // Se precisar atualizar, mostra um banner
  if (needsRefresh) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 flex justify-between items-center z-50 shadow-md">
          <p className="text-sm">Uma nova versão está disponível. Atualize a página para obter as últimas melhorias.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-purple-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors"
          >
            Atualizar agora
          </button>
        </div>
        {children}
      </>
    );
  }
  
  // Se não precisar atualizar, renderiza os filhos
  return <>{children}</>;
}
