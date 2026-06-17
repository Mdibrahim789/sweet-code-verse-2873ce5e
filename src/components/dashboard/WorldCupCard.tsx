import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { CalendarClock, Trophy } from 'lucide-react';
import { useMatches, type Match } from '@/hooks/useMatches';

const TeamRow = ({ match, finished }: { match: Match; finished: boolean }) => (
  <div className="flex items-center justify-between gap-2 py-1.5">
    <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right text-sm font-semibold">
      <span className="truncate">{match.team_a}</span>
      {match.team_a_flag && <span className="text-base">{match.team_a_flag}</span>}
    </span>
    {finished ? (
      <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 font-display text-sm font-bold text-foreground">
        {match.score_a ?? 0} - {match.score_b ?? 0}
      </span>
    ) : (
      <span className="shrink-0 text-xs font-bold text-muted-foreground">vs</span>
    )}
    <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold">
      {match.team_b_flag && <span className="text-base">{match.team_b_flag}</span>}
      <span className="truncate">{match.team_b}</span>
    </span>
  </div>
);

export const WorldCupCard = () => {
  const { matches, loading } = useMatches();

  if (loading || matches.length === 0) return null;

  const now = Date.now();
  const upcoming = matches
    .filter((m) => m.status !== 'finished')
    .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime())
    .slice(0, 5);
  const results = matches
    .filter((m) => m.status === 'finished')
    .sort((a, b) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime())
    .slice(0, 5);

  return (
    <Card className="overflow-hidden border-l-4 border-l-accent p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-accent" />
        <h3 className="font-display text-lg font-bold">World Cup</h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Upcoming */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <CalendarClock className="h-3.5 w-3.5" /> Upcoming
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming matches.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card/50 px-3 py-2">
                  <div className="mb-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{m.stage || 'Match'}</span>
                    <span>{format(new Date(m.match_time), 'dd MMM, h:mm a')}</span>
                  </div>
                  <TeamRow match={m} finished={false} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-success">
            <Trophy className="h-3.5 w-3.5" /> Results
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No results yet.</p>
          ) : (
            <div className="space-y-2">
              {results.map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card/50 px-3 py-2">
                  <div className="mb-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{m.stage || 'Match'}</span>
                    <span>{format(new Date(m.match_time), 'dd MMM')}</span>
                  </div>
                  <TeamRow match={m} finished={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
