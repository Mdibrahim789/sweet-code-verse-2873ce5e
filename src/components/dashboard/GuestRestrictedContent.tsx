import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGuest } from '@/contexts/GuestContext';

interface GuestRestrictedContentProps {
  title: string;
  onLoginClick: () => void;
}

export const GuestRestrictedContent = ({ title, onLoginClick }: GuestRestrictedContentProps) => {
  const { exitGuestMode } = useGuest();

  const handleLogin = () => {
    exitGuestMode();
    onLoginClick();
  };

  return (
    <div className="animate-fade-up flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>
      <div className="text-center mb-6">
        <p className="text-4xl font-mono text-muted-foreground tracking-widest mb-2">
          ******
        </p>
        <p className="text-muted-foreground">
          এই section দেখতে login করুন
        </p>
      </div>
      <Button onClick={handleLogin} size="lg" className="font-bold">
        Login to View
      </Button>
    </div>
  );
};
