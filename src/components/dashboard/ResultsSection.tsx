import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { GuestRestrictedContent } from './GuestRestrictedContent';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Award,
  GraduationCap,
  RefreshCw,
  Search,
  ExternalLink,
  Printer,
  Calendar,
  BookOpen,
  IdCard,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface SemesterResult {
  academicYear: string;
  semesterId: string;
  semesterName: string;
  semesterGpa: string;
  numericGpa: number;
  registrationNo?: string;
  department?: string;
  program?: string;
  status: 'completed' | 'pending';
  officialPortalUrl?: string;
}

export const ResultsSection = () => {
  const { user, profile, isMaster, isCR, hasPermission } = useAuth();
  const { isGuestMode } = useGuest();
  const navigate = useNavigate();

  // Admin / CR check: can view any student's results
  const canManageAll = Boolean(isMaster() || isCR() || hasPermission('student'));

  // Profiles list for Admin / CR selector
  const { data: allProfiles = [], isLoading: profilesLoading, refetch: refetchProfiles } = useProfiles();

  // Filter students only for selector
  const studentsList = useMemo(() => {
    return allProfiles.filter(p => p.student_id && p.role !== 'teacher');
  }, [allProfiles]);

  // Selected student for Admin / CR (defaults to current user's profile)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Determine active profile being viewed
  const activeProfile = useMemo(() => {
    if (canManageAll && selectedStudentId) {
      return allProfiles.find(p => p.id === selectedStudentId) || profile;
    }
    return profile;
  }, [canManageAll, selectedStudentId, allProfiles, profile]);

  // Filtered students for dropdown search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsList;
    const q = searchQuery.toLowerCase();
    return studentsList.filter(
      s => s.name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q)
    );
  }, [studentsList, searchQuery]);

  // Check guest / logged-out mode
  if (isGuestMode && !user) {
    return (
      <GuestRestrictedContent
        title="Academic Results"
        onLoginClick={() => navigate('/')}
      />
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <GraduationCap className="w-16 h-16 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Please Log In</h2>
        <p className="text-muted-foreground text-center text-sm">
          You need to be logged in to view academic results
        </p>
        <Button onClick={() => navigate('/')}>Log In</Button>
      </div>
    );
  }

  // Active student's results from DB
  const rawAcademicResults = (activeProfile as any)?.academic_results as SemesterResult[] | undefined;
  const lastSynced = (activeProfile as any)?.results_last_synced as string | undefined;
  const storedCgpa = (activeProfile as any)?.cgpa as number | undefined;

  const semestersList = useMemo(() => {
    if (!rawAcademicResults || !Array.isArray(rawAcademicResults)) return [];
    return [...rawAcademicResults].sort((a, b) => {
      const yrDiff = parseInt(a.academicYear) - parseInt(b.academicYear);
      if (yrDiff !== 0) return yrDiff;
      return parseInt(a.semesterId) - parseInt(b.semesterId);
    });
  }, [rawAcademicResults]);

  // Calculate live CGPA from completed semesters
  const completedSemesters = semestersList.filter(
    s => s.status === 'completed' && parseFloat(s.semesterGpa) > 0
  );
  const totalGpa = completedSemesters.reduce((acc, s) => acc + parseFloat(s.semesterGpa), 0);
  const computedCgpa =
    completedSemesters.length > 0 ? (totalGpa / completedSemesters.length).toFixed(2) : storedCgpa ? storedCgpa.toFixed(2) : null;

  const highestGpa =
    completedSemesters.length > 0
      ? Math.max(...completedSemesters.map(s => parseFloat(s.semesterGpa))).toFixed(2)
      : null;

  // Handle Sync / Refresh with ERP
  const handleSyncFromERP = async () => {
    if (!activeProfile?.student_id) {
      toast.error('Student ID is not set for this profile.');
      return;
    }

    if (!activeProfile.date_of_birth) {
      toast.error('Date of Birth is missing in profile. Please update DOB first.');
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-student-result', {
        body: {
          mode: 'all',
          sid: activeProfile.student_id,
          dob: activeProfile.date_of_birth,
          years: ['2024', '2025', '2026', '2027'],
        },
      });

      if (error) throw new Error(error.message || 'Failed to connect to ERP server');

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || 'No results found on ERP for this student.');
      }

      const erpData = data.data;

      // Update in Supabase profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          academic_results: erpData.semesters,
          cgpa: erpData.cgpa || null,
          results_last_synced: new Date().toISOString(),
        } as any)
        .eq('id', activeProfile.id);

      if (updateError) throw updateError;

      await refetchProfiles();
      toast.success(`Successfully synced ${erpData.totalCount} semesters from Uttara University ERP!`);
    } catch (err: any) {
      console.error('Error syncing results:', err);
      toast.error(err.message || 'Failed to sync results from ERP.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getGpaBadgeClass = (gpaStr: string) => {
    const val = parseFloat(gpaStr);
    if (isNaN(val) || val <= 0) return 'text-muted-foreground border-border bg-muted/40';
    if (val >= 3.75) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20';
    if (val >= 3.5) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10 shadow-cyan-500/20';
    if (val >= 3.0) return 'text-blue-400 border-blue-500/40 bg-blue-500/10 shadow-blue-500/20';
    if (val >= 2.5) return 'text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-amber-500/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10 shadow-rose-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Award className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Academic Results
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Uttara University semester grades & CGPA verified directly from ERP portal
          </p>
        </div>

        {/* Sync Button */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleSyncFromERP}
            disabled={isSyncing || !activeProfile?.student_id || !activeProfile?.date_of_birth}
            className="gap-2 font-semibold shadow-md shadow-primary/20 hover:shadow-primary/35"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing with ERP...' : 'Sync from ERP'}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => window.print()}
            title="Print Grade Sheet"
            className="shrink-0"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Admin / CR Student Selector Bar */}
      {canManageAll && (
        <Card className="border-accent/30 bg-accent/5 backdrop-blur-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin & CR Control: View Any Student Result</span>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {studentsList.length} Students
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search student by name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background/80"
                />
              </div>

              <div>
                <Select
                  value={activeProfile?.id || ''}
                  onValueChange={val => setSelectedStudentId(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/80">
                    <SelectValue placeholder="Select student..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {filteredStudents.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono">({s.student_id})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Identity Card */}
      <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{activeProfile?.name}</h2>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase font-mono">
                  {activeProfile?.role || 'Student'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-foreground">BSc in EEE (Diploma Holder)</span>
                <span>•</span>
                <span>Uttara University</span>
              </p>
            </div>

            {/* Sync Timestamp */}
            <div className="text-xs text-muted-foreground sm:text-right">
              <span className="block text-[11px]">Database Status</span>
              {lastSynced ? (
                <span className="text-emerald-400 font-medium flex items-center sm:justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
                </span>
              ) : (
                <span className="text-amber-400 font-medium flex items-center sm:justify-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Not synced yet (Click "Sync from ERP")
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50 text-xs">
            <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground block">Student ID</span>
              <span className="font-semibold font-mono text-foreground">{activeProfile?.student_id || 'Not set'}</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground block">Date of Birth</span>
              <span className="font-semibold font-mono text-foreground">
                {activeProfile?.date_of_birth ? format(new Date(activeProfile.date_of_birth + 'T00:00:00'), 'dd MMM yyyy') : 'Not set'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground block">Session</span>
              <span className="font-semibold text-foreground">{activeProfile?.diploma_session || '2022-2026'}</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground block">Registration No</span>
              <span className="font-semibold font-mono text-foreground">
                {semestersList[0]?.registrationNo || 'UU26174614'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CGPA Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative CGPA */}
        <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                Cumulative CGPA
              </span>
              <div className="text-3xl font-extrabold text-foreground mt-1">
                {computedCgpa ? (
                  <span className="text-primary">{computedCgpa}</span>
                ) : (
                  <span className="text-muted-foreground text-xl">Pending Sync</span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Average across completed semesters
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Semesters */}
        <Card className="border-border/80 bg-card shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                Semesters Passed
              </span>
              <div className="text-3xl font-extrabold text-foreground mt-1">
                {completedSemesters.length}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  / {semestersList.length || '0'} terms
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Successfully completed terms
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Highest Semester GPA */}
        <Card className="border-border/80 bg-card shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                Highest SGPA
              </span>
              <div className="text-3xl font-extrabold text-cyan-400 mt-1">
                {highestGpa || 'N/A'}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Peak semester performance
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semesters History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">All Semesters Result History</h3>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {semestersList.length} Terms Found
          </Badge>
        </div>

        {/* If no results stored yet */}
        {semestersList.length === 0 ? (
          <Card className="border-dashed border-2 border-border/80 bg-card/40 py-12 text-center">
            <CardContent className="space-y-3 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-base">No Synced Results Yet</h4>
              <p className="text-xs text-muted-foreground max-w-md">
                Click the <strong>"Sync from ERP"</strong> button above to automatically query Uttara University ERP and save all your semester results into the database.
              </p>
              <Button
                onClick={handleSyncFromERP}
                disabled={isSyncing || !activeProfile?.student_id || !activeProfile?.date_of_birth}
                className="gap-2 mt-2 font-semibold shadow-md shadow-primary/20"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Fetch All Semesters Now'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* All Semesters Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semestersList.map((sem, idx) => {
              const isPassed = sem.status === 'completed' && parseFloat(sem.semesterGpa) > 0;
              const portalUrl = `https://erp.uttarauniversity.edu.bd/online-result?sid=${encodeURIComponent(
                activeProfile?.student_id || ''
              )}&dob=${encodeURIComponent(activeProfile?.date_of_birth || '')}&acyear=${sem.academicYear}&semid=${sem.semesterId}`;

              return (
                <Card
                  key={idx}
                  className={`border transition-all hover:shadow-lg relative overflow-hidden group ${
                    isPassed ? 'border-border/80 hover:border-primary/50' : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold uppercase tracking-wider mb-1 bg-primary/10 text-primary border-primary/30"
                      >
                        {sem.semesterName} {sem.academicYear}
                      </Badge>
                      <CardTitle className="text-base font-bold">
                        Semester {idx + 1}
                      </CardTitle>
                    </div>

                    <Badge
                      variant={isPassed ? 'default' : 'secondary'}
                      className={`text-[10px] font-semibold tracking-wider uppercase ${
                        isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {isPassed ? 'Completed' : 'In Progress'}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* GPA Display Card */}
                    <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-background/80 border border-border/60 shadow-inner">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Semester GPA
                      </span>
                      <div
                        className={`text-3xl font-extrabold tracking-tight px-4 py-1 rounded-lg border shadow-sm ${getGpaBadgeClass(
                          sem.semesterGpa
                        )}`}
                      >
                        {sem.semesterGpa || '0.00'}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1.5">
                        {isPassed ? 'Official Verified Grade' : 'Awaiting Publication'}
                      </span>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs gap-1.5 border-border/80 hover:border-primary/40"
                        asChild
                      >
                        <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 text-primary" />
                          View on ERP
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
