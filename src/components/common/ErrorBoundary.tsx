import { Component, ErrorInfo, ReactNode } from 'react';
import { debugUtils } from '../../lib/debugUtils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente que captura erros em qualquer componente filho
 * e exibe uma UI de fallback em vez de falhar completamente
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Registra o erro para análise posterior
    debugUtils.log(`Erro capturado pelo ErrorBoundary: ${error.message}`);
    debugUtils.log(`Informações do erro: ${errorInfo.componentStack}`);
    
    // Aqui você poderia enviar o erro para um serviço de monitoramento como Sentry
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderiza a UI de fallback personalizada ou a padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-4">
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Algo deu errado</h2>
            <p className="mb-4">Ocorreu um erro inesperado. Tente recarregar a página.</p>
            {this.state.error && (
              <div className="bg-white/10 p-3 rounded text-sm mb-4 overflow-auto max-h-32">
                <p className="font-mono">{this.state.error.message}</p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md font-medium hover:from-purple-600 hover:to-indigo-600 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
