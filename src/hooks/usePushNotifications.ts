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

type PushState = {
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
};

const ONESIGNAL_SDK_SRC = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const PUSH_STATE_EVENT = 'onesignal-push-state-change';

let sdkLoadPromise: Promise<void> | null = null;
let sdkInitPromise: Promise<void> | null = null;
let listenersAttached = false;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBrowserPermission = (): NotificationPermission => {
  if (typeof Notification === 'undefined') return 'default';
  return Notification.permission;
};

const emitPushState = (state: Partial<PushState>) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PUSH_STATE_EVENT, { detail: state }));
};

const resolveOneSignalValue = async <T,>(value: T | Promise<T>): Promise<T> => {
  return Promise.resolve(value);
};

const persistSubscription = async (userId: string, playerId: string, isActive: boolean) => {
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      player_id: playerId,
      is_active: isActive,
    },
    { onConflict: 'user_id,player_id' }
  );

  if (error) {
    console.error('Failed to persist push subscription:', error);
  }
};

const markSubscriptionsInactive = async (userId: string) => {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to disable push subscriptions:', error);
  }
};

const syncPushState = async (userId?: string | null): Promise<PushState> => {
  const browserPermission = getBrowserPermission();

  if (typeof window === 'undefined' || !window.OneSignal) {
    const fallbackState = {
      isSubscribed: false,
      isLoading: false,
      permission: browserPermission,
    };
    emitPushState(fallbackState);
    return fallbackState;
  }

  try {
    const permissionGranted = Boolean(window.OneSignal.Notifications?.permission);
    const permission: NotificationPermission = permissionGranted
      ? 'granted'
      : browserPermission === 'denied'
        ? 'denied'
        : 'default';

    const subscription = window.OneSignal.User?.PushSubscription;
    const [subscriptionStatus, playerId] = await Promise.all([
      resolveOneSignalValue(subscription?.optedIn ?? false),
      resolveOneSignalValue(subscription?.id ?? null),
    ]);

    const nextState = {
      isSubscribed: Boolean(subscriptionStatus),
      isLoading: false,
      permission,
    };

    if (userId && playerId) {
      void persistSubscription(userId, playerId, nextState.isSubscribed);
    }

    emitPushState(nextState);
    return nextState;
  } catch (error) {
    console.error('Error checking subscription:', error);

    const fallbackState = {
      isSubscribed: false,
      isLoading: false,
      permission: browserPermission,
    };

    emitPushState(fallbackState);
    return fallbackState;
  }
};

const loadOneSignalSdk = async () => {
  if (typeof window === 'undefined') return;
  if (window.OneSignal) return;

  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-onesignal-sdk="true"]');

      if (existingScript) {
        if (window.OneSignal) {
          resolve();
          return;
        }

        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load OneSignal SDK')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = ONESIGNAL_SDK_SRC;
      script.defer = true;
      script.dataset.onesignalSdk = 'true';
      script.onload = () => resolve();
      script.onerror = () => {
        sdkLoadPromise = null;
        reject(new Error('Failed to load OneSignal SDK'));
      };

      document.head.appendChild(script);
    });
  }

  await sdkLoadPromise;
};

const ensureOneSignalInitialized = async () => {
  if (typeof window === 'undefined') return null;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!appId) {
    throw new Error('OneSignal App ID is missing');
  }

  await loadOneSignalSdk();

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  if (!sdkInitPromise) {
    sdkInitPromise = new Promise<void>((resolve, reject) => {
      window.OneSignalDeferred?.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
            autoResubscribe: true,
            notifyButton: {
              enable: false,
            },
            promptOptions: {
              slidedown: {
                prompts: [
                  {
                    type: 'push',
                    autoPrompt: false,
                  },
                ],
              },
            },
            welcomeNotification: {
              disable: true,
            },
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            serviceWorkerParam: {
              scope: '/',
            },
          });

          if (!listenersAttached) {
            OneSignal.Notifications.addEventListener('permissionChange', () => {
              void syncPushState();
            });

            OneSignal.User.PushSubscription.addEventListener('change', () => {
              void syncPushState();
            });

            listenersAttached = true;
          }

          resolve();
        } catch (error) {
          sdkInitPromise = null;
          reject(error);
        }
      });
    });
  }

  await sdkInitPromise;
  return window.OneSignal;
};

