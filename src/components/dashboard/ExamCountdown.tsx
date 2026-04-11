import { useState, useEffect } from 'react';
import { CalendarClock, Plus, Trash2, MapPin, BookOpen, AlertTriangle } from 'lucide-react';
import { useExams, useAddExam, useDeleteExam, Exam } from '@/hooks/useExams';
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

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatDateTime = (date: string) => {
  const d = new Date(date);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} — ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export const ExamCountdown = () => {
  const { data: exams = [], isLoading } = useExams();
  const { hasPermission } = useAuth();
  const addExam = useAddExam();
  const deleteExam = useDeleteExam();
  const canEdit = hasPermission('academic');

  const [now, setNow] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [form, setForm] = useState({ title: '', exam_date: '', subject: '', location: '' });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
      toast.error('Title and Date are required');
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
      toast.success('Exam added successfully');
    } catch {
      toast.error('Failed to add exam');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this exam?')) {
      try {
        await deleteExam.mutateAsync(id);
        toast.success('Exam deleted');
        if (selectedExam?.id === id) setSelectedExam(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  if (isLoading) return null;

  const nextExam = exams[0];
  const countdown = nextExam ? getCountdown(nextExam.exam_date) : null;
  const isUrgent = countdown ? countdown.total < 24 * 60 * 60 * 1000 : false;
  const selectedCountdown = selectedExam ? getCountdown(selectedExam.exam_date) : null;
  const selectedUrgent = selectedCountdown ? selectedCountdown.total < 24 * 60 * 60 * 1000 : false;

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
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams ✨</p>
          ) : (
            <div className="space-y-4">
              {/* Next exam — clickable */}
              <div
                className="cursor-pointer hover:bg-accent/30 rounded-lg p-2 -mx-2 transition-colors"
                onClick={() => setSelectedExam(nextExam)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground">1.</span>
                  <h3 className="text-sm font-medium text-muted-foreground flex-1">{nextExam.title}</h3>
                  {nextExam.subject && (
                    <Badge variant="secondary" className="text-sm font-bold bg-primary/10 text-primary border border-primary/30">{nextExam.subject}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-5">
                  📅 {formatDateTime(nextExam.exam_date)}
                </p>
              </div>

              <div className="flex justify-center gap-3 sm:gap-4">
                <CountdownBox value={countdown!.days} label="Days" urgent={isUrgent} />
                <CountdownBox value={countdown!.hours} label="Hours" urgent={isUrgent} />
                <CountdownBox value={countdown!.minutes} label="Min" urgent={isUrgent} />
                <CountdownBox value={countdown!.seconds} label="Sec" urgent={isUrgent} />
              </div>

              {exams.length > 1 && (
                <div className="border-t border-border/50 pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">More upcoming exams:</p>
                  <div className="space-y-1.5">
                    {exams.slice(1, 4).map((exam, idx) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-accent/30 rounded-md px-2 py-1 -mx-2 transition-colors"
                        onClick={() => setSelectedExam(exam)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground">{idx + 2}.</span>
                          <span className="text-muted-foreground text-xs truncate">{exam.title}</span>
                          {exam.subject && (
                            <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/30 shrink-0">{exam.subject}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs text-muted-foreground">{formatDate(exam.exam_date)}</span>
                          {canEdit && (
                            <Button
                              variant="ghost" size="sm" className="h-6 w-6 p-0"
                              onClick={(e) => { e.stopPropagation(); handleDelete(exam.id); }}
                            >
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
                  variant="ghost" size="sm"
                  className="w-full text-xs text-destructive hover:text-destructive"
                  onClick={() => handleDelete(nextExam.id)}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete this exam
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Exam Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Exam</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input placeholder="Exam name (e.g. Mid Term)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <Input type="datetime-local" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} required />
            <Input placeholder="Subject (optional)" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Input placeholder="Location (optional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <Button type="submit" className="w-full" disabled={addExam.isPending}>
              {addExam.isPending ? 'Adding...' : 'Add Exam'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exam Detail Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <DialogContent>
          {selectedExam && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-primary" />
                  {selectedExam.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  {selectedExam.subject && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Subject:</span>
                      <Badge variant="secondary">{selectedExam.subject}</Badge>
                    </div>
                  )}
                  {selectedExam.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground">{selectedExam.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">{formatDateTime(selectedExam.exam_date)}</span>
                  </div>
                </div>

                {selectedCountdown && selectedCountdown.total > 0 && (
                  <div className="flex justify-center gap-3">
                    <CountdownBox value={selectedCountdown.days} label="Days" urgent={selectedUrgent} />
                    <CountdownBox value={selectedCountdown.hours} label="Hours" urgent={selectedUrgent} />
                    <CountdownBox value={selectedCountdown.minutes} label="Min" urgent={selectedUrgent} />
                    <CountdownBox value={selectedCountdown.seconds} label="Sec" urgent={selectedUrgent} />
                  </div>
                )}

                {selectedCountdown && selectedCountdown.total <= 0 && (
                  <p className="text-center text-sm text-muted-foreground">This exam has already started or passed.</p>
                )}

                {canEdit && (
                  <Button
                    variant="destructive" size="sm" className="w-full"
                    onClick={() => handleDelete(selectedExam.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete this exam
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
