import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CRKey {
  id: string;
  name: string;
  access_key: string;
  permissions: string[];
  created_at: string;
}

export const useCRKeys = () => {
  const [crKeys, setCRKeys] = useState<CRKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCRKeys = async () => {
    const { data, error } = await supabase
      .from('cr_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching CR keys:', error);
    } else {
      setCRKeys(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCRKeys();
  }, []);

  const generateKey = () => {
    return 'CR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createCRKey = async (name: string, permissions: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('cr_keys')
      .insert({
        name,
        access_key: generateKey(),
        permissions,
        created_by: user?.id
      });
    
    if (error) {
      toast.error('Failed to create CR key');
      return false;
    }
    
    toast.success('CR key generated successfully!');
    fetchCRKeys();
    return true;
  };

  const deleteCRKey = async (id: string) => {
    const { error } = await supabase
      .from('cr_keys')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete CR key');
      return false;
    }
    
    toast.success('CR key revoked');
    fetchCRKeys();
    return true;
  };

  return { crKeys, loading, createCRKey, deleteCRKey, refetch: fetchCRKeys };
};
