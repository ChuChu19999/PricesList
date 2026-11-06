import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { getApiErrorMessage } from '../lib/getApiErrorMessage';
import { sectionsApi } from './sections';
import type { SectionPayload } from './sections';

export const useCreateSectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SectionPayload) => sectionsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sections'] });
      message.success('Раздел создан');
    },
    onError: error => {
      message.error(getApiErrorMessage(error, 'Не удалось создать раздел'));
    },
  });
};

export const useUpdateSectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SectionPayload }) =>
      sectionsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sections'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success('Раздел обновлён');
    },
    onError: error => {
      message.error(getApiErrorMessage(error, 'Не удалось обновить раздел'));
    },
  });
};

export const useDeleteSectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => sectionsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sections'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success('Раздел удалён');
    },
    onError: error => {
      message.error(getApiErrorMessage(error, 'Не удалось удалить раздел'));
    },
  });
};
