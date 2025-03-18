import React, { ReactNode } from 'react';

export interface CardProps {
  title?: string;
  icon?: ReactNode;
  children?: ReactNode;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  checkIcon?: ReactNode;
}

export function Card({ 
  title, 
  icon, 
  children, 
  selected = false,
  onClick,
  className = '',
  checkIcon
}: CardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between
        ${selected
          ? 'border-purple-500 bg-purple-500/20'
          : 'border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10'
        }
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {icon && <div className="text-white">{icon}</div>}
        {title && <h3 className="text-lg font-medium text-white">{title}</h3>}
      </div>
      {children && <div className="ml-auto">{children}</div>}
      {checkIcon}
    </div>
  );
}
