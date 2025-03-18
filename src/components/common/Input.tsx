import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export function Input({ error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={`
          block w-full rounded-md shadow-sm
          ${icon ? 'pl-10' : 'pl-3'}
          ${error
            ? 'border-red-500 text-red-300 placeholder-red-400 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-600 bg-white/10 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
          }
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

// Componente de máscara de input
interface MaskedInputProps extends Omit<InputProps, 'onChange'> {
  mask: (value: string) => string;
  onChange: (value: string) => void;
}

export function MaskedInput({ mask, onChange, value = '', ...props }: MaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = mask(e.target.value);
    onChange(maskedValue);
  };

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
}

// Máscaras comuns
export const masks = {
  cpf: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  },

  cnpj: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  },

  phone: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  },

  cep: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  },

  date: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substring(0, 10);
  },

  currency: (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    const numberWithDecimal = (Number(onlyNumbers) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(numberWithDecimal));
  },
};
