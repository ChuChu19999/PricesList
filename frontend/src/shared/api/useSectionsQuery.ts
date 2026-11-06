import { useQuery } from '@tanstack/react-query';
import { sectionsApi } from './sections';

export const useSectionsQuery = () =>
  useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.list(),
  });
