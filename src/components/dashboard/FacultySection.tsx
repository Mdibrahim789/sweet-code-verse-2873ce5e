import { useState, useMemo } from 'react';
import { Trash2, Mail, Phone, BookOpen, GraduationCap, Edit2, X, Star, Users } from 'lucide-react';
import { useFaculty, useAddFaculty, useUpdateFaculty, useDeleteFaculty, Faculty, FacultyRole } from '@/hooks/useFaculty';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditModeToggle } from './EditModeToggle';
import { FacultyListSkeleton } from './SectionSkeletons';
import { toast } from 'sonner';

const ROLE_OPTIONS: { value: FacultyRole; label: string }[] = [
  { value: 'advisor', label: 'Advisor' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'both', label: 'Advisor + Class Teacher' },
  { value: 'regular', label: 'Regular Faculty' }
];

const getRoleBadge = (role: FacultyRole) => {
  switch (role) {
    case 'advisor':
      return <Badge variant="secondary" className="border"><Star className="w-3 h-3 mr-1" />Advisor</Badge>;
    case 'class_teacher':
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><Users className="w-3 h-3 mr-1" />Class Teacher</Badge>;
    case 'both':
      return <Badge className="bg-accent text-accent-foreground"><Star className="w-3 h-3 mr-1" />Advisor + CT</Badge>;
    default:
      return null;
  }
};

interface FacultyFormData {
  name: string;
  designation: string;
  phone: string;
  email: string;
  subject: string;
  education: string;
  avatar_url: string;
  role: FacultyRole;
  subjects_not_taught: string;
}

const initialFormData: FacultyFormData = {
  name: '',
  designation: '',
  phone: '',
  email: '',
  subject: '',
  education: '',
  avatar_url: '',
  role: 'regular',
  subjects_not_taught: ''
};

