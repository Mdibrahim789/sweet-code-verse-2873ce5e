import { Zap, Users, BookOpen, Bell, ArrowRight, Eye, Download, MapPin, FileText, CalendarDays, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface LandingPageProps {
  onLoginClick: () => void;
  onGuestViewClick: () => void;
}

export const LandingPage = ({
  onLoginClick,
  onGuestViewClick
}: LandingPageProps) => {
  const { isInstallable, promptInstall } = usePWAInstall();

  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-extrabold">UU EEE</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isInstallable && (
              <Button onClick={promptInstall} variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" />
                Install
              </Button>
            )}
            <Button onClick={onLoginClick} size="lg" className="font-bold">
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">49 Eve-D Batch EEE Portal</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Uttara University এর EEE Dept. 49 Batch-এর সকল তথ্য, নোটিশ, রুটিন এবং আরও অনেক কিছু এক জায়গায়।</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onLoginClick} size="lg" className="font-bold text-lg px-8 py-6">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={onGuestViewClick} variant="outline" size="lg" className="font-bold text-lg px-8 py-6">
              <Eye className="mr-2 w-5 h-5" /> Guest View
            </Button>
          </div>
        </div>
      </section>

      {/* Mockup Section */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            {/* Phone Frame Mockup */}
            <div className="animate-fade-up">
              <div className="relative w-[280px] sm:w-[320px] rounded-[2.5rem] border-[6px] border-foreground/10 bg-foreground/5 p-3 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/10 rounded-b-2xl z-10" />
                {/* Screen */}
                <div className="bg-background rounded-[2rem] overflow-hidden h-[520px] flex flex-col relative">
                  {/* App Header */}
                  <div className="bg-sidebar-background px-4 pt-8 pb-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-sm font-bold text-sidebar-foreground">UU EEE</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-hidden p-3 space-y-3">
                    {/* Notice Card */}
                    <div className="bg-card border border-border rounded-xl p-3 space-y-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Latest Notice</span>
                      </div>
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-4/5" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>

                    {/* Routine Card */}
                    <div className="bg-card border border-border rounded-xl p-3 space-y-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                          <CalendarDays className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Today&apos;s Routine</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                          <div className="h-2.5 bg-muted rounded w-16" />
                          <div className="h-2.5 bg-muted rounded w-12" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                          <div className="h-2.5 bg-muted rounded w-20" />
                          <div className="h-2.5 bg-muted rounded w-10" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                          <div className="h-2.5 bg-muted rounded w-14" />
                          <div className="h-2.5 bg-muted rounded w-14" />
                        </div>
                      </div>
                    </div>

                    {/* Bus Schedule Card */}
                    <div className="bg-card border border-border rounded-xl p-3 space-y-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                          <Bus className="w-3.5 h-3.5 text-success" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Bus Schedule</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <div className="h-2.5 bg-muted rounded w-24" />
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <div className="h-2.5 bg-muted rounded w-20" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Tab Bar */}
                  <div className="shrink-0 bg-sidebar-background px-4 py-2 flex items-center justify-between">
                    <div className="w-6 h-6 rounded bg-sidebar-accent" />
                    <div className="w-6 h-6 rounded bg-sidebar-accent" />
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-4 h-4 bg-primary-foreground rounded-sm" />
                    </div>
                    <div className="w-6 h-6 rounded bg-sidebar-accent" />
                    <div className="w-6 h-6 rounded bg-sidebar-accent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Text beside mockup on desktop */}
            <div className="text-center md:text-left max-w-sm">
              <h2 className="text-3xl font-extrabold mb-4">Everything in Your Pocket</h2>
              <p className="text-muted-foreground mb-6">Access notices, class routines, bus schedules, and more from a clean, fast mobile dashboard designed for your batch.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button onClick={onLoginClick} size="lg" className="font-bold">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={onGuestViewClick} variant="outline" size="lg" className="font-bold">
                  <Eye className="mr-2 w-5 h-5" /> Guest View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={<Users className="w-10 h-10 text-primary" />} title="Student Directory" description="সকল সহপাঠীদের তথ্য এক জায়গায় পাবেন" />
            <FeatureCard icon={<BookOpen className="w-10 h-10 text-primary" />} title="Academic Resources" description="রুটিন, সিলেবাস এবং স্টাডি ম্যাটেরিয়াল" />
            <FeatureCard icon={<Bell className="w-10 h-10 text-primary" />} title="Notices & Updates" description="গুরুত্বপূর্ণ নোটিশ ও আপডেট সাথে সাথে" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} UU EEE. Made with ❤️ by{' '}
            <a 
              href="https://www.facebook.com/ieee.ibrahim/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Md Ibrahim Hossain
            </a>
          </p>
        </div>
      </footer>
    </div>;
};
const FeatureCard = ({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => <div className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>;