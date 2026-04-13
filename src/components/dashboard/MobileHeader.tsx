import { Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ThemeToggle } from '@/components/ThemeToggle';

export const MobileHeader = () => {
  const { isInstallable, promptInstall } = usePWAInstall();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-sidebar text-sidebar-foreground px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <span className="font-bold">UU EEE</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isInstallable && (
          <Button size="sm" variant="outline" onClick={promptInstall} className="gap-1.5 text-xs">
            <Download className="w-4 h-4" />
            Install
          </Button>
        )}
      </div>
    </header>
  );
};
