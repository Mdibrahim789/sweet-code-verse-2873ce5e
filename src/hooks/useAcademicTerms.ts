import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Season = 'Spring' | 'Summer' | 'Fall';

export interface AcademicTerm {
  id: string;
  season: Season;
  year: number;
  trimester_number: 1 | 2 | 3;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useActiveTerm = () => {
  return useQuery({
    queryKey: ['academic_terms', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_terms')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as AcademicTerm | null;
    },
  });
};

export const useAcademicTerms = () => {
  return useQuery({
    queryKey: ['academic_terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_terms')
        .select('*')
        .order('year', { ascending: false })
        .order('trimester_number', { ascending: false });
      if (error) throw error;
      return (data || []) as AcademicTerm[];
    },
  });
};

export const useUpsertTerm = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<AcademicTerm> & {
      season: Season;
      year: number;
      trimester_number: 1 | 2 | 3;
      start_date: string;
      end_date: string;
      is_active?: boolean;
    }) => {
      if (input.id) {
        const { error } = await supabase
          .from('academic_terms')
          .update({
            season: input.season,
            year: input.year,
            trimester_number: input.trimester_number,
            start_date: input.start_date,
            end_date: input.end_date,
            is_active: input.is_active ?? false,
          })
          .eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('academic_terms').insert({
          season: input.season,
          year: input.year,
          trimester_number: input.trimester_number,
          start_date: input.start_date,
          end_date: input.end_date,
          is_active: input.is_active ?? false,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic_terms'] });
    },
  });
};

export const useSetActiveTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academic_terms')
        .update({ is_active: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic_terms'] });
    },
  });
};

export const useDeleteTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('academic_terms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic_terms'] });
    },
  });
};
