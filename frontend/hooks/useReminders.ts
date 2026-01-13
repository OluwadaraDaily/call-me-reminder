import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/constants';
import { Reminder, ReminderCreate, ReminderUpdate, PaginatedRemindersResponse, ReminderStats } from '@/types/reminder';

const QUERY_KEYS = {
  reminders: ['reminders'] as const,
  reminder: (id: number) => ['reminders', id] as const,
  stats: ['reminders', 'stats'] as const,
};

export function useReminders(
  skip: number = 0,
  limit?: number,
  status?: string,
  search?: string
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.reminders, skip, limit, status, search],
    queryFn: async () => {
      const params: Record<string, any> = { skip };
      if (limit !== undefined) params.limit = limit;
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await apiClient.get<PaginatedRemindersResponse>(API_ENDPOINTS.REMINDERS, {
        params,
      });
      return response.data;
    },
  });
}

export function useReminder(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.reminder(id),
    queryFn: async () => {
      const response = await apiClient.get<Reminder>(`${API_ENDPOINTS.REMINDERS}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useReminderStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: async () => {
      const response = await apiClient.get<ReminderStats>(`${API_ENDPOINTS.REMINDERS}/stats`);
      return response.data;
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReminderCreate) => {
      const response = await apiClient.post<Reminder>(API_ENDPOINTS.REMINDERS, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReminderUpdate }) => {
      const response = await apiClient.put<Reminder>(`${API_ENDPOINTS.REMINDERS}/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminder(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${API_ENDPOINTS.REMINDERS}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}
