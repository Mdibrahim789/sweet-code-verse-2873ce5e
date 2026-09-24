import { useState, useMemo } from 'react';
import { UserPlus, Search, Shield } from 'lucide-react';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StudentDetailModal } from './StudentDetailModal';
import { AddStudentModal } from './AddStudentModal';
import { EditModeToggle } from './EditModeToggle';
import { StudentListSkeleton } from './SectionSkeletons';

export const StudentsSection = () => {
  const { hasPermission, user, isMaster, isCR } = useAuth();
  const { data: profiles = [], refetch, isLoading } = useProfiles();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dobFilter, setDobFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  const canEdit = hasPermission('student');
  const canAdd = hasPermission('student') || isMaster();
  const isAdminOrCr = Boolean(isMaster() || isCR() || hasPermission('student'));

  // Filter profiles - exclude teachers and masters, only show students and CRs
  // Sort by student_id for serial numbering
  const studentProfiles = useMemo(() => {
    return profiles
      .filter(p => p.role === 'student' || p.role === 'cr')
      .sort((a, b) => {
        const idA = a.student_id || '';
        const idB = b.student_id || '';
        return idA.localeCompare(idB);
      });
  }, [profiles]);

  const dobPendingCount = useMemo(
    () => studentProfiles.filter(p => p.date_of_birth && (p.dob_status === 'pending' || !p.dob_status)).length,
    [studentProfiles]
  );
  const dobRejectedCount = useMemo(
    () => studentProfiles.filter(p => p.dob_status === 'rejected').length,
    [studentProfiles]
  );

  // Filter based on search query and DOB status
  const filteredProfiles = useMemo(() => {
    let list = studentProfiles;

    if (isAdminOrCr && dobFilter !== 'all') {
      if (dobFilter === 'pending') {
        list = list.filter(p => p.date_of_birth && (p.dob_status === 'pending' || !p.dob_status));
      } else if (dobFilter === 'verified') {
        list = list.filter(p => p.dob_status === 'verified');
      } else if (dobFilter === 'rejected') {
        list = list.filter(p => p.dob_status === 'rejected');
      }
    }

    if (!searchQuery.trim()) return list;
    
    const query = searchQuery.toLowerCase().trim();
    return list.filter((p) => 
      p.name.toLowerCase().includes(query) ||
      (p.student_id && p.student_id.toLowerCase().includes(query)) ||
      (p.phone && p.phone.includes(query))
    );
  }, [studentProfiles, searchQuery, dobFilter, isAdminOrCr]);

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  };

  const canEditProfile = (profile: Profile) => {
    if (canEdit) return true;
    return user?.id === profile.user_id;
  };

  if (isLoading) {
    return (
      <div className="animate-fade-up">
        <h2 className="section-title mb-6">👥 Student Profiles</h2>
        <StudentListSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title mb-0">👥 Student Profiles</h2>
        <div className="flex items-center gap-2">
          {canAdd && (
            <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
          )}
          {canAdd && isEditMode && (
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Admin/CR Quick Filter Tabs for DOB Verification */}
      {isAdminOrCr && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Button
            size="sm"
            variant={dobFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setDobFilter('all')}
            className="h-7 text-xs rounded-full"
          >
            All Students ({studentProfiles.length})
          </Button>
          <Button
            size="sm"
            variant={dobFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setDobFilter('pending')}
            className={`h-7 text-xs rounded-full ${
              dobPendingCount > 0 && dobFilter !== 'pending'
                ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                : ''
            }`}
          >
            DOB Pending ({dobPendingCount})
          </Button>
          <Button
            size="sm"
            variant={dobFilter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setDobFilter('rejected')}
            className={`h-7 text-xs rounded-full ${
              dobRejectedCount > 0 && dobFilter !== 'rejected'
                ? 'border-destructive/50 text-destructive'
                : ''
            }`}
          >
            DOB Rejected ({dobRejectedCount})
          </Button>
          <Button
            size="sm"
            variant={dobFilter === 'verified' ? 'default' : 'outline'}
            onClick={() => setDobFilter('verified')}
            className="h-7 text-xs rounded-full"
          >
            Verified
          </Button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredProfiles.map((p) => {
          const serialNumber = studentProfiles.findIndex(sp => sp.id === p.id) + 1;
          
          return (
            <Card 
              key={p.id} 
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleProfileClick(p)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {serialNumber}
              </div>
              
              <Avatar className="w-12 h-12 border-2 border-primary">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {p.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold truncate">{p.name}</h4>
                  {p.role === 'cr' && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      CR
                    </Badge>
                  )}
                  {p.role === 'master' && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {isAdminOrCr && p.date_of_birth && (
                    <Badge
                      variant={
                        p.dob_status === 'verified'
                          ? 'default'
                          : p.dob_status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-[10px] ml-auto shrink-0"
                    >
                      {p.dob_status === 'verified'
                        ? 'Verified'
                        : p.dob_status === 'rejected'
                        ? 'DOB Rejected'
                        : 'DOB Pending'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  ID: {p.student_id || '-'} | Dip: {p.diploma_session || '-'} | {p.phone || '-'}
                </p>
              </div>
            </Card>
          );
        })}
        
        {filteredProfiles.length === 0 && searchQuery && (
          <p className="text-muted-foreground text-center py-8">No students found matching "{searchQuery}"</p>
        )}
        
        {studentProfiles.length === 0 && !searchQuery && (
          <p className="text-muted-foreground text-center py-8">No students registered yet</p>
        )}
      </div>

      <StudentDetailModal
        profile={selectedProfile}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        canEdit={selectedProfile ? canEditProfile(selectedProfile) : false}
        onUpdate={refetch}
      />

      <AddStudentModal
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={refetch}
      />
    </div>
  );
};
