import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

export const usePushNotifications = () => {
  const { user, isMaster } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Initialize OneSignal
  useEffect(() => {
    const initOneSignal = async () => {
      if (typeof window === 'undefined') return;

      const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
      console.log('OneSignal App ID:', appId);
      
      if (!appId) {
        console.error('OneSignal App ID is missing!');
        setIsLoading(false);
        return;
      }

      // Check if OneSignal is already loaded
      if (window.OneSignal) {
        console.log('OneSignal already loaded, checking status...');
        checkSubscriptionStatus();
        return;
      }

      // Load OneSignal SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      
      script.onload = () => {
        console.log('OneSignal SDK script loaded');
      };
      
      script.onerror = (error) => {
        console.error('Failed to load OneSignal SDK:', error);
        setIsLoading(false);
      };
      
      document.head.appendChild(script);

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          console.log('Initializing OneSignal with appId:', appId);
          
          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            autoResubscribe: true,
            notifyButton: {
              enable: false // Disable the bell icon, we'll use slidedown only
            }
          });

          console.log('OneSignal initialized successfully');
          
          // Check permission and show slidedown if needed
          const permission = await OneSignal.Notifications.permission;
          const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
          
          console.log('OneSignal permission:', permission, 'isPushEnabled:', isPushEnabled);
          
          // If not subscribed, show the slidedown prompt after a delay
          if (!isPushEnabled && permission !== false) {
            console.log('Showing OneSignal slidedown prompt...');
            setTimeout(async () => {
              try {
                await OneSignal.Slidedown.promptPush();
                console.log('Slidedown prompt shown');
              } catch (err) {
                console.log('Slidedown prompt error (may already be shown):', err);
              }
            }, 2000);
          }

          checkSubscriptionStatus();
        } catch (error) {
          console.error('OneSignal init error:', error);
          setIsLoading(false);
        }
      });
    };

    initOneSignal();
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!window.OneSignal) {
      setIsLoading(false);
      return;
    }

    try {
      const permission = await window.OneSignal.Notifications.permission;
      setPermission(permission ? 'granted' : 'default');
      
      const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn;
      setIsSubscribed(isPushEnabled);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!window.OneSignal) {
      toast.error('Push notification service not available');
      return false;
    }

    try {
      // Request permission
      await window.OneSignal.Slidedown.promptPush();
      
      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn;
      setIsSubscribed(isPushEnabled);

      if (isPushEnabled && user) {
        // Get player ID and save to database
        const playerId = await window.OneSignal.User.PushSubscription.id;
        if (playerId) {
          await supabase.from('push_subscriptions').upsert({
            user_id: user.id,
            player_id: playerId,
            is_active: true
          }, { onConflict: 'user_id,player_id' });
        }
        toast.success('নোটিফিকেশন সাবস্ক্রাইব করা হয়েছে!');
      }

      return isPushEnabled;
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('নোটিফিকেশন সাবস্ক্রাইব করতে সমস্যা হয়েছে');
      return false;
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!window.OneSignal) return false;

    try {
      await window.OneSignal.User.PushSubscription.optOut();
      setIsSubscribed(false);

      if (user) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }

      toast.success('নোটিফিকেশন বন্ধ করা হয়েছে');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('নোটিফিকেশন বন্ধ করতে সমস্যা হয়েছে');
      return false;
    }
  }, [user]);

  const sendNotification = useCallback(async (params: {
    title: string;
    message: string;
    url?: string;
    data?: Record<string, any>;
  }) => {
    if (!isMaster()) {
      toast.error('Only Master Admin can send notifications');
      return false;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Please login to send notifications');
        return false;
      }

      const response = await supabase.functions.invoke('send-push-notification', {
        body: params
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`নোটিফিকেশন পাঠানো হয়েছে! (${response.data.recipients || 0} জন)`);
      return true;
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে');
      return false;
    }
  }, [isMaster]);

  return {
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendNotification
  };
};
