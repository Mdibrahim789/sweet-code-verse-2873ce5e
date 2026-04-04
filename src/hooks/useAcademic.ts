import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Course {
  id: string;
  name: string;
  code: string | null;
  syllabus_link: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  created_by: string | null;
  created_at: string;
}

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Course[];
    }
  });
};

export const useResources = () => {
  return useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Resource[];
    }
  });
};

export const useAddCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (course: { name: string; code: string; syllabus_link: string }) => {
      const { error } = await supabase
        .from('courses')
        .insert({ ...course, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
};

export const useAddResource = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (resource: { title: string; url: string }) => {
      const { error } = await supabase
        .from('resources')
        .insert({ ...resource, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });
};
