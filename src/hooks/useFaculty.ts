import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FacultyRole = 'advisor' | 'class_teacher' | 'both' | 'regular';

export interface Faculty {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  email: string | null;
  subject: string | null;
  education: string | null;
  avatar_url: string | null;
  role: FacultyRole;
  subjects_not_taught: string[];
  created_by: string | null;
  created_at: string;
}

export const useFaculty = () => {
  return useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faculty')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []).map(f => ({
        ...f,
        role: (f.role || 'regular') as FacultyRole,
        subjects_not_taught: f.subjects_not_taught || []
      })) as Faculty[];
    }
  });
};

export const useAddFaculty = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (faculty: Omit<Faculty, 'id' | 'created_at' | 'created_by'>) => {
      const { error } = await supabase
        .from('faculty')
        .insert({ ...faculty, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    }
  });
};

export const useUpdateFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Faculty> & { id: string }) => {
      const { error } = await supabase
        .from('faculty')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    }
  });
};

export const useDeleteFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faculty')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    }
  });
};
