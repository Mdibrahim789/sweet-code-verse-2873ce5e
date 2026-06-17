import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useMatches } from '@/hooks/useMatches';

export const MatchesManager = () => {
  const { matches, createMatch, updateScore, deleteMatch } = useMatches();

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [flagA, setFlagA] = useState('');
  const [flagB, setFlagB] = useState('');
  const [stage, setStage] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [adding, setAdding] = useState(false);

  // per-match score inputs
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});

  const handleAdd = async () => {
    if (!teamA.trim() || !teamB.trim()) {
      toast.error('Enter both team names');
      return;
    }
    if (!matchTime) {
      toast.error('Select kickoff date & time');
      return;
    }
    setAdding(true);
    const ok = await createMatch({
      team_a: teamA.trim(),
      team_b: teamB.trim(),
      team_a_flag: flagA.trim() || null,
      team_b_flag: flagB.trim() || null,
      stage: stage.trim() || null,
      match_time: new Date(matchTime).toISOString(),
    });
    setAdding(false);
    if (ok) {
      setTeamA('');
      setTeamB('');
      setFlagA('');
      setFlagB('');
      setStage('');
      setMatchTime('');
    }
  };

  const handleSaveScore = async (id: string) => {
    const s = scores[id];
    const a = parseInt(s?.a ?? '', 10);
    const b = parseInt(s?.b ?? '', 10);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      toast.error('Enter both scores');
      return;
    }
    await updateScore(id, a, b);
  };

  return (
    <Card className="p-6 border-l-4 border-l-accent">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold">World Cup Matches</h3>
      </div>

      {/* Add form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Input placeholder="Team A" value={teamA} onChange={(e) => setTeamA(e.target.value)} />
        <Input placeholder="Team B" value={teamB} onChange={(e) => setTeamB(e.target.value)} />
        <Input placeholder="Team A flag/emoji (optional)" value={flagA} onChange={(e) => setFlagA(e.target.value)} />
        <Input placeholder="Team B flag/emoji (optional)" value={flagB} onChange={(e) => setFlagB(e.target.value)} />
        <Input placeholder="Stage e.g. Group A (optional)" value={stage} onChange={(e) => setStage(e.target.value)} />
        <Input type="datetime-local" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} />
      </div>
      <Button onClick={handleAdd} disabled={adding} className="mb-6">
        <Plus className="w-4 h-4 mr-1" /> Add Match
      </Button>

      {/* List */}
      <div className="space-y-2">
        {matches.length === 0 && (
          <p className="text-sm text-muted-foreground">No matches added yet.</p>
        )}
        {matches.map((m) => (
          <div key={m.id} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{m.stage || 'Match'}</span>
              <span>{format(new Date(m.match_time), 'dd MMM yyyy, h:mm a')}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-semibold">
                {m.team_a_flag} {m.team_a} <span className="text-muted-foreground">vs</span> {m.team_b_flag} {m.team_b}
                {m.status === 'finished' && (
                  <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-sm">
                    {m.score_a} - {m.score_b}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-14"
                  placeholder="A"
                  defaultValue={m.score_a ?? ''}
                  onChange={(e) =>
                    setScores((prev) => ({ ...prev, [m.id]: { a: e.target.value, b: prev[m.id]?.b ?? String(m.score_b ?? '') } }))
                  }
                />
                <Input
                  type="number"
                  className="w-14"
                  placeholder="B"
                  defaultValue={m.score_b ?? ''}
                  onChange={(e) =>
                    setScores((prev) => ({ ...prev, [m.id]: { a: prev[m.id]?.a ?? String(m.score_a ?? ''), b: e.target.value } }))
                  }
                />
                <Button size="sm" variant="secondary" onClick={() => handleSaveScore(m.id)}>
                  Save result
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMatch(m.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
