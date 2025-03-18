import { useIndividualHolder as useIndividualHolderContext } from '../../contexts/individual/IndividualHolderContext';
import { DatastoneAddress } from '../../types/individual';

export function useIndividualHolder() {
  const context = useIndividualHolderContext();

  if (!context) {
    throw new Error('useIndividualHolder must be used within an IndividualHolderProvider');
  }

  const updateHolderField = (field: string, value: string | number) => {
    context.setHolderData({
      ...context.holderData,
      [field]: value
    });
  };

  const validatePostalCode = (postalCode: string): boolean => {
    return /^\d{5}-?\d{3}$/.test(postalCode);
  };

  const addAddress = (address: Partial<Omit<DatastoneAddress, 'id' | 'selected'>>) => {
    if (!address.cep || !validatePostalCode(address.cep)) {
      throw new Error('CEP inválido');
    }

    const newAddress: DatastoneAddress = {
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      cep: address.cep,
      district: address.district || address.neighborhood || '', // Usando bairro como distrito se não fornecido
      postal_code: address.cep,
      id: crypto.randomUUID(),
      selected: false
    };

    context.setHolderData({
      ...context.holderData,
      addresses: [...context.holderData.addresses, newAddress]
    });

    return newAddress;
  };

  const removeAddress = (id: string) => {
    context.setHolderData({
      ...context.holderData,
      addresses: context.holderData.addresses.filter(addr => addr.id !== id)
    });
  };

  const toggleAddressSelection = (id: string) => {
    context.setHolderData({
      ...context.holderData,
      addresses: context.holderData.addresses.map(addr => ({
        ...addr,
        selected: addr.id === id
      }))
    });
  };

  const getSelectedAddress = () => {
    return context.holderData.addresses.find(addr => addr.selected);
  };

  const calculateAge = () => {
    if (!context.holderData.birthDate) return 0;
    
    const birth = new Date(context.holderData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return {
    ...context,
    updateHolderField,
    addAddress,
    removeAddress,
    toggleAddressSelection,
    getSelectedAddress,
    calculateAge,
    age: calculateAge(),
    hasSelectedAddress: context.holderData.addresses.some(addr => addr.selected)
  };
}
