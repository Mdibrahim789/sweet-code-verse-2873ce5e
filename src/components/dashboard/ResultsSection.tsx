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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Eye,
  User,
  Shield,
  Filter,
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
  const { user, profile, loading: authLoading, isMaster, isCR, hasPermission } = useAuth();
  const { isGuestMode } = useGuest();
  const navigate = useNavigate();

  // Admin & CR check: can view all students
  const isAdminOrCr = Boolean(isMaster() || isCR() || hasPermission('student'));

  // Profiles list from Supabase
  const { data: allProfiles = [], isLoading: profilesLoading, refetch: refetchProfiles } = useProfiles();

  // Filter profiles: ONLY students and CRs, sorted by student_id for consistent serial numbering
  const studentProfiles = useMemo(() => {
    return allProfiles
      .filter((p) => p.role === 'student' || p.role === 'cr')
      .sort((a, b) => {
        const idA = a.student_id || '';
        const idB = b.student_id || '';
        return idA.localeCompare(idB);
      });
  }, [allProfiles]);

  // View state: Admin & CR land on 'my' (My Result) by default, can switch to 'all' (All Students)
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'synced' | 'pending'>('all');
  const [syncingStudentId, setSyncingStudentId] = useState<string | null>(null);

  // Modal state for viewing a specific student's detail
  const [inspectStudent, setInspectStudent] = useState<Profile | null>(null);

  // Filtered students for 'All Students' view
  const filteredStudents = useMemo(() => {
    let list = studentProfiles;

    if (statusFilter === 'synced') {
      list = list.filter((s) => s.academic_results && s.academic_results.length > 0);
    } else if (statusFilter === 'pending') {
      list = list.filter((s) => !s.academic_results || s.academic_results.length === 0);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        (s.student_id && s.student_id.toLowerCase().includes(q))
    );
  }, [studentProfiles, statusFilter, searchQuery]);

  // Overall batch statistics for Admin & CR
  const syncedStudentsCount = useMemo(
    () => studentProfiles.filter((s) => s.academic_results && s.academic_results.length > 0).length,
    [studentProfiles]
  );

  const batchCgpaList = useMemo(
    () =>
      studentProfiles
        .filter((s) => typeof s.cgpa === 'number' && s.cgpa > 0)
        .map((s) => s.cgpa as number),
    [studentProfiles]
  );

  const averageBatchCgpa =
    batchCgpaList.length > 0
      ? (batchCgpaList.reduce((acc, c) => acc + c, 0) / batchCgpaList.length).toFixed(2)
      : null;

  // Single student sync function (used for personal sync or admin syncing any student)
  const handleSyncStudent = async (targetProfile: Profile) => {
    if (!targetProfile?.student_id) {
      toast.error('Student ID is missing for this student.');
      return;
    }

    if (!targetProfile.date_of_birth) {
      toast.error(`Date of Birth is missing for ${targetProfile.name}.`);
      return;
    }

    setSyncingStudentId(targetProfile.id);
    try {
      const { data, error } = await supabase.functions.invoke('get-student-result', {
        body: {
          mode: 'all',
          sid: targetProfile.student_id,
          dob: targetProfile.date_of_birth,
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
        .eq('id', targetProfile.id);

      if (updateError) throw updateError;

      await refetchProfiles();

      // If currently inspecting this student in modal, update modal view
      if (inspectStudent && inspectStudent.id === targetProfile.id) {
        setInspectStudent({
          ...inspectStudent,
          academic_results: erpData.semesters,
          cgpa: erpData.cgpa || null,
          results_last_synced: new Date().toISOString(),
        } as Profile);
      }

      toast.success(
        `Successfully synced ${erpData.totalCount} semesters for ${targetProfile.name}!`
      );
    } catch (err: any) {
      console.error('Error syncing results:', err);
      toast.error(err.message || 'Failed to sync results from ERP.');
    } finally {
      setSyncingStudentId(null);
    }
  };

  const getGpaBadgeClass = (gpaVal: number | string | null | undefined) => {
    const val = typeof gpaVal === 'string' ? parseFloat(gpaVal) : typeof gpaVal === 'number' ? gpaVal : NaN;
    if (isNaN(val) || val <= 0) return 'text-muted-foreground border-border bg-muted/40';
    if (val >= 3.75) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20';
    if (val >= 3.5) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10 shadow-cyan-500/20';
    if (val >= 3.0) return 'text-blue-400 border-blue-500/40 bg-blue-500/10 shadow-blue-500/20';
    if (val >= 2.5) return 'text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-amber-500/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10 shadow-rose-500/20';
  };

  // Helper to render a student's full result view (reused for 'My Result' and the inspect modal)
  const renderStudentResultDetails = (target: Profile | null | undefined, isModal = false) => {
    if (!target) return null;
    const rawResults = (target as any)?.academic_results as SemesterResult[] | undefined;
    const lastSyncedAt = (target as any)?.results_last_synced as string | undefined;
    const userCgpa = (target as any)?.cgpa as number | undefined;

    const semesters = Array.isArray(rawResults)
      ? [...rawResults].sort((a, b) => {
          const yrDiff = parseInt(a.academicYear) - parseInt(b.academicYear);
          if (yrDiff !== 0) return yrDiff;
          return parseInt(a.semesterId) - parseInt(b.semesterId);
        })
      : [];

    const completed = semesters.filter(
      (s) => s.status === 'completed' && parseFloat(s.semesterGpa) > 0
    );
    const sumGpa = completed.reduce((acc, s) => acc + parseFloat(s.semesterGpa), 0);
    const finalCgpa =
      completed.length > 0
        ? (sumGpa / completed.length).toFixed(2)
        : userCgpa
        ? userCgpa.toFixed(2)
        : null;

    const highest =
      completed.length > 0
        ? Math.max(...completed.map((s) => parseFloat(s.semesterGpa))).toFixed(2)
        : null;

    const isCurrentSyncing = syncingStudentId === target.id;

    return (
      <div className="space-y-6">
        {/* Student Identity Card */}
        <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-md">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar className="w-12 h-12 border-2 border-primary/40 shadow-md">
                  <AvatarImage src={target.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-base">
                    {target.name?.substring(0, 2).toUpperCase() || 'ST'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">{target.name}</h2>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-mono ${
                        target.role === 'cr'
                          ? 'border-accent/40 bg-accent/10 text-accent font-semibold'
                          : 'border-primary/30 text-primary'
                      }`}
                    >
                      {target.role === 'cr' ? 'CR' : 'Student'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-foreground">BSc in EEE (Diploma Holder)</span>
                    <span>•</span>
                    <span>Uttara University</span>
                  </p>
                </div>
              </div>

              {/* Sync Timestamp & Action */}
              <div className="flex flex-col sm:items-end gap-1.5">
                <div className="text-xs text-muted-foreground">
                  {lastSyncedAt ? (
                    <span className="text-emerald-400 font-medium flex items-center sm:justify-end gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium flex items-center sm:justify-end gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      Not synced yet
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => handleSyncStudent(target)}
                  disabled={isCurrentSyncing || !target.student_id || !target.date_of_birth}
                  className="h-8 gap-1.5 text-xs font-semibold shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCurrentSyncing ? 'animate-spin' : ''}`} />
                  {isCurrentSyncing ? 'Syncing...' : 'Sync from ERP'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50 text-xs">
              <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Student ID</span>
                <span className="font-semibold font-mono text-foreground">
                  {target.student_id || 'Not set'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Date of Birth</span>
                <span className="font-semibold font-mono text-foreground">
                  {target.date_of_birth
                    ? format(new Date(target.date_of_birth + 'T00:00:00'), 'dd MMM yyyy')
                    : 'Not set'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Session</span>
                <span className="font-semibold text-foreground">
                  {target.diploma_session || '2022-2026'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Registration No</span>
                <span className="font-semibold font-mono text-foreground">
                  {semesters[0]?.registrationNo || 'UU26174614'}
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
                  {finalCgpa ? (
                    <span className="text-primary">{finalCgpa}</span>
                  ) : (
                    <span className="text-muted-foreground text-xl">Pending Sync</span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Average across completed terms
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
                  {completed.length}
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    / {semesters.length || '0'} terms
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
                  {highest || 'N/A'}
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
              <h3 className="text-lg font-bold text-foreground">Semester Breakdown</h3>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {semesters.length} Terms Available
            </Badge>
          </div>

          {semesters.length === 0 ? (
            <Card className="border-dashed border-2 border-border/80 bg-card/40 py-12 text-center">
              <CardContent className="space-y-3 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-base">No Synced Results Yet</h4>
                <p className="text-xs text-muted-foreground max-w-md">
                  Click the <strong>"Sync from ERP"</strong> button to pull semester grades live from Uttara University ERP.
                </p>
                <Button
                  onClick={() => handleSyncStudent(target)}
                  disabled={isCurrentSyncing || !target.student_id || !target.date_of_birth}
                  className="gap-2 mt-2 font-semibold shadow-md shadow-primary/20"
                >
                  <RefreshCw className={`w-4 h-4 ${isCurrentSyncing ? 'animate-spin' : ''}`} />
                  {isCurrentSyncing ? 'Syncing...' : 'Fetch All Semesters Now'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {semesters.map((sem, idx) => {
                const isPassed = sem.status === 'completed' && parseFloat(sem.semesterGpa) > 0;
                const portalUrl = `https://erp.uttarauniversity.edu.bd/online-result?sid=${encodeURIComponent(
                  target?.student_id || ''
                )}&dob=${encodeURIComponent(target?.date_of_birth || '')}&acyear=${sem.academicYear}&semid=${sem.semesterId}`;

                return (
                  <Card
                    key={idx}
                    className={`border transition-all hover:shadow-lg relative overflow-hidden group ${
                      isPassed
                        ? 'border-border/80 hover:border-primary/50'
                        : 'border-amber-500/30 bg-amber-500/5'
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
                          isPassed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
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

  // 1. Loading state: while auth is initializing or profile is being fetched
  if (authLoading || (user && !profile)) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-muted/60 rounded-md" />
            <div className="h-4 w-72 bg-muted/40 rounded-md" />
          </div>
          <div className="h-9 w-28 bg-muted/60 rounded-md" />
        </div>

        <Card className="border border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted/60" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-muted/60 rounded" />
              <div className="h-4 w-36 bg-muted/40 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/40">
            <div className="h-14 rounded-lg bg-muted/40" />
            <div className="h-14 rounded-lg bg-muted/40" />
            <div className="h-14 rounded-lg bg-muted/40" />
            <div className="h-14 rounded-lg bg-muted/40" />
          </div>
        </Card>

        <Card className="border border-border/80 bg-card p-6 space-y-4">
          <div className="h-6 w-44 bg-muted/60 rounded" />
          <div className="h-32 w-full rounded-lg bg-muted/30" />
        </Card>
      </div>
    );
  }

  // 2. Guest restricted view
  if (isGuestMode && !user) {
    return (
      <GuestRestrictedContent
        title="Academic Results"
        onLoginClick={() => navigate('/')}
      />
    );
  }

  // 3. Not logged in view
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Title */}
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

        {/* Global Print button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-2 text-xs font-semibold self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          Print Grade Sheet
        </Button>
      </div>

      {/* Admin / CR Mode Switcher: "My Result" vs "All Students' Results" */}
      {isAdminOrCr && (
        <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-xl border border-border/80 w-full sm:w-fit">
          <Button
            variant={activeTab === 'my' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('my')}
            className={`flex-1 sm:flex-none gap-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'my' ? 'shadow-md shadow-primary/20' : 'text-muted-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            My Result
          </Button>

          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none gap-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all' ? 'shadow-md shadow-primary/20' : 'text-muted-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            All Students' Results
            <Badge
              variant="outline"
              className={`ml-1 text-[10px] px-1.5 py-0 h-4 font-mono ${
                activeTab === 'all' ? 'bg-primary-foreground text-primary border-transparent' : ''
              }`}
            >
              {studentProfiles.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* VIEW 1: MY RESULT (Default for everyone, including Admin & CR) */}
      {activeTab === 'my' && renderStudentResultDetails(profile)}

      {/* VIEW 2: ALL STUDENTS' RESULTS (Exclusive to Admin & CR) */}
      {activeTab === 'all' && isAdminOrCr && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Admin Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border/80 bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block uppercase">
                    Total Students
                  </span>
                  <span className="text-2xl font-bold text-foreground font-mono">
                    {studentProfiles.length}
                  </span>
                </div>
                <Users className="w-8 h-8 text-primary/60" />
              </div>
            </Card>

            <Card className="border border-border/80 bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block uppercase">
                    Synced from ERP
                  </span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">
                    {syncedStudentsCount}
                    <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                      / {studentProfiles.length}
                    </span>
                  </span>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
              </div>
            </Card>

            <Card className="border border-border/80 bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block uppercase">
                    Batch Average CGPA
                  </span>
                  <span className="text-2xl font-bold text-cyan-400 font-mono">
                    {averageBatchCgpa || 'N/A'}
                  </span>
                </div>
                <TrendingUp className="w-8 h-8 text-cyan-400/60" />
              </div>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search by student name or roll ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-card"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg border border-border text-xs">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="h-7 text-xs px-2.5"
                >
                  All ({studentProfiles.length})
                </Button>
                <Button
                  variant={statusFilter === 'synced' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('synced')}
                  className="h-7 text-xs px-2.5"
                >
                  Synced ({syncedStudentsCount})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className="h-7 text-xs px-2.5"
                >
                  Pending ({studentProfiles.length - syncedStudentsCount})
                </Button>
              </div>
            </div>
          </div>

          {/* Students Serial Table */}
          <Card className="border border-border/80 bg-card overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead className="w-14 text-center font-bold">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="text-center">Cumulative CGPA</TableHead>
                    <TableHead>Semesters Highlights</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                        No students found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((st, idx) => {
                      const stResults = (st as any).academic_results as SemesterResult[] | undefined;
                      const hasResults = Array.isArray(stResults) && stResults.length > 0;
                      const isRowSyncing = syncingStudentId === st.id;

                      return (
                        <TableRow key={st.id} className="hover:bg-muted/30 border-border transition-colors">
                          {/* Serial Number */}
                          <TableCell className="text-center font-mono font-bold text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>

                          {/* Student Info */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-8 h-8 border border-border">
                                <AvatarImage src={st.avatar_url || ''} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                  {st.name?.substring(0, 2).toUpperCase() || 'ST'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                  <span>{st.name}</span>
                                  {st.role === 'cr' && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-accent/40 bg-accent/10 text-accent font-semibold">
                                      CR
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {st.diploma_session || '2022-2026'}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Student ID */}
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            {st.student_id || 'Not set'}
                          </TableCell>

                          {/* CGPA */}
                          <TableCell className="text-center">
                            {typeof st.cgpa === 'number' && st.cgpa > 0 ? (
                              <Badge
                                variant="outline"
                                className={`text-xs font-bold font-mono px-2.5 py-0.5 ${getGpaBadgeClass(
                                  st.cgpa
                                )}`}
                              >
                                {st.cgpa.toFixed(2)}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                Not Synced
                              </Badge>
                            )}
                          </TableCell>

                          {/* Semesters Highlights */}
                          <TableCell>
                            {hasResults ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {stResults.map((sem, sIdx) => {
                                  const isPass = sem.status === 'completed' && parseFloat(sem.semesterGpa) > 0;
                                  return (
                                    <span
                                      key={sIdx}
                                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                        isPass
                                          ? 'bg-muted/50 border-border text-foreground'
                                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                      }`}
                                      title={`${sem.semesterName} ${sem.academicYear}: GPA ${sem.semesterGpa}`}
                                    >
                                      {sem.semesterName.substring(0, 2)}'{sem.academicYear.substring(2)}:{' '}
                                      <strong className={isPass ? 'text-primary' : 'text-amber-400'}>
                                        {sem.semesterGpa}
                                      </strong>
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Awaiting ERP sync
                              </span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Full History */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setInspectStudent(st)}
                                className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                title="View Semester History"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </Button>

                              {/* Direct Sync Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSyncStudent(st)}
                                disabled={isRowSyncing || !st.student_id || !st.date_of_birth}
                                className="h-7 px-2 text-xs gap-1 border-border/80 hover:border-primary/40"
                                title="Sync from ERP"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRowSyncing ? 'animate-spin' : ''}`} />
                                {isRowSyncing ? '...' : 'Sync'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* Admin Inspection Modal: Viewing Any Selected Student's Details */}
      {inspectStudent && (
        <Dialog open={Boolean(inspectStudent)} onOpenChange={(open) => !open && setInspectStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-6">
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <GraduationCap className="w-6 h-6 animate-pulse" />
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Student Academic Result Details
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Inspecting full semester breakdown and ERP records for {inspectStudent.name}
              </DialogDescription>
            </DialogHeader>

            <div className="pt-3">
              {renderStudentResultDetails(inspectStudent, true)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
