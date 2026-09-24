import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  GraduationCap,
  Award,
  ExternalLink,
  Printer,
  Sparkles,
  AlertCircle,
  Loader2,
  Calendar,
  Building2,
  BookOpen,
  IdCard,
  RefreshCw,
} from 'lucide-react';

export interface StudentResultData {
  id: string;
  registrationNo: string;
  name: string;
  department: string;
  program: string;
  semesterGpa: string;
  academicYear: string;
  semesterId: string;
  semesterName: string;
  officialPortalUrl: string;
  queriedAt: string;
  courses?: Array<{
    code?: string;
    title?: string;
    credit?: string;
    grade?: string;
    point?: string;
  }>;
}

interface StudentResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string | null;
  dateOfBirth?: string | null;
  studentName?: string | null;
}

const ACADEMIC_YEARS = ['2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020'];

const SEMESTERS = [
  { id: '1', name: 'Spring' },
  { id: '2', name: 'Summer' },
  { id: '3', name: 'Fall' },
];

export const StudentResultModal = ({
  isOpen,
  onClose,
  studentId: defaultStudentId,
  dateOfBirth: defaultDob,
  studentName,
}: StudentResultModalProps) => {
  const [studentId, setStudentId] = useState(defaultStudentId || '');
  const [dob, setDob] = useState(defaultDob || '');
  const [academicYear, setAcademicYear] = useState('2026');
  const [semesterId, setSemesterId] = useState('2'); // Summer

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudentResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultStudentId) setStudentId(defaultStudentId);
    if (defaultDob) setDob(defaultDob);
    setError(null);
  }, [defaultStudentId, defaultDob, isOpen]);

  const handleFetchResult = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!studentId.trim()) {
      toast.error('Student ID is required');
      return;
    }
    if (!dob.trim()) {
      toast.error('Date of Birth is required to fetch result from ERP');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-student-result', {
        body: {
          sid: studentId.trim(),
          dob: dob.trim(),
          acyear: academicYear,
          semid: semesterId,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to connect to result service');
      }

      if (data && data.success && data.data) {
        setResult(data.data as StudentResultData);
        toast.success('Result fetched successfully!');
      } else {
        const errorMsg = data?.error || 'Student information or result not found for this semester.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error fetching result:', err);
      const msg = err.message || 'Failed to fetch result from Uttara University ERP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getGpaColor = (gpaStr: string) => {
    const val = parseFloat(gpaStr);
    if (isNaN(val)) return 'text-primary border-primary/30 bg-primary/10';
    if (val >= 3.75) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20';
    if (val >= 3.5) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10 shadow-cyan-500/20';
    if (val >= 3.0) return 'text-blue-400 border-blue-500/40 bg-blue-500/10 shadow-blue-500/20';
    if (val >= 2.5) return 'text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-amber-500/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10 shadow-rose-500/20';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border shadow-2xl">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="w-6 h-6 animate-pulse" />
            <DialogTitle className="text-xl font-bold tracking-tight">
              Uttara University Academic Result
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Live result verified directly from Uttara University ERP Portal
          </DialogDescription>
        </DialogHeader>

        {/* Query Controls */}
        <form onSubmit={handleFetchResult} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="mt-1 h-9 bg-background/60">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Semester</Label>
              <Select value={semesterId} onValueChange={setSemesterId}>
                <SelectTrigger className="mt-1 h-9 bg-background/60">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student ID & DOB verification info */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/40">
            <div>
              <span className="text-muted-foreground block text-[11px]">Student ID</span>
              <span className="font-semibold text-foreground tracking-wide font-mono">
                {studentId || defaultStudentId || 'Not Set'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Date of Birth</span>
              <span className="font-semibold text-foreground tracking-wide font-mono">
                {dob ? '•••••••• (Set)' : 'Not Set in Profile'}
              </span>
            </div>
          </div>

          {!dob && (
            <div className="space-y-1">
              <Label className="text-xs text-amber-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Enter Date of Birth to fetch result:
              </Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="h-9 bg-background/60 text-xs"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-10 gap-2 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            disabled={loading || !studentId.trim() || !dob.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Official Result...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                View ERP Result
              </>
            )}
          </Button>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <GraduationCap className="w-6 h-6 text-primary absolute inset-0 m-auto" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Connecting to Uttara University ERP...
            </p>
            <p className="text-xs text-muted-foreground">
              Verifying student record & pulling semester grades
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Result Not Available</span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">{error}</p>
            <p className="text-[11px] opacity-75">
              Tip: Make sure the selected Academic Year ({academicYear}) and Semester match your registered courses, and that your Date of Birth is correct.
            </p>
          </div>
        )}

        {/* Result Card */}
        {result && !loading && (
          <div className="space-y-4 pt-2 animate-in zoom-in-95 duration-200">
            {/* Main Result Card */}
            <Card className="border border-primary/30 bg-gradient-to-b from-card via-card/90 to-background/95 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <CardContent className="p-5 space-y-4">
                {/* Header Banner */}
                <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
                  <div>
                    <Badge variant="outline" className="text-[11px] font-semibold tracking-wider uppercase bg-primary/10 text-primary border-primary/30 mb-1">
                      {result.semesterName} {result.academicYear}
                    </Badge>
                    <h3 className="text-lg font-bold text-foreground leading-snug">
                      {result.name || studentName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.program}
                    </p>
                  </div>

                  <Award className="w-9 h-9 text-primary/80 shrink-0" />
                </div>

                {/* Big Glowing GPA Display */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-background/80 border border-border/60 shadow-inner">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
                    Semester Grade Point Average
                  </span>
                  <div
                    className={`text-4xl font-extrabold tracking-tight px-6 py-1.5 rounded-xl border shadow-lg ${getGpaColor(
                      result.semesterGpa
                    )}`}
                  >
                    {result.semesterGpa || 'N/A'}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-2">
                    Official Grade on ERP System
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-0.5">
                    <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                      <IdCard className="w-3 h-3 text-primary" /> Student ID
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {result.id}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-0.5">
                    <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-primary" /> Registration No
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {result.registrationNo || 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-0.5 col-span-2">
                    <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-primary" /> Department
                    </span>
                    <span className="font-semibold text-foreground block truncate">
                      {result.department}
                    </span>
                  </div>
                </div>

                {/* Detailed courses list if available */}
                {result.courses && result.courses.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Course Grades
                    </h4>
                    <div className="border border-border/60 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-muted/60 text-muted-foreground border-b border-border/40">
                          <tr>
                            <th className="p-2">Course</th>
                            <th className="p-2 text-center">Credit</th>
                            <th className="p-2 text-center">Grade</th>
                            <th className="p-2 text-right">Point</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {result.courses.map((c, i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="p-2">
                                <span className="font-medium text-foreground">{c.code}</span>
                                {c.title && <span className="block text-[11px] text-muted-foreground">{c.title}</span>}
                              </td>
                              <td className="p-2 text-center">{c.credit}</td>
                              <td className="p-2 text-center font-bold text-primary">{c.grade}</td>
                              <td className="p-2 text-right font-mono">{c.point}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={handlePrint}
              >
                <Printer className="w-3.5 h-3.5" />
                Print Result Slip
              </Button>

              <Button
                variant="default"
                size="sm"
                className="flex-1 text-xs gap-1.5 bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <a
                  href={result.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Official ERP Portal
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
