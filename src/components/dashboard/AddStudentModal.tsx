import { useState, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddStudentModal = ({ open, onOpenChange, onSuccess }: AddStudentModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    diploma_session: '',
    phone: '',
    blood_group: '',
    email: '',
    address: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      student_id: '',
      diploma_session: '',
      phone: '',
      blood_group: '',
      email: '',
      address: ''
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter student name');
      return;
    }
    
    if (!formData.student_id.trim()) {
      toast.error('Please enter Student ID (required for login)');
      return;
    }

    setAdding(true);
    try {
      // Use edge function to create student without affecting admin session
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-student', {
        body: {
          name: formData.name,
          student_id: formData.student_id,
          diploma_session: formData.diploma_session,
          phone: formData.phone,
          blood_group: formData.blood_group,
          email: formData.email,
          address: formData.address
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create student');
      }

      const result = response.data;
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Upload avatar if selected and user was created
      if (avatarFile && result.user_id) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${result.user_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          // Update profile with avatar
          await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('user_id', result.user_id);
        }
      }

      toast.success(`Student "${formData.name}" added!`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-4 border-primary">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">Click to add photo</p>

          {/* Form Fields */}
          <div>
            <Label>Name *</Label>
            <Input
              placeholder="Student Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Student ID *</Label>
            <Input
              placeholder="e.g. 12345 (used for login)"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Student will use this ID to login</p>
          </div>

          <div>
            <Label>Diploma Session</Label>
            <Input
              placeholder="e.g. 2021-22"
              value={formData.diploma_session}
              onChange={(e) => setFormData({ ...formData, diploma_session: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="student@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={adding}>
              {adding ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
