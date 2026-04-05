import { Zap } from 'lucide-react';

export const MobileHeader = () => {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-sidebar text-sidebar-foreground px-4 py-4 flex items-center gap-2">
      <Zap className="w-5 h-5 text-primary" />
      <span className="font-bold">UU EEE</span>
    </header>
  );
};
