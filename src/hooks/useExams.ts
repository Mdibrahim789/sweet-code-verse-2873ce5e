import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Exam {
  id: string;
  title: string;
  exam_date: string;
  subject: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
}

export const useExams = () => {
  return useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .gte('exam_date', new Date().toISOString())
        .order('exam_date', { ascending: true });
      if (error) throw error;
      return data as Exam[];
    },
  });
};

export const useAddExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exam: { title: string; exam_date: string; subject?: string; location?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('exams').insert({
        ...exam,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
  });
};
