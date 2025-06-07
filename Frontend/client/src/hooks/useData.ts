import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/api';

export function useData<T>(endpoint: string) {
  const queryClient = useQueryClient();

  const query = useQuery<T>({
    queryKey: [endpoint],
    queryFn: () => dataService.get<T>(endpoint),
  });

  const create = useMutation({
    mutationFn: (data: any) => dataService.post<T>(endpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      dataService.put<T>(`${endpoint}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => dataService.delete<T>(`${endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
} 