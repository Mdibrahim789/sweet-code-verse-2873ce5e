import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarRange, Check, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAcademicTerms,
  useUpsertTerm,
  useSetActiveTerm,
  useDeleteTerm,
  type Season,
} from '@/hooks/useAcademicTerms';

export const AcademicTermsManager = () => {
  const { data: terms = [], isLoading } = useAcademicTerms();
  const upsert = useUpsertTerm();
  const setActive = useSetActiveTerm();
  const del = useDeleteTerm();

  const [season, setSeason] = useState<Season>('Summer');
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [trimester, setTrimester] = useState<'1' | '2' | '3'>('2');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [makeActive, setMakeActive] = useState(true);

  const handleAdd = async () => {
    if (!startDate || !endDate) {
      toast.error('Start ও end date দিন');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date অবশ্যই start date এর পরে হতে হবে');
      return;
    }
    try {
      await upsert.mutateAsync({
        season,
        year: parseInt(year, 10),
        trimester_number: parseInt(trimester, 10) as 1 | 2 | 3,
        start_date: startDate,
        end_date: endDate,
        is_active: makeActive,
      });
      toast.success('Term added!');
      setStartDate('');
      setEndDate('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to add term');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await setActive.mutateAsync(id);
      toast.success('Active term updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this term?')) return;
    try {
      await del.mutateAsync(id);
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    }
  };

  return (
    <Card className="p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center gap-2 mb-4">
        <CalendarRange className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold">Academic Terms (Trimester / Season)</h3>
      </div>

      {/* Add form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div>
          <Label className="text-xs">Season</Label>
          <Select value={season} onValueChange={(v) => setSeason(v as Season)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Spring">Spring</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
              <SelectItem value="Fall">Fall</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Year</Label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Trimester</Label>
          <Select value={trimester} onValueChange={(v) => setTrimester(v as '1' | '2' | '3')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st</SelectItem>
              <SelectItem value="2">2nd</SelectItem>
              <SelectItem value="3">3rd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">End date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={makeActive}
            onChange={(e) => setMakeActive(e.target.checked)}
            className="rounded"
          />
          Set as currently active term
        </label>
        <Button onClick={handleAdd} disabled={upsert.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Add Term
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">All Terms</h4>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : terms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No terms added yet</p>
        ) : (
          terms.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                t.is_active ? 'border-primary bg-primary/5' : 'bg-muted/50 border-transparent'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">
                    {t.season} {t.year} — Trimester {t.trimester_number}
                  </p>
                  {t.is_active && (
                    <Badge className="bg-primary text-primary-foreground">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.start_date).toLocaleDateString()} →{' '}
                  {new Date(t.end_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!t.is_active && (
                  <Button size="sm" variant="outline" onClick={() => handleSetActive(t.id)}>
                    <Check className="w-4 h-4 mr-1" /> Set Active
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
