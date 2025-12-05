import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface UseSupabaseOptions<T, P extends Record<string, any>> {
  fn: (params: P) => Promise<T>;
  params?: P;
  skip?: boolean;
}

interface UseSupabaseReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams?: P) => Promise<void>;
}

const useSupabase = <T, P extends Record<string, any>>({
  fn,
  params = {} as P,
  skip = false,
}: UseSupabaseOptions<T, P>): UseSupabaseReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (fetchParams: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn({ ...fetchParams });
        setData(result);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        // Only show alert for non-skip scenarios
        if (!skip) {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [fn, skip]
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  const refetch = async (newParams?: P) => {
    await fetchData(newParams || params);
  };

  return { data, loading, error, refetch };
};

export default useSupabase;

