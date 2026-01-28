import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T, P extends any[]> extends UseApiState<T> {
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T, P extends any[] = []>(
  apiFunc: (...params: P) => Promise<any>
): UseApiReturn<T, P> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const response = await apiFunc(...params);
        if (response.success) {
          setState({ data: response.data, isLoading: false, error: null });
          return response.data;
        } else {
          setState({ data: null, isLoading: false, error: response.message || '请求失败' });
          return null;
        }
      } catch (error: any) {
        const message = error?.message || '网络请求失败';
        setState({ data: null, isLoading: false, error: message });
        return null;
      }
    },
    [apiFunc]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Hook for paginated data
interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UsePaginatedApiReturn<T> {
  data: T[];
  pagination: PaginatedData<T>['pagination'] | null;
  isLoading: boolean;
  error: string | null;
  fetchPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedApi<T>(
  apiFunc: (params: any) => Promise<any>,
  dataKey: string,
  initialParams: any = {}
): UsePaginatedApiReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedData<T>['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState(initialParams);

  const fetchPage = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFunc({ ...params, page });
        if (response.success) {
          setData(response.data[dataKey]);
          setPagination(response.data.pagination);
        } else {
          setError(response.message || '请求失败');
        }
      } catch (err: any) {
        setError(err?.message || '网络请求失败');
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunc, dataKey, params]
  );

  const refresh = useCallback(() => {
    return fetchPage(pagination?.page || 1);
  }, [fetchPage, pagination]);

  return { data, pagination, isLoading, error, fetchPage, refresh };
}
