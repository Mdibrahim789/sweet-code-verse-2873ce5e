import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { AuthModal } from './AuthModal';
import { GuestRestrictedContent } from './GuestRestrictedContent';

// Public paths accessible without login
const PUBLIC_PATHS = ['/dashboard/bus', '/dashboard/about'];

// Map routes to section titles
const SECTION_TITLES: Record<string, string> = {
  '/dashboard/home': 'Dashboard',
  '/dashboard/academic': 'Academic',
  '/dashboard/students': 'Students',
  '/dashboard/faculty': 'Faculty',
  '/dashboard/notices': 'Notices',
  '/dashboard/attendance': 'Attendance',
  '/dashboard/polls': 'Polls',
  '/dashboard/gallery': 'Gallery',
  '/dashboard/bus': 'Bus Schedule',
  '/dashboard/about': 'Why I Built This Website',
  '/dashboard/admin': 'Admin Panel',
  '/dashboard/profile': 'My Profile'
};

export const DashboardLayout = () => {
  const { user } = useAuth();
  const { isGuestMode, enterGuestMode, exitGuestMode } = useGuest();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-enable guest mode for direct link access to public pages
  useEffect(() => {
    if (!user && !isGuestMode && PUBLIC_PATHS.includes(location.pathname)) {
      enterGuestMode();
    }
  }, [user, isGuestMode, location.pathname, enterGuestMode]);

  // Close auth modal handler
  const handleAuthModalChange = (open: boolean) => {
    setShowAuthModal(open);
  };

  // Check if current path is restricted for guests
  const isGuestRestricted = isGuestMode && !user && !PUBLIC_PATHS.includes(location.pathname);
  const currentTitle = SECTION_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLoginClick={() => setShowAuthModal(true)}
        isGuestMode={isGuestMode && !user}
        onExitGuestMode={exitGuestMode}
      />

      <main className="flex-1 min-h-screen overflow-y-auto">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24">
          {isGuestRestricted ? (
            <GuestRestrictedContent 
              title={currentTitle} 
              onLoginClick={() => setShowAuthModal(true)} 
            />
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      {/* Auth Modal - Always mounted at root level */}
      <AuthModal open={showAuthModal} onOpenChange={handleAuthModalChange} />
    </div>
  );
};
