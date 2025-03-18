import { useDocument as useBaseDocument } from '../../contexts/base/DocumentContext';
import { UploadedFile } from '../../types/base';

export function useDocument() {
  const {
    uploadedFiles,
    setUploadedFiles,
    addFile,
    removeFile,
    clearFiles,
    clearAllFiles,
  } = useBaseDocument();

  const handleFileUpload = async (section: keyof typeof uploadedFiles, file: File) => {
    try {
      // Aqui você pode implementar a lógica de upload do arquivo
      // Por exemplo, enviar para um servidor ou armazenar localmente
      const uploadedFile: UploadedFile = {
        url: URL.createObjectURL(file),
        name: file.name,
      };

      addFile(section, uploadedFile);
      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleMultipleFileUpload = async (section: keyof typeof uploadedFiles, files: FileList) => {
    try {
      const uploadPromises = Array.from(files).map(file => handleFileUpload(section, file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  };

  const getFilesBySection = (section: keyof typeof uploadedFiles) => {
    return uploadedFiles[section];
  };

  const hasRequiredFiles = (requiredSections: Array<keyof typeof uploadedFiles>) => {
    return requiredSections.every(section => uploadedFiles[section].length > 0);
  };

  return {
    uploadedFiles,
    setUploadedFiles,
    addFile,
    removeFile,
    clearFiles,
    clearAllFiles,
    handleFileUpload,
    handleMultipleFileUpload,
    getFilesBySection,
    hasRequiredFiles,
  };
}
