import { axiosInstance } from '../config/axios';

export interface Section {
  id: number;
  name: string;
  productsCount: number;
}

export interface SectionPayload {
  name: string;
}

export const sectionsApi = {
  list: async (): Promise<Section[]> => {
    const { data } = await axiosInstance.get<Section[]>('/api/sections/');
    return data;
  },

  create: async (payload: SectionPayload): Promise<Section> => {
    const { data } = await axiosInstance.post<Section>('/api/sections/', payload);
    return data;
  },

  update: async (id: number, payload: SectionPayload): Promise<Section> => {
    const { data } = await axiosInstance.patch<Section>(`/api/sections/${id}`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/sections/${id}`);
  },
};
