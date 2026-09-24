import { useState } from 'react';
import { Calendar, Cake, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MandatoryDobModalProps {
  open: boolean;
  profile: {
    id: string;
    name: string;
    student_id: string | null;
  };
  onSuccess: () => void;
}

export const MandatoryDobModal = ({
  open,
  profile,
  onSuccess
}: MandatoryDobModalProps) => {
  const { signOut } = useAuth();
  const [dob, setDob] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Maximum date allowed (must be at least in the past)
  const maxDate = new Date().toISOString().split('T')[0];
  // Minimum date reasonable for university students (e.g. 1950)
  const minDate = '1950-01-01';

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!dob) {
      toast.error('অনুগ্রহ করে আপনার জন্মতারিখ নির্বাচন করুন');
      return;
    }

    const selectedDate = new Date(dob);
    const today = new Date();

    if (isNaN(selectedDate.getTime()) || selectedDate >= today) {
      toast.error('সঠিক জন্মতারিখ দিন (ভবিষ্যতের তারিখ গ্রহণযোগ্য নয়)');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ date_of_birth: dob })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('জন্মতারিখ সফলভাবে সংরক্ষিত হয়েছে!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'জন্মতারিখ সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md p-6 [&>button]:hidden sm:rounded-2xl border-primary/20 shadow-2xl backdrop-blur-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary shadow-inner">
            <Cake className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              🎂 জন্মতারিখ প্রদান করুন
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              স্বাগতম, <span className="font-semibold text-foreground">{profile.name}</span>
              {profile.student_id ? ` (ID: ${profile.student_id})` : ''}!
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3 my-2">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            সাইটের সার্বিক সুবিধা এবং আপনার প্রোফাইল ভেরিফিকেশনের জন্য <strong>Date of Birth (জন্মতারিখ)</strong> যুক্ত করা বাধ্যতামূলক। এটি না দেওয়া পর্যন্ত অন্য পেজগুলোতে যাওয়া যাবে না।
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="mandatory-dob" className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              আপনার জন্মতারিখ (Date of Birth) *
            </Label>
            <Input
              id="mandatory-dob"
              type="date"
              required
              min={minDate}
              max={maxDate}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="text-base py-5 cursor-pointer focus-visible:ring-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={isSaving || !dob}
            className="w-full font-bold text-base py-6 shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                সংরক্ষণ করা হচ্ছে...
              </>
            ) : (
              'সংরক্ষণ করে এগিয়ে যান'
            )}
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1 underline underline-offset-4"
            >
              <LogOut className="w-3 h-3" />
              অন্য অ্যাকাউন্টে লগইন করতে সাইন আউট করুন
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
