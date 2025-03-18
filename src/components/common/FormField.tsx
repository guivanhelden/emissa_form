import React, { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  className?: string;
  required?: boolean;
  description?: string;
}

export function FormField({ 
  label, 
  children, 
  error, 
  className = '',
  required = false,
  description
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between">
        <label className="block text-sm font-medium text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {description && (
        <p className="text-sm text-white/60">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
