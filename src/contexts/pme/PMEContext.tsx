import React from 'react';
import { PMEFormProvider, usePMEForm } from './PMEFormContext';
import { PMECompanyProvider, usePMECompany } from './PMECompanyContext';
import { PMEContractProvider, usePMEContract } from './PMEContractContext';
import { PMEHoldersProvider, usePMEHolders } from './PMEHoldersContext';

interface PMEProviderProps {
  children: React.ReactNode;
}

export function PMEProvider({ children }: PMEProviderProps) {
  return (
    <PMEFormProvider>
      <PMECompanyProvider>
        <PMEContractProvider>
          <PMEHoldersProvider>
            {children}
          </PMEHoldersProvider>
        </PMEContractProvider>
      </PMECompanyProvider>
    </PMEFormProvider>
  );
}

// Re-exporta todos os hooks PME para facilitar o uso
export {
  usePMEForm,
  usePMECompany,
  usePMEContract,
  usePMEHolders,
};
