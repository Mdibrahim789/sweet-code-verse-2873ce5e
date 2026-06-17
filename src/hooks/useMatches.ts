import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  team_a_flag: string | null;
  team_b_flag: string | null;
  match_time: string;
  stage: string | null;
  status: string;
  score_a: number | null;
  score_b: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewMatchInput {
  team_a: string;
  team_b: string;
  team_a_flag?: string | null;
  team_b_flag?: string | null;
  match_time: string;
  stage?: string | null;
}

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_time', { ascending: true });
    if (!error && data) {
      setMatches(data as Match[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMatches();

    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  const createMatch = useCallback(async (input: NewMatchInput) => {
    const { error } = await supabase.from('matches').insert({
      team_a: input.team_a,
      team_b: input.team_b,
      team_a_flag: input.team_a_flag || null,
      team_b_flag: input.team_b_flag || null,
      match_time: input.match_time,
      stage: input.stage || null,
    });
    if (error) {
      toast.error('Failed to add match');
      return false;
    }
    toast.success('Match added');
    return true;
  }, []);

  const updateScore = useCallback(
    async (id: string, scoreA: number, scoreB: number) => {
      const { error } = await supabase
        .from('matches')
        .update({ score_a: scoreA, score_b: scoreB, status: 'finished' })
        .eq('id', id);
      if (error) {
        toast.error('Failed to update result');
        return false;
      }
      toast.success('Result saved');
      return true;
    },
    []
  );

  const deleteMatch = useCallback(async (id: string) => {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete match');
      return false;
    }
    toast.success('Match deleted');
    return true;
  }, []);

  return { matches, loading, createMatch, updateScore, deleteMatch, refetch: fetchMatches };
};
