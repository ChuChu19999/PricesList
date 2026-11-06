import { axiosInstance } from '../config/axios';
import { API_URL } from '../config/process';

export interface Product {
  id: number;
  name: string;
  price: string;
  productUrl: string;
  sectionId: number | null;
  sectionName: string | null;
  includeInSum: boolean;
  hasImage: boolean;
  imageUrl: string | null;
}

export interface ProductsFilters {
  search?: string;
  sectionId?: number;
  unsectionedOnly?: boolean;
}

export type ProductsSortField = 'name' | 'price' | 'id';

export interface ProductsSorting {
  sortBy?: ProductsSortField;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsList {
  items: Product[];
  total: number;
  totalSum: string;
}

export interface ProductsListParams {
  sortBy?: ProductsSortField;
  sortOrder?: ProductsSorting['sortOrder'];
  search?: string;
  sectionId?: number;
  unsectionedOnly?: boolean;
}

export interface ProductPayload {
  name: string;
  price: number;
  productUrl: string;
  sectionId: number;
  includeInSum: boolean;
  imageFile?: File;
}

export const getProductImageSrc = (product: Pick<Product, 'id' | 'hasImage' | 'imageUrl'>) => {
  if (!product.hasImage) return undefined;
  if (product.imageUrl?.startsWith('http')) {
    return product.imageUrl;
  }
  const path = product.imageUrl ?? `/api/products/${product.id}/image`;
  return `${API_URL}${path}`;
};

const buildProductFormData = (payload: ProductPayload): FormData => {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('price', String(payload.price));
  formData.append('productUrl', payload.productUrl);
  formData.append('sectionId', String(payload.sectionId));
  formData.append('includeInSum', String(payload.includeInSum));
  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  }
  return formData;
};

export const productsApi = {
  list: async (params: ProductsListParams): Promise<ProductsList> => {
    const { data } = await axiosInstance.get<ProductsList>('/api/products/', {
      params: {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        search: params.search,
        sectionId: params.sectionId,
        unsectionedOnly: params.unsectionedOnly || undefined,
      },
    });
    return data;
  },

  create: async (payload: ProductPayload): Promise<Product> => {
    const formData = buildProductFormData(payload);
    const { data } = await axiosInstance.post<Product>('/api/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id: number, payload: ProductPayload): Promise<Product> => {
    const formData = buildProductFormData(payload);
    const { data } = await axiosInstance.patch<Product>(`/api/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  setIncludeInSum: async (id: number, includeInSum: boolean): Promise<Product> => {
    const { data } = await axiosInstance.patch<Product>(`/api/products/${id}/include-in-sum`, {
      includeInSum,
    });
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/products/${id}`);
  },
};
