import { useQuery } from '@tanstack/react-query';
import { productsApi } from './products';
import type { ProductsFilters, ProductsSorting } from './products';

export interface UseProductsQueryParams {
  filters?: ProductsFilters;
  sorting?: ProductsSorting;
  enabled?: boolean;
}

export const useProductsQuery = ({ filters, sorting, enabled = true }: UseProductsQueryParams) =>
  useQuery({
    queryKey: ['products', filters, sorting],
    queryFn: () =>
      productsApi.list({
        sortBy: sorting?.sortBy,
        sortOrder: sorting?.sortOrder,
        search: filters?.search,
        sectionId: filters?.sectionId,
        unsectionedOnly: filters?.unsectionedOnly,
      }),
    enabled: enabled && filters?.sectionId != null,
    placeholderData: previous => previous,
  });
