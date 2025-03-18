# Sistema de Autenticação Automática para ShiftData API

Este projeto implementa um sistema de gerenciamento automático de tokens para a API do ShiftData, garantindo que o token seja renovado automaticamente quando expirar, sem a necessidade de intervenção manual.

## Características

- **Renovação Automática de Token**: O token é renovado automaticamente quando expira ou quando uma requisição retorna erro 401.
- **Persistência em LocalStorage**: Os tokens são armazenados no localStorage para persistir entre recarregamentos da página.
- **Tratamento de Erros**: Sistema robusto de tratamento de erros com fallback para o token padrão quando necessário.
- **Hook React Personalizado**: Hook `useShiftData` para facilitar a integração com componentes React.

## Como Usar

### Configuração

O arquivo `.env.local` contém as configurações necessárias:

```
VITE_SHIFTDATA_API_URL=/api-shiftgroup/api
VITE_SHIFTDATA_API_TOKEN=... # Token fallback
VITE_SHIFTDATA_ACCESS_KEY=0f3b36a5dba3401fb42de0edd0d5b4f0
```

### Uso Básico com o serviço API

```tsx
import { shiftDataApi } from './services';

// Exemplo de uso direto
async function buscarDados() {
  try {
    const response = await shiftDataApi.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}
```

### Uso com o Hook React

```tsx
import { useShiftData } from './hooks';

function MeuComponente() {
  const { data, error, loading, execute } = useShiftData({
    url: '/endpoint',
    method: 'get'
  });

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error.message}</p>;

  return (
    <div>
      {/* Renderizar os dados */}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### Exemplo de Post com o Hook

```tsx
import { useShiftData } from './hooks';

function FormularioEnvio() {
  const { loading, execute } = useShiftData({
    url: '/enviar-dados',
    method: 'post'
  });

  const enviarDados = async (dados) => {
    try {
      const resultado = await execute(dados);
      console.log('Sucesso:', resultado);
    } catch (error) {
      console.error('Erro ao enviar:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      enviarDados({ /* dados do formulário */ });
    }}>
      {/* Campos do formulário */}
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
```

## Funcionamento Interno

1. Cada requisição passa por um interceptor que verifica se o token atual está válido
2. Se o token expirou, o sistema solicita automaticamente um novo token
3. O token é armazenado no localStorage com sua data de expiração
4. Se uma requisição falhar com erro 401, o sistema tenta renovar o token e repetir a requisição
5. Uma margem de segurança de 30 minutos é aplicada à expiração do token para evitar problemas 