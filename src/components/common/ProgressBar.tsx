import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressBar({ currentStep, totalSteps, className = '' }: ProgressBarProps) {
  // Estado para controlar a animação
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Garantir que currentStep seja pelo menos 1
  const safeCurrentStep = Math.max(1, currentStep);
  
  // Calcula o progresso real (entre 0 e 100)
  const progress = Math.min(Math.max((safeCurrentStep / Math.max(1, totalSteps)) * 100, 0), 100);
  
  // Atualiza o progresso animado quando o progresso real muda
  useEffect(() => {
    // Pequeno atraso para garantir que a animação seja visível
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="flex justify-between text-white/80 text-sm mb-1.5">
        <span>Etapa {safeCurrentStep} de {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full transform"
          style={{ 
            width: `${animatedProgress}%`,
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
    </div>
  );
}