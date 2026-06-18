import { useState, useMemo } from 'react';
import { Trash2, FileText, Check, Download, Plus, X, Pencil } from 'lucide-react';
import { useAttendance, useAddAttendance, useUpdateAttendance, useDeleteAttendance } from '@/hooks/useAttendance';
import { useProfiles } from '@/hooks/useProfiles';
import { useActiveTerm } from '@/hooks/useAcademicTerms';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EditModeToggle } from './EditModeToggle';
import { AttendanceSkeleton } from './SectionSkeletons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AttendanceSection = () => {
  const { hasPermission, user, profile } = useAuth();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const { data: activeTerm } = useActiveTerm();
  const addAttendance = useAddAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();

  const studentProfiles = useMemo(() => {
    return profiles
      .filter(p => p.role === 'student' || p.role === 'cr')
      .sort((a, b) => (a.student_id || '').localeCompare(b.student_id || ''));
  }, [profiles]);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    subject: ''
  });
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [manualId, setManualId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const manuallyAddedIds = useMemo(() => {
    const studentIds = new Set(studentProfiles.map(p => p.student_id).filter(Boolean));
    return Array.from(presentIds).filter(id => !studentIds.has(id));
  }, [presentIds, studentProfiles]);

  const canEdit = hasPermission('attendance');

  const togglePresent = (studentId: string) => {
    const newSet = new Set(presentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setPresentIds(newSet);
  };

  const selectAll = (present: boolean) => {
    if (present) {
      setPresentIds(new Set(studentProfiles.map(p => p.student_id).filter(Boolean) as string[]));
    } else {
      setPresentIds(new Set());
    }
  };

  const handleAddManualId = () => {
    const trimmedId = manualId.trim();
    if (!trimmedId) {
      return toast.error('Please enter a student ID');
    }
    if (presentIds.has(trimmedId)) {
      return toast.error('This ID is already added');
    }
    const newSet = new Set(presentIds);
    newSet.add(trimmedId);
    setPresentIds(newSet);
    setManualId('');
    toast.success(`Added ${trimmedId} to present list`);
  };

  const handleEdit = (record: typeof attendance[0]) => {
    setEditingId(record.id);
    setFormData({
      date: record.date,
      subject: record.subject
    });
    setPresentIds(new Set(record.present_ids || []));
    setIsEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ date: format(new Date(), 'yyyy-MM-dd'), subject: '' });
    setPresentIds(new Set());
  };

  const handleSave = async () => {
    if (!formData.date || !formData.subject) {
      return toast.error('Date and Subject are required');
    }
    
    try {
      if (editingId) {
        await updateAttendance.mutateAsync({
          id: editingId,
          date: formData.date,
          subject: formData.subject,
          present_ids: Array.from(presentIds)
        });
        toast.success('Attendance updated');
      } else {
        await addAttendance.mutateAsync({
          date: formData.date,
          subject: formData.subject,
          present_ids: Array.from(presentIds)
        });
        toast.success('Attendance saved');
      }
      setEditingId(null);
      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), subject: '' });
      setPresentIds(new Set());
    } catch (error) {
      toast.error(editingId ? 'Failed to update attendance' : 'Failed to save attendance');
    }
  };

  const generatePDF = (record: typeof attendance[0]) => {
    const doc = new jsPDF();
    
    const studentIds = new Set(studentProfiles.map(p => p.student_id).filter(Boolean));
    const manualIds = record.present_ids.filter(id => !studentIds.has(id));
    
    const presentCount = record.present_ids.length;
    const totalStudents = studentProfiles.length;
    const manualCount = manualIds.length;
    const absentCount = totalStudents - (presentCount - manualCount);

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Attendance Report', 105, 20, { align: 'center' });
    
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    const termLabel = activeTerm
      ? `${activeTerm.season} ${activeTerm.year} - Trimester ${activeTerm.trimester_number}`
      : 'N/A';

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('Batch: 49 D', 20, 35);
    doc.text(`Semester: ${termLabel}`, 20, 42);
    doc.text(`Subject: ${record.subject}`, 20, 49);
    doc.text(`Date: ${format(new Date(record.date), 'dd MMM yyyy')}`, 20, 56);
    
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(130, 30, 60, 25, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(59, 130, 246);
    doc.text(`Present: ${presentCount}`, 135, 38);
    doc.text(`Absent: ${absentCount}`, 135, 45);
    if (manualCount > 0) {
      doc.text(`Manual: ${manualCount}`, 135, 52);
    }

    const tableData = studentProfiles.map((p, index) => {
      const isPresent = record.present_ids.includes(p.student_id || '');
      return [
        (index + 1).toString(),
        p.student_id || 'N/A',
        p.name,
        isPresent ? 'Present' : 'Absent'
      ];
    });
    
    manualIds.forEach((id, index) => {
      tableData.push([
        (studentProfiles.length + index + 1).toString(),
        id,
        '(Retake Student)',
        'Present'
      ]);
    });

    autoTable(doc, {
      startY: 55,
      head: [['#', 'Student ID', 'Name', 'Status']],
      body: tableData,
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 80 },
        3: { cellWidth: 35, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const isPresent = data.cell.raw?.toString() === 'Present';
          data.cell.styles.textColor = isPresent ? [34, 197, 94] : [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 105, pageHeight - 10, { align: 'center' });
    doc.text('UU EEE Batch 2026', 105, pageHeight - 5, { align: 'center' });

    doc.save(`Attendance_${record.subject}_${record.date}.pdf`);
    toast.success('PDF downloaded!');
  };

  const isLoading = attendanceLoading || profilesLoading;

  if (isLoading) {
    return (
      <div className="animate-fade-up">
        <h2 className="section-title mb-4">📝 Attendance</h2>
        <AttendanceSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">📝 Attendance</h2>
        {canEdit && (
          <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
        )}
      </div>

      {canEdit && isEditMode && user && (
        <div className="admin-form space-y-4">
          {editingId && (
            <div className="flex items-center justify-between bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium">
              <span>✏️ Editing attendance record</span>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Input 
              placeholder="Subject Name" 
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => selectAll(true)}>
                All Present
              </Button>
              <Button variant="secondary" size="sm" onClick={() => selectAll(false)}>
                Clear
              </Button>
            </div>
            <div className="text-sm font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-full">
              ✓ {presentIds.size} / {studentProfiles.length}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter Student ID (e.g., 2022-1234)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddManualId()}
              className="flex-1"
            />
            <Button variant="secondary" size="sm" onClick={handleAddManualId}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {manuallyAddedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Manual:</span>
              {manuallyAddedIds.map(id => (
                <span 
                  key={id} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium"
                >
                  {id}
                  <button onClick={() => togglePresent(id)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {studentProfiles.map((p, index) => (
              <div
                key={p.id}
                onClick={() => p.student_id && togglePresent(p.student_id)}
                className={cn(
                  "att-student relative",
                  p.student_id && presentIds.has(p.student_id) && "present"
                )}
              >
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                  {index + 1}
                </div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.student_id || '-'}</p>
                {p.student_id && presentIds.has(p.student_id) && (
                  <Check className="w-4 h-4 mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full" 
            disabled={addAttendance.isPending || updateAttendance.isPending}
          >
            {editingId ? '✏️ Update Record' : '💾 Save Record'}
          </Button>
        </div>
      )}

      {!canEdit && !user && (
        <p className="text-muted-foreground text-center py-4">
          Sign in to view attendance records
        </p>
      )}

      <h3 className="text-lg font-semibold mt-8 mb-4">📜 History</h3>
      <div className="space-y-3">
        {attendance.map((a) => {
          const isUserPresent = profile?.student_id && a.present_ids.includes(profile.student_id);
          
          return (
          <Card key={a.id} className={cn("card-accent p-4", editingId === a.id && "ring-2 ring-primary")}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{a.subject}</h4>
                <p className="text-sm text-muted-foreground">{a.date}</p>
                <p className="text-xs text-muted-foreground">
                  Present: {a.present_ids.length} / {studentProfiles.length}
                </p>
                {user && profile?.student_id && (
                  <div className={cn(
                    "inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-medium",
                    isUserPresent 
                      ? "bg-primary/10 text-primary" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {isUserPresent ? "✓ You were Present" : "✗ You were Absent"}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {canEdit && isEditMode && (
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(a)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {canEdit && (
                  <Button variant="secondary" size="sm" onClick={() => generatePDF(a)}>
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                )}
                {canEdit && isEditMode && (
                  <button 
                    onClick={() => deleteAttendance.mutate(a.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </Card>
          );
        })}
        
        {attendance.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No attendance records yet</p>
        )}
      </div>
    </div>
  );
};
