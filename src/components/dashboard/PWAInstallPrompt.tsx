import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

export const PWAInstallPrompt = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored) {
      const dismissedAt = Number(stored);
      const daysPassed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      setDismissed(daysPassed < DISMISS_DAYS);
    } else {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    await promptInstall();
    setDismissed(true);
  };

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-md mx-auto">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div className="bg-primary/10 rounded-full p-2.5 shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">অ্যাপ ইনস্টল করুন</p>
          <p className="text-xs text-muted-foreground">হোম স্ক্রিনে যোগ করে দ্রুত অ্যাক্সেস পান</p>
        </div>
        <Button size="sm" onClick={handleInstall} className="shrink-0">
          ইনস্টল
        </Button>
        <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
