import { useQuery } from '@tanstack/react-query';
import { getCfdis } from '../api/endpoints';

export const useCfdis = () =>
  useQuery({
    queryKey: ['cfdis'],
    queryFn: getCfdis,
    staleTime: 30 * 1000,
  });
