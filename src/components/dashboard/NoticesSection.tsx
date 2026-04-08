import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNotices, useAddNotice, useDeleteNotice, Notice } from '@/hooks/useNotices';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SendNotificationCheckbox } from './SendNotificationCheckbox';
import { EditModeToggle } from './EditModeToggle';
import { NotificationToggle } from './NotificationPrompt';
import { CardListSkeleton } from './SectionSkeletons';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const NoticesSection = () => {
  const { hasPermission, isMaster } = useAuth();
  const { data: notices = [], isLoading } = useNotices();
  const addNotice = useAddNotice();
  const deleteNotice = useDeleteNotice();
  const { sendNotification } = usePushNotifications();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [sendPushNotification, setSendPushNotification] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const canEdit = hasPermission('notice');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Title is required');
    
    setIsSubmitting(true);
    try {
      await addNotice.mutateAsync(formData);
      toast.success('Notice posted');
      
      if (sendPushNotification && isMaster()) {
        await sendNotification({
          title: `📢 New Notice – 49 D EEE`,
          message: formData.title,
          url: window.location.origin,
          data: { type: 'notice', date: formData.date }
        });
      }
      
      setFormData({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      setSendPushNotification(false);
    } catch (error) {
      toast.error('Failed to post notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this notice?')) {
      try {
        await deleteNotice.mutateAsync(id);
        toast.success('Notice deleted');
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-up">
        <h2 className="section-title mb-4">🔔 Notice Board</h2>
        <CardListSkeleton count={4} lines={2} />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">🔔 Notice Board</h2>
        <div className="flex items-center gap-2">
          <NotificationToggle />
          {canEdit && (
            <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
          )}
        </div>
      </div>

      {canEdit && isEditMode && (
        <form onSubmit={handleSubmit} className="admin-form space-y-3">
          <Input 
            type="date" 
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <Input 
            placeholder="Title" 
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea 
            placeholder="Details" 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
          
          <SendNotificationCheckbox
            checked={sendPushNotification}
            onCheckedChange={setSendPushNotification}
            disabled={isSubmitting}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Notice'}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {notices.map((n) => (
          <Card 
            key={n.id} 
            className="card-accent-blue cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedNotice(n)}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-semibold">{n.title}</h4>
              <span className="text-xs text-muted-foreground">{n.date}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {n.description || 'No description'}
            </p>
            {canEdit && isEditMode && (
              <button 
                onClick={(e) => handleDelete(e, n.id)}
                className="text-destructive text-xs mt-2 hover:underline"
              >
                Delete
              </button>
            )}
          </Card>
        ))}
        
        {notices.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No notices posted yet</p>
        )}
      </div>

      {/* Notice Detail Modal */}
      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotice?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{selectedNotice?.date}</p>
          <div className="whitespace-pre-wrap text-foreground">
            {selectedNotice?.description || 'No details provided.'}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
