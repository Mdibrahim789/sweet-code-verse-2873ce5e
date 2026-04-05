import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { LandingPage } from './LandingPage';
import { AuthModal } from '@/components/dashboard/AuthModal';
import { useState } from 'react';

const Index = () => {
  const { loading, user } = useAuth();
  const { isGuestMode, enterGuestMode } = useGuest();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Redirect based on auth status
  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard/home', { replace: true });
      } else if (isGuestMode) {
        navigate('/bus', { replace: true });
      }
    }
  }, [loading, user, isGuestMode, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  // Show landing page for unauthenticated visitors
  if (!user && !isGuestMode) {
    return (
      <div className="min-h-screen bg-background">
        <LandingPage 
          onLoginClick={() => setShowAuthModal(true)} 
          onGuestViewClick={enterGuestMode}
        />
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    );
  }

  // This shouldn't render as we redirect above, but just in case
  return null;
};

export default Index;
