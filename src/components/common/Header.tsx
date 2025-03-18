import React from 'react';
import { ChevronLeft, HelpCircle, Bell } from 'lucide-react';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
  title?: string;
}

export function Header({ 
  showBackButton = false, 
  onBackClick, 
  title = "Emissão Saúde VH"
}: HeaderProps) {
  return (
    <header className="w-full border-b border-white/10 backdrop-blur-md bg-gradient-to-r from-violet-950/50 to-purple-950/50">
      <div className="w-full max-w-4xl mx-auto px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex items-center justify-between">
          {/* Lado esquerdo - Logo e título */}
          <div className="flex items-center gap-2 md:gap-3">
            {showBackButton && (
              <button 
                onClick={onBackClick}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors mr-1"
                aria-label="Voltar"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
            )}
            
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src="https://doc.vhseguros.com.br/logos_vh/VAN-HELDEN-branco.png"
                alt="Van Helden Seguros"
                className="h-7 md:h-10 drop-shadow-md"
              />
              
              <div className="hidden sm:block h-8 w-px bg-purple-500/30" />
              
              <div className="flex flex-col">
                <h2 className="text-base md:text-lg text-white font-medium leading-tight">
                  {title}
                </h2>
                <p className="text-xs text-purple-200/70 hidden sm:block">
                  Ao lado do corretor sempre!
                </p>
              </div>
            </div>
          </div>
          
          {/* Lado direito - Ícones de ação */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors relative"
              aria-label="Notificações"
            >
              <Bell size={18} className="text-white/80 hover:text-white" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
            </button>
            
            <button 
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Ajuda"
            >
              <HelpCircle size={18} className="text-white/80 hover:text-white" />
            </button>
            
            <div className="ml-1.5 md:ml-2 pl-1.5 md:pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-medium text-xs shadow-md">
                VH
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
