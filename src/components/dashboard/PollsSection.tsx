import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { usePolls, useAddPoll, useDeletePoll, useVote, usePollVotes } from '@/hooks/usePolls';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EditModeToggle } from './EditModeToggle';
import { PollSkeleton } from './SectionSkeletons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PollCard = ({ poll, isEditMode }: { poll: { id: string; question: string; options: string[] }; isEditMode: boolean }) => {
  const { user, hasPermission } = useAuth();
  const { data: votes = [] } = usePollVotes(poll.id);
  const vote = useVote();
  const deletePoll = useDeletePoll();

  const canEdit = hasPermission('polls');
  const userVote = votes.find(v => v.user_id === user?.id);
  const totalVotes = votes.length;

  const getVoteCount = (index: number) => votes.filter(v => v.option_index === index).length;
  const getPercentage = (index: number) => totalVotes === 0 ? 0 : (getVoteCount(index) / totalVotes) * 100;

  const handleVote = async (index: number) => {
    if (!user) return toast.error('Sign in to vote');
    
    try {
      await vote.mutateAsync({ pollId: poll.id, optionIndex: index });
      toast.success('Vote recorded');
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-semibold text-lg">{poll.question}</h4>
        {canEdit && isEditMode && (
          <button 
            onClick={() => deletePoll.mutate(poll.id)}
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {poll.options.map((opt, i) => (
          <div key={i}>
            <button
              onClick={() => handleVote(i)}
              disabled={!user}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all",
                userVote?.option_index === i 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50",
                !user && "cursor-not-allowed opacity-70"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={userVote?.option_index === i ? "font-semibold" : ""}>{opt}</span>
                <span className="text-sm text-muted-foreground">{getVoteCount(i)} votes</span>
              </div>
              <Progress value={getPercentage(i)} className="h-2" />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">Total votes: {totalVotes}</p>
    </Card>
  );
};

export const PollsSection = () => {
  const { hasPermission } = useAuth();
  const { data: polls = [], isLoading } = usePolls();
  const addPoll = useAddPoll();

  const [formData, setFormData] = useState({
    question: '',
    options: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const canEdit = hasPermission('polls');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question) return toast.error('Question is required');
    
    const options = formData.options.split(',').map(o => o.trim()).filter(Boolean);
    if (options.length < 2) return toast.error('At least 2 options required');
    
    try {
      await addPoll.mutateAsync({ question: formData.question, options });
      setFormData({ question: '', options: '' });
      toast.success('Poll created');
    } catch (error) {
      toast.error('Failed to create poll');
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">🗳️ Voting & Polls</h2>
        {canEdit && (
          <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
        )}
      </div>

      {canEdit && isEditMode && (
        <form onSubmit={handleSubmit} className="admin-form space-y-3">
          <Input 
            placeholder="Question" 
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          />
          <Textarea 
            placeholder="Options (comma separated, e.g. Option A, Option B, Option C)" 
            value={formData.options}
            onChange={(e) => setFormData({ ...formData, options: e.target.value })}
            rows={3}
          />
          <Button type="submit" className="w-full">Create Poll</Button>
        </form>
      )}

      <div className="space-y-4">
        {polls.map((p) => (
          <PollCard key={p.id} poll={p} isEditMode={isEditMode} />
        ))}
        
        {polls.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No polls created yet</p>
        )}
      </div>
    </div>
  );
};
