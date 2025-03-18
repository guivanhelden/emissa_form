import { useState, useCallback } from 'react';
import { shiftDataApi } from '../services';

interface UseShiftDataOptions {
  url: string;
  method?: 'get' | 'post' | 'put' | 'delete';
  initialData?: any;
}

export const useShiftData = <T = any>({ url, method = 'get', initialData }: UseShiftDataOptions) => {
  const [data, setData] = useState<T | null>(initialData || null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (body?: any, params?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await shiftDataApi.request({
        url,
        method,
        data: body,
        params
      });

      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, method]);

  return {
    data,
    error,
    loading,
    execute
  };
};

export default useShiftData; 