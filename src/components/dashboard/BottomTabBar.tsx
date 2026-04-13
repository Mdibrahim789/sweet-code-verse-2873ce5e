import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Bell, Bus, MoreHorizontal, Users, GraduationCap, ClipboardCheck, BarChart3, Image, Info, Shield, User, LogOut, LogIn } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const TABS = [
  { label: 'Academic', icon: BookOpen, path: '/academic' },
  { label: 'Students', icon: Users, path: '/students' },
  { label: 'Home', icon: Home, path: '/home', isCenter: true },
  { label: 'Notices', icon: Bell, path: '/notices' },
];

const MORE_ITEMS = [
  { label: 'Bus', icon: Bus, path: '/bus' },
  { label: 'Faculty', icon: GraduationCap, path: '/faculty' },
  { label: 'Attendance', icon: ClipboardCheck, path: '/attendance' },
  { label: 'Polls', icon: BarChart3, path: '/polls' },
  { label: 'Gallery', icon: Image, path: '/gallery' },
  { label: 'About', icon: Info, path: '/about' },
  { label: 'Admin', icon: Shield, path: '/admin' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isGuestMode, exitGuestMode } = useGuest();

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = MORE_ITEMS.some(item => isActive(item.path));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-sidebar-background/95 backdrop-blur-lg border-t border-sidebar-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {TABS.map(({ label, icon: Icon, path, isCenter }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200 ${
                isCenter
                  ? `relative -mt-5 ${isActive(path) ? 'text-primary' : 'text-sidebar-muted'}`
                  : isActive(path)
                    ? 'text-primary'
                    : 'text-sidebar-muted'
              }`}
            >
              {isCenter ? (
                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 border-sidebar-background ${
                  isActive(path) ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent text-sidebar-muted'
                } shadow-lg`}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
              ) : (
                <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 2} />
              )}
              <span className={`text-[10px] font-medium ${isCenter ? 'mt-0.5' : ''}`}>{label}</span>
            </button>
          ))}
          <button
            onClick={() => setSheetOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200 ${
              isMoreActive ? 'text-primary' : 'text-sidebar-muted'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-sidebar-background border-sidebar-border rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-sidebar-foreground">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-3 py-4">
            {MORE_ITEMS.map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setSheetOpen(false); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                  isActive(path)
                    ? 'bg-primary/15 text-primary'
                    : 'text-sidebar-muted hover:bg-sidebar-accent'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
