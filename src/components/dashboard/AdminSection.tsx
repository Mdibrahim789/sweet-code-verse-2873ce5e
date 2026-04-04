import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCRKeys } from '@/hooks/useCRKeys';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Key, Users, Trash2, Copy, Shield, UserPlus, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const PERMISSIONS = [
  { id: 'routine', label: 'Routine' },
  { id: 'notice', label: 'Notices' },
  { id: 'academic', label: 'Academic' },
  { id: 'student', label: 'Students' },
  { id: 'teacher', label: 'Teachers' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'polls', label: 'Polls' },
  { id: 'bus', label: 'Bus Schedule' },
];

export const AdminSection = () => {
  const { isMaster } = useAuth();
  const { crKeys, loading: keysLoading, createCRKey, deleteCRKey } = useCRKeys();
  const { users, loading: usersLoading, updateUserRole, deleteUser } = useUserRoles();
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  
  const [newCRName, setNewCRName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'master' | 'cr' | 'student' | 'teacher'>('student');
  const [editPerms, setEditPerms] = useState<string[]>([]);
  
  // New student form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentSession, setNewStudentSession] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  // New teacher form
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [teacherPerms, setTeacherPerms] = useState<string[]>([]);
  const [addingTeacher, setAddingTeacher] = useState(false);

  if (!isMaster()) {
    return (
      <div className="text-center py-10">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground">Access Denied</h2>
        <p className="text-muted-foreground">Only Master Admin can access this panel.</p>
      </div>
    );
  }

  const handleGenerateKey = async () => {
    if (!newCRName.trim()) {
      toast.error('Please enter CR name');
      return;
    }
    if (selectedPerms.length === 0) {
      toast.error('Select at least one permission');
      return;
    }
    
    const success = await createCRKey(newCRName, selectedPerms);
    if (success) {
      setNewCRName('');
      setSelectedPerms([]);
    }
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Key copied to clipboard!');
  };

  const handleUpdateRole = async (userId: string) => {
    const perms = (editRole === 'cr' || editRole === 'teacher') ? editPerms : [];
    await updateUserRole(userId, editRole, perms);
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingUser(userId);
    await deleteUser(userId);
    setDeletingUser(null);
  };

  const toggleEditPerm = (perm: string) => {
    setEditPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const toggleTeacherPerm = (perm: string) => {
    setTeacherPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim()) {
      toast.error('Teacher নাম দিন');
      return;
    }
    if (!newTeacherEmail.trim()) {
      toast.error('Teacher email দিন');
      return;
    }
    if (teacherPerms.length === 0) {
      toast.error('কমপক্ষে একটি permission select করুন');
      return;
    }
    
    setAddingTeacher(true);
    try {
      const response = await supabase.functions.invoke('create-teacher', {
        body: {
          name: newTeacherName,
          email: newTeacherEmail,
          phone: newTeacherPhone || null,
          permissions: teacherPerms
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Teacher "${newTeacherName}" যোগ হয়েছে!`);
      toast.info(`Temporary Password: ${response.data.temp_password}`, { duration: 10000 });
      
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPhone('');
      setTeacherPerms([]);
      
      // Refresh user list
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      toast.error(error.message || 'Teacher যোগ করতে সমস্যা হয়েছে');
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) {
      toast.error('Please enter student name');
      return;
    }
    
    setAddingStudent(true);
    try {
      // Generate a unique email for the student
      const uniqueEmail = `student_${Date.now()}@uueee.local`;
      const tempPassword = `temp_${Math.random().toString(36).slice(2, 10)}`;
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: tempPassword,
        options: {
          data: { name: newStudentName }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Update profile with additional details
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: newStudentName,
            student_id: newStudentId || null,
            phone: newStudentPhone || null,
            diploma_session: newStudentSession || null
          })
          .eq('user_id', authData.user.id);
        
        if (profileError) {
          console.error('Profile update error:', profileError);
        }
        
        toast.success(`Student "${newStudentName}" added successfully!`);
        setNewStudentName('');
        setNewStudentId('');
        setNewStudentPhone('');
        setNewStudentSession('');
        
        // Refresh user list
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Crown className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold">Master Admin Panel</h2>
      </div>

      {/* Add Student Section */}
      <Card className="p-6 border-l-4 border-l-accent">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-accent-foreground" />
          <h3 className="text-lg font-semibold">Add New Student</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Student Name *"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
          />
          <Input
            placeholder="Student ID"
            value={newStudentId}
            onChange={(e) => setNewStudentId(e.target.value)}
          />
          <Input
            placeholder="Phone Number"
            value={newStudentPhone}
            onChange={(e) => setNewStudentPhone(e.target.value)}
          />
          <Input
            placeholder="Diploma Session (e.g., 2023-2024)"
            value={newStudentSession}
            onChange={(e) => setNewStudentSession(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={handleAddStudent} 
          className="w-full mt-4"
          disabled={addingStudent}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {addingStudent ? 'Adding...' : 'Add Student'}
        </Button>
      </Card>

      {/* Add Teacher Section */}
      <Card className="p-6 border-l-4 border-l-purple-500">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold">Add New Teacher</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Teacher Name *"
            value={newTeacherName}
            onChange={(e) => setNewTeacherName(e.target.value)}
          />
          <Input
            placeholder="Email *"
            type="email"
            value={newTeacherEmail}
            onChange={(e) => setNewTeacherEmail(e.target.value)}
          />
          <Input
            placeholder="Phone Number"
            value={newTeacherPhone}
            onChange={(e) => setNewTeacherPhone(e.target.value)}
          />
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Permissions (Teacher কী কী edit করতে পারবে):</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PERMISSIONS.map(perm => (
              <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox 
                  checked={teacherPerms.includes(perm.id)}
                  onCheckedChange={() => toggleTeacherPerm(perm.id)}
                />
                {perm.label}
              </label>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={handleAddTeacher} 
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
          disabled={addingTeacher}
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          {addingTeacher ? 'Adding...' : 'Add Teacher'}
        </Button>
      </Card>

      {/* CR Key Generation */}
      <Card className="p-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Generate CR Access Key</h3>
        </div>
        
        <div className="space-y-4">
          <Input
            placeholder="CR Name / Note"
            value={newCRName}
            onChange={(e) => setNewCRName(e.target.value)}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PERMISSIONS.map(perm => (
              <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox 
                  checked={selectedPerms.includes(perm.id)}
                  onCheckedChange={() => togglePerm(perm.id)}
                />
                {perm.label}
              </label>
            ))}
          </div>
          
          <Button onClick={handleGenerateKey} className="w-full">
            <Key className="w-4 h-4 mr-2" />
            Generate Key
          </Button>
        </div>

        {/* Existing Keys */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Active Keys</h4>
          {keysLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : crKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys generated yet</p>
          ) : (
            crKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key.access_key}</p>
                  <p className="text-xs text-muted-foreground">{key.permissions.join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => copyKey(key.access_key)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCRKey(key.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* User Role Management */}
      <Card className="p-6 border-l-4 border-l-accent">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">User Role Management</h3>
        </div>
        
        {usersLoading ? (
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found</p>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold
                        ${user.role === 'master' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          user.role === 'cr' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                          user.role === 'teacher' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {user.role.toUpperCase()}
                      </span>
                      {(user.role === 'cr' || user.role === 'teacher') && user.permissions.length > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          ({user.permissions.join(', ')})
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {editingUser !== user.user_id && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingUser(user.user_id);
                          setEditRole(user.role);
                          setEditPerms(user.permissions);
                        }}
                      >
                        Edit Role
                      </Button>
                      {user.role !== 'master' && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          disabled={deletingUser === user.user_id}
                          onClick={() => handleDeleteUser(user.user_id, user.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {editingUser === user.user_id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <Select value={editRole} onValueChange={(v) => setEditRole(v as 'master' | 'cr' | 'student' | 'teacher')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="cr">CR</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {(editRole === 'cr' || editRole === 'teacher') && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PERMISSIONS.map(p => (
                          <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox 
                              checked={editPerms.includes(p.id)}
                              onCheckedChange={() => toggleEditPerm(p.id)}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateRole(user.user_id)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
