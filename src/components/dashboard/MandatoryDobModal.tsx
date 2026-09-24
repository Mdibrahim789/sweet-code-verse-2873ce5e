import { useState } from 'react';
import { Calendar, Cake, ShieldAlert, ShieldCheck, LogOut, Loader2, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MandatoryDobModalProps {
  open: boolean;
  profile: {
    id: string;
    name: string;
    student_id: string | null;
    dob_status?: 'pending' | 'verified' | 'rejected' | null;
    dob_rejection_reason?: string | null;
    date_of_birth?: string | null;
  };
  onSuccess: () => void;
}

export const MandatoryDobModal = ({
  open,
  profile,
  onSuccess
}: MandatoryDobModalProps) => {
  const { signOut } = useAuth();
  const [lang, setLang] = useState<'en' | 'bn'>('en'); // Default is English as requested
  const [dob, setDob] = useState(profile.date_of_birth || '');
  const [isSaving, setIsSaving] = useState(false);

  const isRejected = profile.dob_status === 'rejected';

  // Maximum date allowed (past date)
  const maxDate = new Date().toISOString().split('T')[0];
  const minDate = '1950-01-01';

  // Toggle Language
  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!dob) {
      toast.error(
        lang === 'en'
          ? 'Please select your Date of Birth'
          : 'অনুগ্রহ করে আপনার জন্মতারিখ নির্বাচন করুন'
      );
      return;
    }

    const selectedDate = new Date(dob);
    const today = new Date();

    if (isNaN(selectedDate.getTime()) || selectedDate >= today) {
      toast.error(
        lang === 'en'
          ? 'Invalid date of birth. Future dates are not allowed.'
          : 'সঠিক জন্মতারিখ দিন (ভবিষ্যতের তারিখ গ্রহণযোগ্য নয়)'
      );
      return;
    }

    setIsSaving(true);
    try {
      // When submitted, status becomes 'pending' for Admin/CR to verify, and clear rejection reason
      const { error } = await supabase
        .from('profiles')
        .update({
          date_of_birth: dob,
          dob_status: 'pending',
          dob_rejection_reason: null
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(
        lang === 'en'
          ? 'Date of Birth submitted for review!'
          : 'জন্মতারিখ সফলভাবে পর্যালোচনার জন্য জমা দেওয়া হয়েছে!'
      );
      onSuccess();
    } catch (err: any) {
      toast.error(
        err.message ||
          (lang === 'en'
            ? 'Failed to save Date of Birth'
            : 'জন্মতারিখ সংরক্ষণে সমস্যা হয়েছে')
      );
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
        {/* Language switch button */}
        <div className="flex justify-between items-center pb-2">
          <Badge
            variant={isRejected ? 'destructive' : 'secondary'}
            className="text-xs uppercase tracking-wider font-semibold"
          >
            {isRejected
              ? (lang === 'en' ? 'Action Required: Rejected' : 'জরুরি: বাতিল করা হয়েছে')
              : (lang === 'en' ? 'Verification Required' : 'ভেরিফিকেশন আবশ্যক')}
          </Badge>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="h-8 gap-1.5 text-xs font-semibold px-2.5 rounded-full hover:border-primary/50 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            {lang === 'en' ? 'বাংলা (Translate)' : 'English (Translate)'}
          </Button>
        </div>

        <DialogHeader className="text-center space-y-3 pt-1">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-inner border-2 ${
              isRejected
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-primary/10 border-primary/30 text-primary'
            }`}
          >
            {isRejected ? (
              <ShieldAlert className="w-8 h-8 animate-pulse text-destructive" />
            ) : (
              <Cake className="w-8 h-8 animate-bounce text-primary" />
            )}
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              {isRejected
                ? (lang === 'en' ? 'Date of Birth Rejected' : 'জন্মতারিখ বাতিল করা হয়েছে')
                : (lang === 'en' ? 'Date of Birth Required' : 'জন্মতারিখ প্রদান করুন')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {lang === 'en' ? (
                <>
                  Welcome, <span className="font-semibold text-foreground">{profile.name}</span>
                  {profile.student_id ? ` (ID: ${profile.student_id})` : ''}
                </>
              ) : (
                <>
                  স্বাগতম, <span className="font-semibold text-foreground">{profile.name}</span>
                  {profile.student_id ? ` (আইডি: ${profile.student_id})` : ''}
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Notice Banner */}
        {isRejected ? (
          <div className="bg-destructive/10 border border-destructive/25 rounded-xl p-3.5 my-2 space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'Previously submitted Date of Birth was rejected by Admin/CR'
                  : 'আপনার দেওয়া পূর্বের জন্মতারিখটি অ্যাডমিন/সিআর দ্বারা বাতিল করা হয়েছে'}
              </span>
            </div>
            {profile.dob_rejection_reason && (
              <div className="text-xs bg-background/60 p-2 rounded border border-destructive/20 text-foreground">
                <span className="font-semibold text-destructive">
                  {lang === 'en' ? 'Reason: ' : 'কারণ: '}
                </span>
                {profile.dob_rejection_reason}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {lang === 'en'
                ? 'Please correct your Date of Birth with your official birth certificate or NID to continue using the portal.'
                : 'সাইট ব্যবহারের জন্য অনুগ্রহ করে আপনার আসল জন্মসনদ বা এনআইডি অনুযায়ী সঠিক জন্মতারিখ পুনরায় দিন।'}
            </p>
          </div>
        ) : (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3 my-2 text-left">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'en'
                ? 'For student identity verification and portal security, providing your Date of Birth is mandatory. Other sections will remain locked until submitted.'
                : 'শিক্ষার্থীর পরিচয় যাচাই এবং পোর্টালের সার্বিক সুরক্ষার জন্য Date of Birth (জন্মতারিখ) প্রদান করা বাধ্যতামূলক। এটি না দেওয়া পর্যন্ত অন্য কোনো পেজে যাওয়া যাবে না।'}
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-2 text-left">
            <Label htmlFor="mandatory-dob" className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              {lang === 'en' ? 'Date of Birth (DOB) *' : 'আপনার জন্মতারিখ (Date of Birth) *'}
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
            <p className="text-[11px] text-muted-foreground">
              {lang === 'en'
                ? 'Provide your real date of birth. Admin/CR will manually verify this information.'
                : 'সঠিক জন্মতারিখ প্রদান করুন। অ্যাডমিন/সিআর এটি ম্যানুয়ালি যাচাই করবেন।'}
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSaving || !dob}
            className="w-full font-bold text-base py-6 shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {lang === 'en' ? 'Saving & Submitting...' : 'সংরক্ষণ করা হচ্ছে...'}
              </>
            ) : isRejected ? (
              lang === 'en' ? 'Resubmit Date of Birth' : 'পুনরায় জন্মতারিখ জমা দিন'
            ) : (
              lang === 'en' ? 'Save & Continue' : 'সংরক্ষণ করে এগিয়ে যান'
            )}
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1 underline underline-offset-4"
            >
              <LogOut className="w-3 h-3" />
              {lang === 'en' ? 'Sign out to switch account' : 'অন্য অ্যাকাউন্টে লগইন করতে সাইন আউট করুন'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
