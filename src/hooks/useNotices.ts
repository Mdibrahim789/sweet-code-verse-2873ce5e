import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Notice {
  id: string;
  title: string;
  description: string | null;
  date: string;
  created_by: string | null;
  created_at: string;
}

export const useNotices = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notice[];
    }
  });
};

export const useAddNotice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notice: { title: string; description: string; date: string }) => {
      const { error } = await supabase
        .from('notices')
        .insert({ ...notice, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    }
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    }
  });
};
