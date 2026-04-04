import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: 'master' | 'cr' | 'student' | 'teacher';
  permissions: string[];
}

export const useUserRoles = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    // Fetch profiles with their roles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, name');
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, permissions');
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      setLoading(false);
      return;
    }

    // Combine profiles with roles
    const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.user_id);
      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        role: (userRole?.role as 'master' | 'cr' | 'student' | 'teacher') || 'student',
        permissions: userRole?.permissions || []
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, role: 'master' | 'cr' | 'student' | 'teacher', permissions: string[] = []) => {
    // First delete existing role
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        permissions
      });
    
    if (error) {
      toast.error('Failed to update user role');
      return false;
    }
    
    toast.success('User role updated!');
    fetchUsers();
    return true;
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete user role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) {
        toast.error('Failed to delete student profile');
        return false;
      }
      
      toast.success('Student deleted successfully!');
      fetchUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete student');
      return false;
    }
  };

  return { users, loading, updateUserRole, deleteUser, refetch: fetchUsers };
};
