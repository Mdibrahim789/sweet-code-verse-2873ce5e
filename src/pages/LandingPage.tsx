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