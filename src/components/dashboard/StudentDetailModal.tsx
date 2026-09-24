import { useState, useRef, useEffect } from 'react';
import { Camera, Mail, Phone, MapPin, Droplets, User, Upload, Calendar, CheckCircle2, XCircle, ShieldCheck, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
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
  date_of_birth: string | null;
  dob_status?: 'pending' | 'verified' | 'rejected' | null;
  dob_rejection_reason?: string | null;
}

interface StudentDetailModalProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onUpdate: () => void;
}

export const StudentDetailModal = ({ 
  profile, 
  open, 
  onOpenChange, 
  canEdit,
  onUpdate 
}: StudentDetailModalProps) => {
  const { isMaster, isCR, hasPermission } = useAuth();
  const canVerifyDob = Boolean(isMaster() || isCR() || hasPermission('student'));

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    diploma_session: '',
    phone: '',
    blood_group: '',
    email: '',
    address: '',
    date_of_birth: ''
  });

  // Reset state when profile changes or modal closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
    // Reset form data when profile changes
    setFormData({
      name: profile?.name || '',
      student_id: profile?.student_id || '',
      diploma_session: profile?.diploma_session || '',
      phone: profile?.phone || '',
      blood_group: profile?.blood_group || '',
      email: profile?.email || '',
      address: profile?.address || '',
      date_of_birth: profile?.date_of_birth || ''
    });
  }, [profile, open]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name,
        student_id: formData.student_id || null,
        diploma_session: formData.diploma_session || null,
        phone: formData.phone || null,
        blood_group: formData.blood_group || null,
        email: formData.email || null,
        address: formData.address || null,
        date_of_birth: formData.date_of_birth || null
      };

      // If DOB changed or was previously rejected, reset to pending
      if (formData.date_of_birth !== profile.date_of_birth || profile.dob_status === 'rejected') {
        updateData.dob_status = formData.date_of_birth ? 'pending' : null;
        updateData.dob_rejection_reason = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Profile updated!');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveDob = async () => {
    if (!profile) return;
    setVerifying(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          dob_status: 'verified',
          dob_rejection_reason: null
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success(`Date of Birth verified for ${profile.name}`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify');
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectDob = async () => {
    if (!profile) return;
    setRejecting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          dob_status: 'rejected',
          dob_rejection_reason: rejectionReason.trim() || 'Date of birth appears inaccurate or unverified'
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.warning(`Date of Birth rejected for ${profile.name}. Student will be prompted on next visit.`);
      setShowRejectInput(false);
      setRejectionReason('');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.user_id}/${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Avatar updated!');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Avatar with upload */}
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-primary">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {canEdit && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploading ? (
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div className="w-full space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold">{profile.name}</h3>
                <p className="text-muted-foreground">
                  ID: {profile.student_id || 'N/A'} | {profile.diploma_session || 'N/A'}
                </p>
              </div>

              <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <InfoRow 
                    icon={<Calendar className="w-4 h-4" />} 
                    label="Date of Birth" 
                    value={profile.date_of_birth ? format(new Date(profile.date_of_birth + 'T00:00:00'), 'dd MMM yyyy') : null} 
                  />
                  {profile.date_of_birth && (
                    <Badge 
                      variant={profile.dob_status === 'verified' ? 'default' : profile.dob_status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-[10px] uppercase font-semibold tracking-wider ml-2 shrink-0"
                    >
                      {profile.dob_status === 'verified' ? 'Verified' : profile.dob_status === 'rejected' ? 'Rejected' : 'Pending Review'}
                    </Badge>
                  )}
                </div>
                <InfoRow icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={profile.blood_group} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={profile.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={profile.phone} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={profile.address} />
              </div>

              {/* Admin/CR Verification Box */}
              {canVerifyDob && profile.date_of_birth && (
                <div className="border border-border/80 rounded-lg p-3 bg-card/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      DOB Verification (Admin/CR)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Status:{' '}
                      <strong
                        className={
                          profile.dob_status === 'verified'
                            ? 'text-primary'
                            : profile.dob_status === 'rejected'
                            ? 'text-destructive'
                            : 'text-amber-500'
                        }
                      >
                        {profile.dob_status === 'verified'
                          ? 'Verified'
                          : profile.dob_status === 'rejected'
                          ? 'Rejected'
                          : 'Pending'}
                      </strong>
                    </span>
                  </div>

                  {profile.dob_status === 'rejected' && profile.dob_rejection_reason && (
                    <p className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                      <strong>Rejection Reason:</strong> {profile.dob_rejection_reason}
                    </p>
                  )}

                  {!showRejectInput ? (
                    <div className="flex gap-2 pt-1">
                      {profile.dob_status !== 'verified' && (
                        <Button
                          size="sm"
                          onClick={handleApproveDob}
                          disabled={verifying}
                          className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {verifying ? 'Approving...' : 'Approve DOB'}
                        </Button>
                      )}
                      {profile.dob_status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowRejectInput(true)}
                          className="flex-1 h-8 gap-1 text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject DOB
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <Input
                        placeholder="Rejection reason (e.g. Inaccurate date / NID mismatch)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="text-xs h-8"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRejectInput(false)}
                          className="flex-1 h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleRejectDob}
                          disabled={rejecting}
                          className="flex-1 h-7 text-xs"
                        >
                          {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canEdit && (
                <Button onClick={handleEdit} className="w-full">
                  Edit Profile
                </Button>
              )}
            </div>
          ) : (
            /* Edit Mode */
            <div className="w-full space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Student ID</Label>
                  <Input
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Diploma Session</Label>
                  <Input
                    value={formData.diploma_session}
                    onChange={(e) => setFormData({ ...formData, diploma_session: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Date of Birth</Label>
                    {profile.dob_status === 'verified' && !isMaster() && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    disabled={profile.dob_status === 'verified' && !isMaster()}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Input
                    placeholder="e.g. A+, B-, O+"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) => (
  <div className="flex items-center gap-3">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-sm text-muted-foreground w-24">{label}:</span>
    <span className="text-sm font-medium">{value || 'N/A'}</span>
  </div>
);
