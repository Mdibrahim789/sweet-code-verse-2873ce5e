import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BusLocation {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface BusSchedule {
  id: string;
  location_id: string;
  day: string;
  direction: 'up' | 'down';
  time: string;
  bus_number: string;
  created_by: string | null;
  created_at: string;
  updated_at?: string | null;
  updated_by?: string | null;
  bus_locations?: { name: string };
}

export const useBusLocations = () => {
  return useQuery({
    queryKey: ['bus_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as BusLocation[];
    }
  });
};

export const useBusSchedules = (locationId?: string, day?: string) => {
  return useQuery({
    queryKey: ['bus_schedules', locationId, day],
    queryFn: async () => {
      let query = supabase
        .from('bus_schedules')
        .select('*, bus_locations(name)')
        .order('time');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      if (day) {
        query = query.eq('day', day);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BusSchedule[];
    }
  });
};

export const useAddBusLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('bus_locations')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus_locations'] });
      toast({ title: 'Location added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding location', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeleteBusLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bus_locations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus_locations'] });
      toast({ title: 'Location deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting location', description: error.message, variant: 'destructive' });
    }
  });
};

export const useAddBusSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (schedule: Omit<BusSchedule, 'id' | 'created_at' | 'created_by' | 'bus_locations'>) => {
      const { data, error } = await supabase
        .from('bus_schedules')
        .insert(schedule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus_schedules'] });
      toast({ title: 'Schedule added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding schedule', description: error.message, variant: 'destructive' });
    }
  });
};

export const useBulkAddBusSchedules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (schedules: Omit<BusSchedule, 'id' | 'created_at' | 'created_by' | 'bus_locations'>[]) => {
      const { data, error } = await supabase
        .from('bus_schedules')
        .insert(schedules)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bus_schedules'] });
      toast({ title: `${data.length} schedules added successfully` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding schedules', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdateBusSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; time?: string; bus_number?: string; direction?: 'up' | 'down'; location_id?: string }) => {
      const { data, error } = await supabase
        .from('bus_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus_schedules'] });
      toast({ title: 'Schedule updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating schedule', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeleteBusSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bus_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus_schedules'] });
      toast({ title: 'Schedule deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting schedule', description: error.message, variant: 'destructive' });
    }
  });
};

export const useClearBusSchedules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (locationId?: string) => {
      let query = supabase.from('bus_schedules').delete();
      if (locationId) {
        query = query.eq('location_id', locationId);
      } else {
        // Delete all - need to use a condition that's always true
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus_schedules'] });
      toast({ title: 'Schedules cleared successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error clearing schedules', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdateUserBusLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, locationId }: { userId: string; locationId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ bus_pickup_location: locationId })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Pickup location updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating location', description: error.message, variant: 'destructive' });
    }
  });
};
