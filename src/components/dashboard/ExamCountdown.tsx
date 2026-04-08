import { useState, useEffect } from 'react';
import { CalendarClock, Plus, Trash2, MapPin, BookOpen, AlertTriangle } from 'lucide-react';
import { useExams, useAddExam, useDeleteExam } from '@/hooks/useExams';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CountdownBox = ({ value, label, urgent }: { value: number; label: string; urgent: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={cn(
      "w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center font-mono text-2xl sm:text-3xl font-bold transition-colors",
      urgent 
        ? "bg-destructive/20 text-destructive border border-destructive/30" 
        : "bg-primary/15 text-primary border border-primary/20"
    )}>
      {String(value).padStart(2, '0')}
    </div>
    <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">{label}</span>
  </div>
);

export const ExamCountdown = () => {
  const { data: exams = [], isLoading } = useExams();
  const { hasPermission } = useAuth();
  const addExam = useAddExam();
  const deleteExam = useDeleteExam();
  const canEdit = hasPermission('academic');

  const [now, setNow] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', exam_date: '', subject: '', location: '' });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const nextExam = exams[0];

  const getCountdown = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      total: diff,
    };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.exam_date) {
      toast.error('Title ও Date দিতে হবে');
      return;
    }
    try {
      await addExam.mutateAsync({
        title: form.title,
        exam_date: new Date(form.exam_date).toISOString(),
        subject: form.subject || undefined,
        location: form.location || undefined,
      });
      setForm({ title: '', exam_date: '', subject: '', location: '' });
      setShowAddForm(false);
      toast.success('Exam যোগ হয়েছে');
    } catch {
      toast.error('Exam যোগ করা যায়নি');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('এই exam মুছে ফেলবেন?')) {
      try {
        await deleteExam.mutateAsync(id);
        toast.success('Exam মুছে ফেলা হয়েছে');
      } catch {
        toast.error('মুছতে পারা যায়নি');
      }
    }
  };

  if (isLoading) return null;

  const countdown = nextExam ? getCountdown(nextExam.exam_date) : null;
  const isUrgent = countdown ? countdown.total < 24 * 60 * 60 * 1000 : false;

  return (
    <div>
      <Card className={cn(
        "overflow-hidden border transition-all",
        isUrgent && nextExam
          ? "border-destructive/40 bg-gradient-to-br from-destructive/5 to-destructive/10"
          : "border-primary/30 bg-gradient-to-br from-card to-primary/5"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className={cn("w-4 h-4", isUrgent ? "text-destructive" : "text-primary")} />
              Exam Countdown
              {isUrgent && nextExam && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  <AlertTriangle className="w-3 h-3 mr-1" /> URGENT
                </Badge>
              )}
            </CardTitle>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(true)} className="h-7 px-2">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!nextExam ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              কোনো আসন্ন পরীক্ষা নেই ✨
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">{nextExam.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {nextExam.subject && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {nextExam.subject}
                    </span>
                  )}
                  {nextExam.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {nextExam.location}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  📅 {new Date(nextExam.exam_date).toLocaleString('bn-BD', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="flex justify-center gap-3 sm:gap-4">
                <CountdownBox value={countdown!.days} label="দিন" urgent={isUrgent} />
                <CountdownBox value={countdown!.hours} label="ঘণ্টা" urgent={isUrgent} />
                <CountdownBox value={countdown!.minutes} label="মিনিট" urgent={isUrgent} />
                <CountdownBox value={countdown!.seconds} label="সেকেন্ড" urgent={isUrgent} />
              </div>

              {exams.length > 1 && (
                <div className="border-t border-border/50 pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">আরও আসন্ন পরীক্ষা:</p>
                  <div className="space-y-1.5">
                    {exams.slice(1, 4).map(exam => (
                      <div key={exam.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground truncate flex-1">{exam.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(exam.exam_date).toLocaleDateString('bn-BD')}
                          </span>
                          {canEdit && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDelete(exam.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-destructive hover:text-destructive"
                  onClick={() => handleDelete(nextExam.id)}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> এই পরীক্ষা মুছুন
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নতুন পরীক্ষা যোগ করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input
              placeholder="পরীক্ষার নাম (যেমন: Mid Term)"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              type="datetime-local"
              value={form.exam_date}
              onChange={e => setForm({ ...form, exam_date: e.target.value })}
              required
            />
            <Input
              placeholder="Subject (optional)"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
            />
            <Input
              placeholder="Location (optional)"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
            <Button type="submit" className="w-full" disabled={addExam.isPending}>
              {addExam.isPending ? 'যোগ হচ্ছে...' : 'পরীক্ষা যোগ করুন'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
