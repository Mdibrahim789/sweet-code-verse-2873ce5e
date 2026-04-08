import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  student_id: string | null;
  diploma_session: string | null;
  phone: string | null;
  avatar_url: string | null;
  blood_group: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  role?: 'master' | 'cr' | 'student' | 'teacher';
}

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (profileError) throw profileError;
      
      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;
      
      // Combine profiles with roles
      const profilesWithRoles = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
           // Don't default to "student" when role couldn't be resolved.
           // This prevents teachers from showing up as students in lists.
           role: (userRole?.role as Profile['role']) ?? undefined
        };
      });
      
      return profilesWithRoles as Profile[];
    }
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, role, ...updates }: Partial<Profile> & { id: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      refreshProfile();
    }
  });
};
