import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExamSuggestion {
  id: string;
  course_name: string;
  title: string;
  file_url: string | null;
  link_url: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export const useExamSuggestions = () => {
  return useQuery({
    queryKey: ['exam_suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_suggestions')
        .select('*')
        .order('course_name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ExamSuggestion[];
    }
  });
};

export const useAddExamSuggestion = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { course_name: string; title: string; description?: string; file?: File; link_url?: string }) => {
      let file_url: string | null = null;

      if (input.file) {
        const ext = input.file.name.split('.').pop();
        const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('exam-suggestions')
          .upload(path, input.file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('exam-suggestions')
          .getPublicUrl(path);
        file_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('exam_suggestions').insert({
        course_name: input.course_name,
        title: input.title,
        description: input.description || null,
        file_url,
        link_url: input.link_url || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_suggestions'] });
    }
  });
};

export const useDeleteExamSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exam_suggestions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_suggestions'] });
    }
  });
};
