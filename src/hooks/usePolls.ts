import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Poll {
  id: string;
  question: string;
  options: string[];
  created_by: string | null;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export const usePolls = () => {
  return useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Poll[];
    }
  });
};

export const usePollVotes = (pollId: string) => {
  return useQuery({
    queryKey: ['poll-votes', pollId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId);
      
      if (error) throw error;
      return data as PollVote[];
    },
    enabled: !!pollId
  });
};

export const useAddPoll = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (poll: { question: string; options: string[] }) => {
      const { error } = await supabase
        .from('polls')
        .insert({ ...poll, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    }
  });
};

export const useDeletePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    }
  });
};

export const useVote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => {
      const { error } = await supabase
        .from('poll_votes')
        .upsert({ 
          poll_id: pollId, 
          user_id: user?.id,
          option_index: optionIndex 
        }, { 
          onConflict: 'poll_id,user_id' 
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { pollId }) => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', pollId] });
    }
  });
};