export const FacultySection = () => {
  const { hasPermission } = useAuth();
  const { data: faculty = [], isLoading } = useFaculty();
  const addFaculty = useAddFaculty();
  const updateFaculty = useUpdateFaculty();
  const deleteFaculty = useDeleteFaculty();

  const [formData, setFormData] = useState<FacultyFormData>(initialFormData);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [editFormData, setEditFormData] = useState<FacultyFormData>(initialFormData);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const canEdit = hasPermission('teacher');

  // Group faculty by role
  const groupedFaculty = useMemo(() => {
    const advisors = faculty.filter(f => f.role === 'advisor' || f.role === 'both');
    const classTeachers = faculty.filter(f => f.role === 'class_teacher' || f.role === 'both');
    const regular = faculty.filter(f => f.role === 'regular');
    return { advisors, classTeachers, regular, all: faculty };
  }, [faculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required');
    
    try {
      await addFaculty.mutateAsync({
        name: formData.name,
        designation: formData.designation || null,
        phone: formData.phone || null,
        email: formData.email || null,
        subject: formData.subject || null,
        education: formData.education || null,
        avatar_url: formData.avatar_url || null,
        role: formData.role,
        subjects_not_taught: formData.subjects_not_taught ? formData.subjects_not_taught.split(',').map(s => s.trim()).filter(Boolean) : []
      });
      setFormData(initialFormData);
      toast.success('Faculty added');
    } catch (error) {
      toast.error('Failed to add faculty');
    }
  };

  const openEditModal = (f: Faculty) => {
    setEditingFaculty(f);
    setEditFormData({
      name: f.name,
      designation: f.designation || '',
      phone: f.phone || '',
      email: f.email || '',
      subject: f.subject || '',
      education: f.education || '',
      avatar_url: f.avatar_url || '',
      role: f.role,
      subjects_not_taught: f.subjects_not_taught?.join(', ') || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    
    try {
      await updateFaculty.mutateAsync({
        id: editingFaculty.id,
        name: editFormData.name,
        designation: editFormData.designation || null,
        phone: editFormData.phone || null,
        email: editFormData.email || null,
        subject: editFormData.subject || null,
        education: editFormData.education || null,
        avatar_url: editFormData.avatar_url || null,
        role: editFormData.role,
        subjects_not_taught: editFormData.subjects_not_taught ? editFormData.subjects_not_taught.split(',').map(s => s.trim()).filter(Boolean) : []
      });
      setShowEditModal(false);
      setEditingFaculty(null);
      toast.success('Faculty updated');
    } catch (error) {
      toast.error('Failed to update faculty');
    }
  };

  const FacultyCard = ({ f }: { f: Faculty }) => (
    <Card key={f.id} className="p-5 flex gap-4 relative">
      <Avatar className="w-24 h-28 rounded-lg border-2 border-secondary shrink-0">
        <AvatarImage src={f.avatar_url || undefined} className="object-cover" />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl rounded-lg">
          {f.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h4 className="font-bold text-lg text-primary">{f.name}</h4>
          {getRoleBadge(f.role)}
        </div>
        <p className="text-sm font-medium text-foreground">{f.designation || 'Faculty'}</p>
        
        {f.education && (
          <div className="mt-1 text-sm text-muted-foreground">
            {f.education.split('\n').map((line, i) => (
              <p key={i} className="flex items-start gap-1">
                <GraduationCap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{line}</span>
              </p>
            ))}
          </div>
        )}
        
        {f.subject && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <BookOpen className="w-3.5 h-3.5" />
            {f.subject}
          </p>
        )}

        {f.subjects_not_taught && f.subjects_not_taught.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-destructive/70">Does not teach:</span> {f.subjects_not_taught.join(', ')}
          </p>
        )}
        
        {f.phone && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Phone className="w-3.5 h-3.5" />
            {f.phone}
          </p>
        )}
        
        {f.email && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Mail className="w-3.5 h-3.5" />
            <a href={`mailto:${f.email}`} className="hover:underline truncate">
              {f.email}
            </a>
          </p>
        )}
      </div>

      {canEdit && isEditMode && (
        <div className="absolute top-3 right-3 flex gap-2">
          <button 
            onClick={() => openEditModal(f)}
            className="text-primary hover:text-primary/80"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => deleteFaculty.mutate(f.id)}
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Card>
  );

  const FacultyGroup = ({ title, icon: Icon, members, emptyText }: { 
    title: string; 
    icon: React.ElementType;
    members: Faculty[]; 
    emptyText: string 
  }) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground">
        <Icon className="w-5 h-5" />
        {title}
        <Badge variant="secondary" className="ml-2">{members.length}</Badge>
      </h3>
      {members.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((f) => <FacultyCard key={f.id} f={f} />)}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="animate-fade-up">
        <h2 className="section-title mb-4">👨‍🏫 Faculty Members</h2>
        <FacultyListSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">👨‍🏫 Faculty Members</h2>
        {canEdit && (
          <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
        )}
      </div>

      {canEdit && isEditMode && (
        <form onSubmit={handleSubmit} className="admin-form space-y-3 mb-8">
          <h3 className="font-semibold">Add Faculty</h3>
          <Input 
            placeholder="Name *" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as FacultyRole })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input 
            placeholder="Designation (e.g., Assistant Professor)" 
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          />
          <Input 
            placeholder="Subject/Department" 
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
          <Input 
            placeholder="Subjects NOT taught (comma-separated)" 
            value={formData.subjects_not_taught}
            onChange={(e) => setFormData({ ...formData, subjects_not_taught: e.target.value })}
          />
          <Textarea 
            placeholder="Education (e.g., MSc, University Name&#10;BSc, University Name)" 
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            rows={3}
          />
          <Input 
            placeholder="Phone" 
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input 
            placeholder="Email" 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input 
            placeholder="Avatar URL (optional)" 
            value={formData.avatar_url}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
          />
          <Button type="submit" className="w-full">Add Faculty</Button>
        </form>
      )}

      {/* Grouped Display */}
      <FacultyGroup 
        title="Advisors" 
        icon={Star}
        members={groupedFaculty.advisors} 
        emptyText="No advisors added yet"
      />
      
      <FacultyGroup 
        title="Class Teachers" 
        icon={Users}
        members={groupedFaculty.classTeachers.filter(f => f.role === 'class_teacher')} 
        emptyText="No class teachers added yet"
      />
      
      <FacultyGroup 
        title="Other Faculty" 
        icon={GraduationCap}
        members={groupedFaculty.regular} 
        emptyText="No other faculty added yet"
      />

      {faculty.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No faculty added yet</p>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
          </DialogHeader>
          {editingFaculty && (
            <form onSubmit={handleUpdate} className="space-y-3">
              <Input placeholder="Name *" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
              <Select value={editFormData.role} onValueChange={(v) => setEditFormData({ ...editFormData, role: v as FacultyRole })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Designation" value={editFormData.designation} onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })} />
              <Input placeholder="Subject/Department" value={editFormData.subject} onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })} />
              <Input placeholder="Subjects NOT taught (comma-separated)" value={editFormData.subjects_not_taught} onChange={(e) => setEditFormData({ ...editFormData, subjects_not_taught: e.target.value })} />
              <Textarea placeholder="Education" value={editFormData.education} onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })} rows={3} />
              <Input placeholder="Phone" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />
              <Input type="email" placeholder="Email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
              <Input placeholder="Avatar URL" value={editFormData.avatar_url} onChange={(e) => setEditFormData({ ...editFormData, avatar_url: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
