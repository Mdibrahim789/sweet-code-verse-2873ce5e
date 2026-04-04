import { Zap, Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-sidebar text-sidebar-foreground px-4 py-4 flex items-center gap-4">
      <button onClick={onMenuClick}>
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-2 font-bold">
        <Zap className="w-5 h-5 text-primary" />
        <span>UU EEE</span>
      </div>
    </header>
  );
};
