import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Chrome, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetEmail, setResetEmail] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        toast.error('Login failed. Please try again.');
      }
    } catch (err) {
      toast.error('Something went wrong.');
    }
    
    setIsLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email এবং Password দিন');
      return;
    }

    setIsLoading(true);
    
    try {
      // Set session persistence based on rememberMe
      if (!rememberMe) {
        // Store session only in sessionStorage (cleared on browser close)
        await supabase.auth.setSession({ access_token: '', refresh_token: '' });
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('ভুল email অথবা password');
        } else {
          toast.error(error.message);
        }
      } else {
        // If not remembering, move session to sessionStorage
        if (!rememberMe) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            sessionStorage.setItem('sb-session', JSON.stringify(session));
            localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`);
          }
        }
        toast.success('Login সফল হয়েছে!');
        onOpenChange(false);
      }
    } catch (err) {
      toast.error('Something went wrong.');
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error('Email দিন');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset link পাঠানো হয়েছে! Email চেক করুন।');
        setView('login');
        setResetEmail('');
      }
    } catch (err) {
      toast.error('Something went wrong.');
    }
    
    setIsLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setView('login');
      setResetEmail('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-extrabold">UU EEE Portal</span>
          </DialogTitle>
        </DialogHeader>

        {view === 'login' ? (
          <div className="space-y-4 mt-4">
            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label 
                    htmlFor="remember" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    মনে রাখুন
                  </Label>
                </div>
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 text-sm h-auto"
                  onClick={() => setView('forgot')}
                >
                  Password ভুলে গেছেন?
                </Button>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Login with Email
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">অথবা</span>
              </div>
            </div>

            {/* Google Login */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            {/* Warning message */}
            <p className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-md">
              Login is only available for invited users with Uttara University edu email (format: 22****@uttara.ac.bd). Please contact{' '}
              <a 
                href="https://www.facebook.com/ieee.ibrahim/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Md Ibrahim Hossain
              </a>
              {' '}for access.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <Button 
              type="button" 
              variant="ghost" 
              className="px-0 h-auto mb-2"
              onClick={() => setView('login')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Login এ ফিরে যান
            </Button>

            <p className="text-sm text-muted-foreground">
              আপনার email দিন। আমরা password reset link পাঠাবো।
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="your-email@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Reset Link পাঠান
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
