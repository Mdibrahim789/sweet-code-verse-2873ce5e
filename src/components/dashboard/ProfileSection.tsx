import { useState, useRef } from 'react';
import { Camera, Mail, Phone, MapPin, Droplets, User, GraduationCap, IdCard, Crown, Shield, BookOpen } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { GuestRestrictedContent } from './GuestRestrictedContent';
import { useNavigate } from 'react-router-dom';

export const ProfileSection = () => {
  const { user, profile, isMaster, isCR, isTeacher, refreshProfile } = useAuth();
  const { isGuestMode } = useGuest();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    student_id: profile?.student_id || '',
    diploma_session: profile?.diploma_session || '',
    phone: profile?.phone || '',
    blood_group: profile?.blood_group || '',
    email: profile?.email || '',
    address: profile?.address || ''
  });

  // Update form data when profile changes
  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        student_id: profile.student_id || '',
        diploma_session: profile.diploma_session || '',
        phone: profile.phone || '',
        blood_group: profile.blood_group || '',
        email: profile.email || '',
        address: profile.address || ''
      });
    }
  });

  // Show guest restricted content if in guest mode or not logged in
  if (isGuestMode && !user) {
    return (
      <GuestRestrictedContent 
        title="My Profile" 
        onLoginClick={() => navigate('/')} 
      />
    );
  }

  // Show login prompt if not authenticated
  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <User className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Please Log In</h2>
        <p className="text-muted-foreground text-center">
          You need to be logged in to view your profile
        </p>
        <Button onClick={() => navigate('/')}>
          Log In
        </Button>
      </div>
    );
  }

  const getRoleInfo = () => {
    if (isMaster()) return { label: 'Master Admin', variant: 'default' as const, icon: Crown };
    if (isCR()) return { label: 'Class Representative', variant: 'secondary' as const, icon: Shield };
    if (isTeacher()) return { label: 'Teacher', variant: 'outline' as const, icon: BookOpen };
    return { label: 'Student', variant: 'outline' as const, icon: GraduationCap };
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          student_id: formData.student_id || null,
          diploma_session: formData.diploma_session || null,
          phone: formData.phone || null,
          blood_group: formData.blood_group || null,
          email: formData.email || null,
          address: formData.address || null
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refreshProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.user_id}/${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Avatar updated!');
      refreshProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      student_id: profile?.student_id || '',
      diploma_session: profile?.diploma_session || '',
      phone: profile?.phone || '',
      blood_group: profile?.blood_group || '',
      email: profile?.email || '',
      address: profile?.address || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with upload */}
            <div className="relative group">
              <Avatar className="w-28 h-28 border-4 border-primary">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Name and Role */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <Badge variant={roleInfo.variant} className="mt-2 gap-1">
                <RoleIcon className="w-3 h-3" />
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            /* View Mode */
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem 
                icon={<IdCard className="w-4 h-4" />} 
                label="Student ID" 
                value={profile.student_id} 
              />
              <InfoItem 
                icon={<GraduationCap className="w-4 h-4" />} 
                label="Diploma Session" 
                value={profile.diploma_session} 
              />
              <InfoItem 
                icon={<Droplets className="w-4 h-4" />} 
                label="Blood Group" 
                value={profile.blood_group} 
              />
              <InfoItem 
                icon={<Mail className="w-4 h-4" />} 
                label="Email" 
                value={profile.email} 
              />
              <InfoItem 
                icon={<Phone className="w-4 h-4" />} 
                label="Phone" 
                value={profile.phone} 
              />
              <InfoItem 
                icon={<MapPin className="w-4 h-4" />} 
                label="Address" 
                value={profile.address} 
              />
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Student ID</Label>
                  <Input
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder="e.g. 2261171116"
                  />
                </div>
                <div>
                  <Label>Diploma Session</Label>
                  <Input
                    value={formData.diploma_session}
                    onChange={(e) => setFormData({ ...formData, diploma_session: e.target.value })}
                    placeholder="e.g. 2022-2026"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Blood Group</Label>
                  <Input
                    placeholder="e.g. A+, B-, O+"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+880 1234567890"
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Your address"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
    <span className="text-primary mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || 'Not set'}</p>
    </div>
  </div>
);
