import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  present_ids: string[];
  created_by: string | null;
  created_at: string;
}

export const useAttendance = () => {
  return useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AttendanceRecord[];
    }
  });
};

export const useAddAttendance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: { date: string; subject: string; present_ids: string[] }) => {
      const { error } = await supabase
        .from('attendance_records')
        .insert({ ...record, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...record }: { id: string; date: string; subject: string; present_ids: string[] }) => {
      const { error } = await supabase
        .from('attendance_records')
        .update(record)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });
};
