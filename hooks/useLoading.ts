import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  showLoading: () => void;
  hideLoading: () => void;
}

export const useLoading = (initialState: boolean = false): UseLoadingReturn => {
  const [loading, setLoading] = useState(initialState);

  const showLoading = useCallback(() => {
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading,
    showLoading,
    hideLoading,
  };
};
