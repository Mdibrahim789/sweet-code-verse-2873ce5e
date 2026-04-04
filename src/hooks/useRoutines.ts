import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Routine {
  id: string;
  type: string;
  day: string;
  time: string;
  subject: string;
  teacher: string | null;
  room: string | null;
  created_by: string | null;
  created_at: string;
  display_order: number;
}

export const useRoutines = () => {
  return useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as Routine[];
    }
  });
};

export const useAddRoutine = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (routine: Omit<Routine, 'id' | 'created_at' | 'created_by' | 'display_order'>) => {
      // Get max display_order for the routine type
      const { data: existing } = await supabase
        .from('routines')
        .select('display_order')
        .eq('type', routine.type)
        .order('display_order', { ascending: false })
        .limit(1);
      
      const maxOrder = existing?.[0]?.display_order || 0;
      
      const { error } = await supabase
        .from('routines')
        .insert({ ...routine, created_by: user?.id, display_order: maxOrder + 1 });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    }
  });
};

export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...routine }: { id: string } & Partial<Omit<Routine, 'id' | 'created_at' | 'created_by' | 'display_order'>>) => {
      const { error } = await supabase
        .from('routines')
        .update(routine)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    }
  });
};

export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    }
  });
};

export const useReorderRoutines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('routines')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    }
  });
};
