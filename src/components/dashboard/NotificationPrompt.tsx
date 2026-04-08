import { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationPrompt = () => {
  const { user } = useAuth();
  const { isSubscribed, isLoading, subscribe, unsubscribe, permission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not logged in, loading, already subscribed, or dismissed
  if (!user || isLoading || isSubscribed || dismissed || permission === 'denied') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 max-w-sm shadow-lg border-primary/20 bg-card animate-fade-up">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Enable Notifications</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Get instant updates for new notices, routines, and bus schedules
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={subscribe}>
              Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const NotificationToggle = () => {
  const { isSubscribed, isLoading, subscribe, unsubscribe, permission } = usePushNotifications();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Bell className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (permission === 'denied') {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        <BellOff className="w-4 h-4 mr-2" />
        Blocked
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      size="sm"
      onClick={isSubscribed ? unsubscribe : subscribe}
    >
      {isSubscribed ? (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Disable Notifications
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Enable Notifications
        </>
      )}
    </Button>
  );
};