export const usePushNotifications = () => {
  const { user, isMaster } = useAuth();
  const [state, setState] = useState<PushState>({
    isSubscribed: false,
    isLoading: true,
    permission: getBrowserPermission(),
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const updateState = (nextState: Partial<PushState>) => {
      if (!isMounted) return;
      setState((currentState) => ({ ...currentState, ...nextState }));
    };

    const handlePushStateChange = (event: Event) => {
      updateState((event as CustomEvent<Partial<PushState>>).detail ?? {});
    };

    const refreshState = async () => {
      const nextState = await syncPushState(user?.id);
      updateState(nextState);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshState();
      }
    };

    window.addEventListener(PUSH_STATE_EVENT, handlePushStateChange as EventListener);
    window.addEventListener('focus', refreshState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    updateState({ isLoading: true, permission: getBrowserPermission() });

    ensureOneSignalInitialized()
      .then(() => {
        void refreshState();
      })
      .catch((error) => {
        console.error('OneSignal init error:', error);
        updateState({ isLoading: false, permission: getBrowserPermission() });
      });

    return () => {
      isMounted = false;
      window.removeEventListener(PUSH_STATE_EVENT, handlePushStateChange as EventListener);
      window.removeEventListener('focus', refreshState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  const subscribe = useCallback(async () => {
    try {
      emitPushState({ isLoading: true, permission: getBrowserPermission() });

      const OneSignal = await ensureOneSignalInitialized();
      if (!OneSignal) {
        toast.error('Push notification service not available');
        emitPushState({ isLoading: false, permission: getBrowserPermission() });
        return false;
      }

      const isPushSupported = await resolveOneSignalValue(OneSignal.Notifications.isPushSupported());
      if (!isPushSupported) {
        toast.error('Push notifications are not supported on this browser');
        emitPushState({ isLoading: false, permission: getBrowserPermission() });
        return false;
      }

      if (user) {
        try {
          await OneSignal.login(user.id);
        } catch (error) {
          console.warn('OneSignal login failed:', error);
        }
      }

      if (getBrowserPermission() === 'denied') {
        const blockedState = await syncPushState(user?.id);
        toast.error('Notifications are blocked in your browser settings');
        return blockedState.isSubscribed;
      }

      if (!Boolean(OneSignal.Notifications.permission)) {
        await OneSignal.Notifications.requestPermission();
      }

      await OneSignal.User.PushSubscription.optIn();

      let nextState = await syncPushState(user?.id);

      for (let attempt = 0; attempt < 5 && !nextState.isSubscribed && nextState.permission !== 'denied'; attempt += 1) {
        await wait(400);
        nextState = await syncPushState(user?.id);
      }

      if (nextState.isSubscribed) {
        toast.success('Notifications enabled!');
        return true;
      }

      if (nextState.permission === 'granted') {
        toast.success('Notifications permission enabled');
        return true;
      }

      toast.error('Failed to enable notifications');
      return false;
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to enable notifications');
      emitPushState({ isLoading: false, permission: getBrowserPermission() });
      return false;
    }
  }, [user?.id]);

  const unsubscribe = useCallback(async () => {
    try {
      const OneSignal = await ensureOneSignalInitialized();
      if (!OneSignal) return false;

      await OneSignal.User.PushSubscription.optOut();

      if (user) {
        await markSubscriptionsInactive(user.id);
      }

      await syncPushState(user?.id);
      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to disable notifications');
      return false;
    }
  }, [user?.id]);

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
        body: params,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Notification sent! (${response.data.recipients || 0} recipients)`);
      return true;
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
      return false;
    }
  }, [isMaster]);

  return {
    isSubscribed: state.isSubscribed,
    isLoading: state.isLoading,
    permission: state.permission,
    subscribe,
    unsubscribe,
    sendNotification,
  };
};
