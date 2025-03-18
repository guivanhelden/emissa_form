import React, { createContext, useContext, useState } from 'react';
import { UploadedFiles, UploadedFile } from '../../types/base';

interface DocumentContextData {
  uploadedFiles: UploadedFiles;
  setUploadedFiles: (files: UploadedFiles) => void;
  addFile: (section: keyof UploadedFiles, file: UploadedFile) => void;
  removeFile: (section: keyof UploadedFiles, index: number) => void;
  clearFiles: (section: keyof UploadedFiles) => void;
  clearAllFiles: () => void;
}

interface DocumentProviderProps {
  children: React.ReactNode;
}

const DocumentContext = createContext<DocumentContextData | undefined>(undefined);

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    company: [],
    grace: [],
    beneficiaries: [],
    quotation: [],
    additional: [],
  });

  const addFile = (section: keyof UploadedFiles, file: UploadedFile) => {
    setUploadedFiles(prev => ({
      ...prev,
      [section]: [...prev[section], file],
    }));
  };

  const removeFile = (section: keyof UploadedFiles, index: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const clearFiles = (section: keyof UploadedFiles) => {
    setUploadedFiles(prev => ({
      ...prev,
      [section]: [],
    }));
  };

  const clearAllFiles = () => {
    setUploadedFiles({
      company: [],
      grace: [],
      beneficiaries: [],
      quotation: [],
      additional: [],
    });
  };

  return (
    <DocumentContext.Provider
      value={{
        uploadedFiles,
        setUploadedFiles,
        addFile,
        removeFile,
        clearFiles,
        clearAllFiles,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
