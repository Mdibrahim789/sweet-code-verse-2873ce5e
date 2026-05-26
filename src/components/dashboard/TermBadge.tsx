import { CalendarDays, Sun, Leaf, Flower } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useActiveTerm, type Season } from '@/hooks/useAcademicTerms';
import { cn } from '@/lib/utils';

const seasonIcon = (s: Season) => {
  if (s === 'Spring') return <Flower className="w-3.5 h-3.5" />;
  if (s === 'Summer') return <Sun className="w-3.5 h-3.5" />;
  return <Leaf className="w-3.5 h-3.5" />;
};

const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : '3rd');

interface TermBadgeProps {
  compact?: boolean;
  className?: string;
}

export const TermBadge = ({ compact = false, className }: TermBadgeProps) => {
  const { data: term } = useActiveTerm();
  if (!term) return null;

  const yearShort = String(term.year).slice(-2);
  const label = compact
    ? `${term.season} '${yearShort} · T${term.trimester_number}`
    : `${term.season} ${term.year} · ${ordinal(term.trimester_number)} Trimester`;

  const start = new Date(term.start_date);
  const end = new Date(term.end_date);
  const today = new Date();
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const elapsed = Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
  const remaining = Math.max(0, Math.round((end.getTime() - today.getTime()) / 86400000));
  const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors',
            className
          )}
          aria-label={`Current term: ${label}`}
        >
          {seasonIcon(term.season)}
          <span className="whitespace-nowrap">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {seasonIcon(term.season)}
            <h4 className="font-bold text-sm">
              {term.season} {term.year} — {ordinal(term.trimester_number)} Trimester
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>
              {fmt(start)} – {fmt(end)}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{progress}% complete</span>
              <span className="text-muted-foreground">{remaining} days left</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
