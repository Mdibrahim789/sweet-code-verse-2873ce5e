import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, Home, BookOpen, Users, GraduationCap, Bell, ClipboardCheck, Vote, X, Crown, Image, Bus, LogIn, Lock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationToggle } from './NotificationPrompt';

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

// Public paths accessible without login
const GUEST_ALLOWED_PATHS = ['/bus', '/about'];

const navItems: NavItem[] = [
  { path: '/home', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { path: '/academic', label: 'Academic', icon: <BookOpen className="w-5 h-5" /> },
  { path: '/students', label: 'Students', icon: <Users className="w-5 h-5" /> },
  { path: '/faculty', label: 'Faculty', icon: <GraduationCap className="w-5 h-5" /> },
  { path: '/notices', label: 'Notices', icon: <Bell className="w-5 h-5" /> },
  { path: '/attendance', label: 'Attendance', icon: <ClipboardCheck className="w-5 h-5" /> },
  { path: '/polls', label: 'Polls', icon: <Vote className="w-5 h-5" /> },
  { path: '/gallery', label: 'Gallery', icon: <Image className="w-5 h-5" /> },
  { path: '/bus', label: 'Bus Schedule', icon: <Bus className="w-5 h-5" /> },
  { path: '/about', label: 'Why I Built This', icon: <Heart className="w-5 h-5" /> },
  { path: '/admin', label: 'Admin Panel', icon: <Crown className="w-5 h-5" />, adminOnly: true },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  isGuestMode?: boolean;
  onExitGuestMode?: () => void;
}

export const Sidebar = ({ isOpen, onClose, onLoginClick, isGuestMode, onExitGuestMode }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isMaster, isCR, isTeacher, signOut } = useAuth();

  const getRoleLabel = () => {
    if (isMaster()) return 'Master Admin';
    if (isCR()) return 'Class Representative';
    if (isTeacher()) return 'Teacher';
    if (user) return 'Student';
    return 'Guest';
  };

  const getRoleClass = () => {
    if (isMaster()) return 'active-mode';
    if (isCR()) return 'cr-mode';
    if (isTeacher()) return 'stu-mode';
    if (user) return 'stu-mode';
    return '';
  };

  const handleProfileClick = () => {
    navigate('/profile');
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-sidebar flex flex-col p-5 transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close button for mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-sidebar-foreground"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Brand */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/home" className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-extrabold text-sidebar-foreground">UU EEE</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          <ul className="space-y-2">
            {navItems
              .filter(item => !item.adminOnly || isMaster())
              .map((item) => {
                const isRestricted = isGuestMode && !GUEST_ALLOWED_PATHS.includes(item.path);
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "nav-item w-full flex items-center gap-3",
                        isActive && "active",
                        item.adminOnly && "text-primary",
                        isRestricted && "opacity-60"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {isRestricted && <Lock className="w-3 h-3 ml-auto text-muted-foreground" />}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-5 border-t border-sidebar-border">
          {user ? (
            <div className="space-y-3">
              <button
                onClick={handleProfileClick}
                className={cn("admin-box w-full cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-3 py-3", getRoleClass())}
              >
                <Avatar className="w-10 h-10 border-2 border-primary/50">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile?.name || 'User'}</p>
                  <p className="text-xs opacity-70">{getRoleLabel()}</p>
                </div>
              </button>
              
              {/* Notification Toggle */}
              <NotificationToggle />
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary font-semibold"
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : isGuestMode ? (
            <div className="space-y-3">
              <div className="admin-box bg-muted/50 border-dashed">
                <p className="font-semibold">Guest Mode</p>
                <p className="text-xs opacity-70">Limited access</p>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  onExitGuestMode?.();
                  onLoginClick();
                }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login for Full Access
              </Button>
            </div>
          ) : null}

          <div className="flex items-center gap-2 mt-4 text-xs text-sidebar-muted font-semibold uppercase">
            <div className={cn(
              "w-2 h-2 rounded-full",
              user ? "bg-success" : isGuestMode ? "bg-warning" : "bg-destructive"
            )} />
            <span>{user ? 'Online' : isGuestMode ? 'Guest' : 'Offline'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
