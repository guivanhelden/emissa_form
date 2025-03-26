import React from 'react';

const CheckIcon = () => (
  <div className="absolute top-0 right-0 translate-x-2 -translate-y-2 text-white">
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#10B981" /> {/* Verde forte (Tailwind 'green-500') */}
      <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);


export interface OperatorLogoProps {
  name: string;
  imageUrl?: string | null;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  small?: boolean;
  children?: React.ReactNode;
}

export function OperatorLogo({ name, imageUrl, selected, onClick, small, children }: OperatorLogoProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`
        relative ${small ? 'aspect-[5/2]' : 'aspect-[16/9]'}
        rounded-lg ${small ? 'p-1' : 'p-2'}
        flex items-center justify-center
        transition-all duration-300
        ${selected 
          ? 'bg-fuchsia-500/70 border-2 border-pink-200 shadow-lg scale-105' 
          : 'bg-white/10 border border-purple-500 hover:bg-white/20'
        }
      `}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={`Logo ${name}`}
            className="max-w-[90%] max-h-[90%] object-contain rounded-md"
            onError={(e) => {
              console.error('Erro ao carregar logo:', imageUrl);
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <span className="text-white text-sm font-medium text-center hidden">
            {name}
          </span>
        </>
      ) : (
        <span className="text-white text-sm font-medium text-center">
          {name}
        </span>
      )}

      {selected && <CheckIcon />}  {/* Checa se está selecionado e renderiza o ícone */}

      {selected && (
        <div className="absolute inset-0 bg-white/10 rounded-lg" />
      )}
      
      {children}
    </button>
  );
}
