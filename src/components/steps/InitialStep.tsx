import React from 'react';
import { Users, GraduationCap, ArrowRight } from 'lucide-react';

const cardClass = `
  relative overflow-hidden
  flex flex-col items-center justify-center gap-4 md:gap-6 p-6 md:p-8
  rounded-2xl backdrop-blur-md transition-all duration-300
  border border-white/10 hover:border-white/20
  bg-gradient-to-br from-violet-900/40 to-purple-800/40
  hover:from-violet-800/50 hover:to-purple-700/50
  hover:shadow-xl hover:shadow-purple-900/20
  hover:scale-[1.02] cursor-pointer
`;

interface InitialStepProps {
  onTypeSelect: (type: 'pme' | 'individual') => void;
}

export function InitialStep({ onTypeSelect }: InitialStepProps) {
  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-violet-500/10 blur-[80px]" />
        <div className="absolute top-[30%] left-[20%] w-[25%] h-[25%] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>
      
      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-6 animate-fadeIn">
        <img 
          src="https://doc.vhseguros.com.br/logos_vh/VAN-HELDEN-branco.png"
          alt="Van Helden Seguros"
          className="w-56 md:w-64 mx-auto mb-10 md:mb-14 drop-shadow-lg"
        />
        
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
            Bem-vindo, Corretor!
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto">
            Selecione o tipo de emissão que deseja realizar hoje
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 w-full max-w-4xl mx-auto">
          <div 
            className={cardClass}
            onClick={() => onTypeSelect('pme')}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Users size={32} className="text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Plano PME</h2>
            <p className="text-white/70 mb-1 md:mb-2">Planos para pequenas e médias empresas</p>
            <div className="flex items-center text-purple-300 font-medium mt-1 md:mt-2 group">
              <span>Iniciar emissão</span>
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          <div 
            className={cardClass}
            onClick={() => onTypeSelect('individual')}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-fuchsia-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Individual/Adesão</h2>
            <p className="text-white/70 mb-1 md:mb-2">Planos individuais e por adesão</p>
            <div className="flex items-center text-purple-300 font-medium mt-1 md:mt-2 group">
              <span>Iniciar emissão</span>
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
        
        <div className="mt-10 md:mt-14 text-white/50 text-sm">
          © {new Date().getFullYear()} Van Helden Seguros • Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}
