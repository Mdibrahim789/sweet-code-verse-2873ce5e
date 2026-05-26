import { Zap, Download, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { TermBadge } from './TermBadge';

export const MobileHeader = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Zap className="w-5 h-5 text-primary shrink-0" />
        <span className="font-bold">EEE 49D</span>
        <TermBadge compact className="ml-1" />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isInstallable && (
          <Button size="sm" variant="outline" onClick={promptInstall} className="gap-1.5 text-xs">
            <Download className="w-4 h-4" />
            Install
          </Button>
        )}
        {user ? (
          <button onClick={() => navigate('/profile')} className="ml-1">
            <Avatar className="w-8 h-8 border-2 border-primary/50">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <button onClick={() => navigate('/profile')} className="ml-1">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        )}
      </div>
    </header>
  );
};
