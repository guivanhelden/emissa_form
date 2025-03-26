import React, { useEffect, useRef, useState } from 'react';
import { BaseStepProps } from '../../../types/base';
import { usePMEHolders, usePMECompany } from '../../../contexts/pme/PMEContext';
import { FormField } from '../../common/FormField';
import { MaskedInput, masks } from '../../common/Input';
import { User, Users, Calendar, Mail, Phone, PlusCircle, Trash2, UserPlus, UserCheck, AlertCircle, X } from 'lucide-react';

export default function PMEHoldersStep({ onBack, onSubmit }: BaseStepProps) {
  const {
    holders,
    addHolder,
    removeHolder,
    updateHolder,
    addDependent,
    removeDependent,
    updateDependent,
    isHoldersDataValid,
    getTotalBeneficiaries,
  } = usePMEHolders();

  const { companyData } = usePMECompany();
  
  // Usar uma ref para rastrear quais sócios já foram adicionados
  const sociosAdicionadosRef = useRef<Set<string>>(new Set());
  
  // Referências para as seções do formulário
  const holdersRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar erros de formulário
  const [formErrors, setFormErrors] = useState({
    holderName: Array<boolean>(),
    holderCpf: Array<boolean>(),
    holderBirthDate: Array<boolean>(),
    holderEmail: Array<boolean>(),
    holderPhone: Array<boolean>(),
    dependentName: Array<{[key: number]: boolean}>(),
    dependentCpf: Array<{[key: number]: boolean}>(),
    dependentBirthDate: Array<{[key: number]: boolean}>(),
    dependentRelationship: Array<{[key: number]: boolean}>(),
  });
  
  // Estado para controlar o modal de erro
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddHolder = () => {
    addHolder({
      name: '',
      cpf: '',
      birthDate: '',
      email: '',
      phone: '',
    });
  };

  const handleAddDependent = (holderIndex: number) => {
    addDependent(holderIndex, {
      name: '',
      cpf: '',
      birthDate: '',
      relationship: '',
    });
  };

  useEffect(() => {
    // Função para adicionar um sócio como titular apenas se ainda não foi adicionado
    const adicionarSocioComoTitular = (socio: any) => {
      // Se o sócio já foi adicionado antes, não adicionar novamente
      if (sociosAdicionadosRef.current.has(socio.nome) || !socio.nome) {
        return;
      }
      
      // Verificar se já existe um titular com o mesmo nome
      const titularExistente = holders.some(holder => holder.name === socio.nome);
      
      // Só adicionar se não existir e tiver um nome válido
      if (!titularExistente) {
        addHolder({
          name: socio.nome,
          cpf: socio.cpf || '',
          birthDate: '',  // Data de nascimento ainda precisa ser preenchida manualmente
          email: socio.email || '',
          phone: socio.telefone || '',
        });
        
        // Marcar este sócio como já adicionado
        sociosAdicionadosRef.current.add(socio.nome);
      }
    };
    
    if (companyData.socios && companyData.socios.length > 0) {
      // Filtrar sócios marcados para serem incluídos como titulares
      const sociosComoTitulares = companyData.socios.filter(socio => socio.incluirComoTitular);
      
      // Adicionar cada sócio marcado como titular
      sociosComoTitulares.forEach(adicionarSocioComoTitular);
    }
  }, [companyData.socios, holders, addHolder]);

  // Estilo para animação de shake quando há erro
  useEffect(() => {
    // Adicionar estilo para animação de erro
    const style = document.createElement('style');
    style.textContent = `
      @keyframes error-shake {
        0% { transform: translateX(0); }
        10% { transform: translateX(-5px); }
        20% { transform: translateX(5px); }
        30% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        50% { transform: translateX(-5px); }
        60% { transform: translateX(5px); }
        70% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
        90% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
      }
      
      .error-shake {
        animation: error-shake 0.6s ease-in-out;
        border-color: rgb(239, 68, 68) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Inicializar os arrays de erros quando os titulares mudam
  useEffect(() => {
    const newErrors = {
      holderName: new Array(holders.length).fill(false),
      holderCpf: new Array(holders.length).fill(false),
      holderBirthDate: new Array(holders.length).fill(false),
      holderEmail: new Array(holders.length).fill(false),
      holderPhone: new Array(holders.length).fill(false),
      dependentName: new Array(holders.length).fill({}),
      dependentCpf: new Array(holders.length).fill({}),
      dependentBirthDate: new Array(holders.length).fill({}),
      dependentRelationship: new Array(holders.length).fill({}),
    };
    setFormErrors(newErrors);
  }, [holders.length]);

  // Função para mostrar mensagem de erro
  const showErrorToast = (message: string, ref: React.RefObject<HTMLDivElement> | null) => {
    // Mostrar a mensagem de erro
    setErrorMessage(message);
    setShowErrorModal(true);

    // Rolar até o elemento com erro
    if (ref && ref.current) {
      console.log("Rolando até o elemento com erro");
      ref.current.scrollIntoView({ behavior: 'smooth' });
      // Adicionar uma classe para destacar visualmente o elemento com erro
      ref.current.classList.add('error-shake');
      setTimeout(() => {
        if (ref && ref.current) {
          ref.current.classList.remove('error-shake');
        }
      }, 1000);
    }
  };

  // Componente para exibir o modal de erro
  const ErrorModal = () => {
    if (!showErrorModal) return null;
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
        <div className="bg-gray-900 border border-red-500 rounded-lg p-6 max-w-md w-full shadow-lg transform transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-red-500 rounded-full p-2 mr-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Campos obrigatórios</h3>
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-white text-lg">{errorMessage}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg text-white font-bold transition-all hover:from-violet-700 hover:to-purple-700"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Função para validar e enviar o formulário
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se não houver titulares, mostrar erro
    if (holders.length === 0) {
      showErrorToast('Por favor, adicione pelo menos um titular', holdersRef);
      return;
    }
    
    // Cria uma cópia do estado de erros
    const newErrors = {
      holderName: [...formErrors.holderName],
      holderCpf: [...formErrors.holderCpf],
      holderBirthDate: [...formErrors.holderBirthDate],
      holderEmail: [...formErrors.holderEmail],
      holderPhone: [...formErrors.holderPhone],
      dependentName: [...formErrors.dependentName],
      dependentCpf: [...formErrors.dependentCpf],
      dependentBirthDate: [...formErrors.dependentBirthDate],
      dependentRelationship: [...formErrors.dependentRelationship],
    };
    
    let hasError = false;
    let errorMessage = '';
    
    // Valida todos os titulares
    for (let i = 0; i < holders.length; i++) {
      const holder = holders[i];
      
      // Validar campos do titular
      newErrors.holderName[i] = !holder.name;
      newErrors.holderCpf[i] = !holder.cpf;
      newErrors.holderBirthDate[i] = !holder.birthDate;
      newErrors.holderEmail[i] = !holder.email;
      newErrors.holderPhone[i] = !holder.phone;
      
      // Se há erro neste titular, definir a mensagem
      if (newErrors.holderName[i]) {
        hasError = true;
        errorMessage = `Por favor, preencha o nome do titular ${i + 1}`;
        break;
      } else if (newErrors.holderCpf[i]) {
        hasError = true;
        errorMessage = `Por favor, preencha o CPF do titular ${i + 1}`;
        break;
      } else if (newErrors.holderBirthDate[i]) {
        hasError = true;
        errorMessage = `Por favor, preencha a data de nascimento do titular ${i + 1}`;
        break;
      } else if (newErrors.holderEmail[i]) {
        hasError = true;
        errorMessage = `Por favor, preencha o e-mail do titular ${i + 1}`;
        break;
      } else if (newErrors.holderPhone[i]) {
        hasError = true;
        errorMessage = `Por favor, preencha o telefone do titular ${i + 1}`;
        break;
      }
      
      // Inicializa objetos para este titular se não existirem
      if (!newErrors.dependentName[i]) newErrors.dependentName[i] = {};
      if (!newErrors.dependentCpf[i]) newErrors.dependentCpf[i] = {};
      if (!newErrors.dependentBirthDate[i]) newErrors.dependentBirthDate[i] = {};
      if (!newErrors.dependentRelationship[i]) newErrors.dependentRelationship[i] = {};
      
      // Validar dependentes deste titular
      for (let j = 0; j < holder.dependents.length; j++) {
        const dependent = holder.dependents[j];
        
        newErrors.dependentName[i][j] = !dependent.name;
        newErrors.dependentCpf[i][j] = !dependent.cpf;
        newErrors.dependentBirthDate[i][j] = !dependent.birthDate;
        newErrors.dependentRelationship[i][j] = !dependent.relationship;
        
        if (newErrors.dependentName[i][j]) {
          hasError = true;
          errorMessage = `Por favor, preencha o nome do dependente ${j + 1} do titular ${i + 1}`;
          break;
        } else if (newErrors.dependentCpf[i][j]) {
          hasError = true;
          errorMessage = `Por favor, preencha o CPF do dependente ${j + 1} do titular ${i + 1}`;
          break;
        } else if (newErrors.dependentBirthDate[i][j]) {
          hasError = true;
          errorMessage = `Por favor, preencha a data de nascimento do dependente ${j + 1} do titular ${i + 1}`;
          break;
        } else if (newErrors.dependentRelationship[i][j]) {
          hasError = true;
          errorMessage = `Por favor, selecione o parentesco do dependente ${j + 1} do titular ${i + 1}`;
          break;
        }
      }
      
      if (hasError) break;
    }
    
    // Atualiza o estado com os erros encontrados
    setFormErrors(newErrors);
    
    // Se houver algum erro, mostra a mensagem e não submete o formulário
    if (hasError) {
      showErrorToast(errorMessage, holdersRef);
      return;
    }
    
    // Se não houver erros, continua com o envio do formulário
    onSubmit(e);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-xl mb-8 border border-purple-500/30 shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Users className="w-8 h-8 mr-3 text-purple-400" />
          Beneficiários
        </h2>
        <p className="text-white/80 text-lg">
          Cadastre os titulares e seus dependentes
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="bg-white/10 rounded-lg p-6 space-y-6 border border-purple-400/30 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20" ref={holdersRef}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <UserCheck className="w-6 h-6 mr-3 text-purple-400" />
              Titulares
            </h3>
            <button
              type="button"
              onClick={handleAddHolder}
              className="inline-flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Titular
            </button>
          </div>

          <div className="space-y-6">
            {holders.map((holder, holderIndex) => (
              <div
                key={holderIndex}
                className="bg-white/5 rounded-lg border border-white/20 hover:border-purple-500/50 transition-colors duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <User className="w-5 h-5 mr-2 text-purple-400" />
                      Titular {holderIndex + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeHolder(holderIndex)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Nome" required>
                      <div className="relative">
                        <input
                          type="text"
                          value={holder.name}
                          onChange={(e) =>
                            updateHolder(holderIndex, { ...holder, name: e.target.value })
                          }
                          placeholder="Digite o nome completo"
                          className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                            text-white placeholder:text-white/60 focus:outline-none
                            transition-colors focus:border-white/40 ${formErrors.holderName[holderIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <User className="h-5 w-5 text-purple-400" />
                        </div>
                      </div>
                    </FormField>

                    <FormField label="CPF" required>
                      <MaskedInput
                        mask={masks.cpf}
                        value={holder.cpf}
                        onChange={(value) =>
                          updateHolder(holderIndex, { ...holder, cpf: value })
                        }
                        placeholder="000.000.000-00"
                        className={`py-4 bg-white/10 border rounded-lg
                          text-white placeholder:text-white/60 focus:outline-none
                          transition-colors focus:border-white/40 ${formErrors.holderCpf[holderIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                        icon={<User className="h-5 w-5 text-purple-400" />}
                      />
                    </FormField>

                    <FormField label="Data de Nascimento" required>
                      <div className="relative">
                        <input
                          type="date"
                          value={holder.birthDate}
                          onChange={(e) =>
                            updateHolder(holderIndex, { ...holder, birthDate: e.target.value })
                          }
                          className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                            text-white focus:outline-none focus:border-white/40 transition-colors ${formErrors.holderBirthDate[holderIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                      </div>
                    </FormField>

                    <FormField label="E-mail" required>
                      <div className="relative">
                        <input
                          type="email"
                          value={holder.email}
                          onChange={(e) =>
                            updateHolder(holderIndex, { ...holder, email: e.target.value })
                          }
                          placeholder="Digite o e-mail"
                          className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                            text-white placeholder:text-white/60 focus:outline-none
                            transition-colors focus:border-white/40 ${formErrors.holderEmail[holderIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <Mail className="h-5 w-5 text-purple-400" />
                        </div>
                      </div>
                    </FormField>

                    <FormField label="Telefone" required>
                      <MaskedInput
                        mask={masks.phone}
                        value={holder.phone}
                        onChange={(value) =>
                          updateHolder(holderIndex, { ...holder, phone: value })
                        }
                        placeholder="(00) 00000-0000"
                        className={`py-4 bg-white/10 border rounded-lg
                          text-white placeholder:text-white/60 focus:outline-none
                          transition-colors focus:border-white/40 ${formErrors.holderPhone[holderIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                        icon={<Phone className="h-5 w-5 text-purple-400" />}
                      />
                    </FormField>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-white flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-purple-400" />
                        Dependentes
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleAddDependent(holderIndex)}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-500/80 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Adicionar Dependente
                      </button>
                    </div>

                    <div className="space-y-4">
                      {holder.dependents.map((dependent, dependentIndex) => (
                        <div
                          key={dependentIndex}
                          className="bg-white/5 rounded-lg border border-white/20 p-5 hover:border-purple-500/30 transition-colors duration-200"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-white font-medium flex items-center">
                              <User className="w-4 h-4 mr-2 text-purple-400" />
                              Dependente {dependentIndex + 1}
                            </h5>
                            <button
                              type="button"
                              onClick={() => removeDependent(holderIndex, dependentIndex)}
                              className="text-red-400 hover:text-red-300 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Nome">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={dependent.name}
                                  onChange={(e) =>
                                    updateDependent(holderIndex, dependentIndex, {
                                      ...dependent,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Digite o nome do dependente"
                                  className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                                    text-white placeholder:text-white/60 focus:outline-none
                                    transition-colors focus:border-white/40 ${formErrors.dependentName[holderIndex]?.[dependentIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                  <User className="h-5 w-5 text-purple-400" />
                                </div>
                              </div>
                            </FormField>

                            <FormField label="CPF">
                              <MaskedInput
                                mask={masks.cpf}
                                value={dependent.cpf}
                                onChange={(value) =>
                                  updateDependent(holderIndex, dependentIndex, {
                                    ...dependent,
                                    cpf: value,
                                  })
                                }
                                placeholder="000.000.000-00"
                                className={`py-4 bg-white/10 border rounded-lg
                                  text-white placeholder:text-white/60 focus:outline-none
                                  transition-colors focus:border-white/40 ${formErrors.dependentCpf[holderIndex]?.[dependentIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                                icon={<User className="h-5 w-5 text-purple-400" />}
                              />
                            </FormField>

                            <FormField label="Data de Nascimento">
                              <div className="relative">
                                <input
                                  type="date"
                                  value={dependent.birthDate}
                                  onChange={(e) =>
                                    updateDependent(holderIndex, dependentIndex, {
                                      ...dependent,
                                      birthDate: e.target.value,
                                    })
                                  }
                                  className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                                    text-white focus:outline-none focus:border-white/40 transition-colors ${formErrors.dependentBirthDate[holderIndex]?.[dependentIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                  <Calendar className="h-5 w-5 text-purple-400" />
                                </div>
                              </div>
                            </FormField>

                            <FormField label="Parentesco">
                              <div className="relative">
                                <select
                                  value={dependent.relationship}
                                  onChange={(e) =>
                                    updateDependent(holderIndex, dependentIndex, {
                                      ...dependent,
                                      relationship: e.target.value,
                                    })
                                  }
                                  className={`w-full pl-12 pr-6 py-4 bg-white/10 border rounded-lg
                                    text-white focus:outline-none focus:border-white/40 transition-colors
                                    [&_option]:bg-gray-900 [&_option]:text-white
                                    [&_option:hover]:bg-purple-500 [&_option:checked]:bg-purple-500 ${formErrors.dependentRelationship[holderIndex]?.[dependentIndex] ? 'border-red-500' : 'border-purple-500/50'}`}
                                >
                                  <option value="" className="py-2">Selecione o parentesco</option>
                                  <option value="spouse" className="py-2">Cônjuge</option>
                                  <option value="child" className="py-2">Filho(a)</option>
                                  <option value="parent" className="py-2">Pai/Mãe</option>
                                  <option value="sibling" className="py-2">Irmão/Irmã</option>
                                </select>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                  <Users className="h-5 w-5 text-purple-400" />
                                </div>
                              </div>
                            </FormField>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 bg-white/10 py-4 px-6 border border-purple-400/30 rounded-lg shadow-lg text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            ← Anterior
          </button>
          <button
            type="submit"
            className="w-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 py-4 px-6 border border-transparent shadow-lg text-base font-bold rounded-lg text-white hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            Continuar
          </button>
        </div>
      </form>

      <ErrorModal />
    </div>
  );
}
