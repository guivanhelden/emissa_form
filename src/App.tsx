import { useEffect } from 'react';
import { Header } from './components/common/Header';
import { InitialStep } from './components/steps/InitialStep';
import { BaseProvider } from './contexts/base/BaseContext';
import { BrokerProvider } from './contexts/base/BrokerContext';
import { OperatorProvider } from './contexts/base/OperatorContext';
import { DocumentProvider } from './contexts/base/DocumentContext';
import { PMEProvider } from './contexts/pme/PMEContext';
import { IndividualProvider } from './contexts/individual/IndividualContext';
import { IndividualFlow } from './components/flows/IndividualFlow';
import PMEFlow from './components/flows/PMEFlow';
import { useBase } from './hooks/base';
import { FormType } from './types/base';
import { VersionChecker } from './components/common/VersionChecker';
import ErrorBoundary from './components/common/ErrorBoundary';
import { routeGuard } from './lib/routeGuard';
import { debugUtils } from './lib/debugUtils';

// Mapeamento dos passos para números
const pmeStepToNumber: Record<string, number> = {
  broker: 1,
  modality: 2,
  contract: 3,
  company: 4,
  holders: 5,
  grace: 6,
  documents: 7,
  review: 8
};

const individualStepToNumber: Record<string, number> = {
  broker: 1,
  plan: 2,
  holder: 3,
  dependents: 4,
  grace: 5,
  documents: 6,
  review: 7
};

const AppContent = () => {
  const { formType, setFormType } = useBase();
  
  // Processa parâmetros da URL, incluindo configurações de idioma
  useEffect(() => {
    routeGuard.processUrlParameters();
  }, []);
  
  // Adiciona evento para preparar navegação segura antes de mudar de rota
  useEffect(() => {
    const handleRouteChange = () => {
      routeGuard.prepareForNavigation();
    };
    
    window.addEventListener('routechange', handleRouteChange);
    
    return () => {
      window.removeEventListener('routechange', handleRouteChange);
    };
  }, []);

  // Adiciona tratamento para erros de Intl.NumberFormat
  useEffect(() => {
    try {
      // Testa se o formatador de números funciona corretamente
      new Intl.NumberFormat('pt-BR').format(1234.56);
      debugUtils.log('Formatador de números está funcionando corretamente');
    } catch (error) {
      debugUtils.log(`Erro no formatador de números: ${error}`);
      // Se houver erro, força o uso do locale en-US
      localStorage.setItem('forceLocale', 'en-US');
    }
  }, []);

  const handleTypeSelection = (type: FormType) => {
    if (type) setFormType(type);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-violet-950 flex flex-col`}>
      {formType === null ? (
        <div className="flex-1 flex flex-col p-4 pt-6 md:pt-8">
          <InitialStep onTypeSelect={handleTypeSelection} />
        </div>
      ) : (
        <>
          <div className="px-4 py-3 md:py-4">
            <Header />
          </div>
          <div className="flex-1 flex flex-col px-4 md:px-6 py-3 md:py-4 max-w-4xl mx-auto w-full">
            {formType === 'pme' ? (
              <PMEProvider>
                <PMEFlow />
              </PMEProvider>
            ) : (
              <IndividualProvider>
                <IndividualFlow />
              </IndividualProvider>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BaseProvider>
        <BrokerProvider>
          <OperatorProvider>
            <DocumentProvider>
              <VersionChecker>
                <AppContent />
              </VersionChecker>
            </DocumentProvider>
          </OperatorProvider>
        </BrokerProvider>
      </BaseProvider>
    </ErrorBoundary>
  );
}

export default App;
