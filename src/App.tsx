import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GuestProvider } from "@/contexts/GuestContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

// Dashboard Layout and Sections
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { HomeSection } from "@/components/dashboard/HomeSection";
import { AcademicSection } from "@/components/dashboard/AcademicSection";
import { StudentsSection } from "@/components/dashboard/StudentsSection";
import { FacultySection } from "@/components/dashboard/FacultySection";
import { NoticesSection } from "@/components/dashboard/NoticesSection";
import { AttendanceSection } from "@/components/dashboard/AttendanceSection";
import { PollsSection } from "@/components/dashboard/PollsSection";
import { GallerySection } from "@/components/dashboard/GallerySection";
import { BusSection } from "@/components/dashboard/BusSection";
import { AboutSection } from "@/components/dashboard/AboutSection";
import { AdminSection } from "@/components/dashboard/AdminSection";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import { ToolsSection } from "@/components/dashboard/ToolsSection";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" attribute="class" enableSystem={false}>
      <AuthProvider>
        <GuestProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Landing page / entry point */}
                <Route path="/" element={<Index />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Dashboard routes with shared layout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/home" element={<HomeSection />} />
                  <Route path="/academic" element={<AcademicSection />} />
                  <Route path="/students" element={<StudentsSection />} />
                  <Route path="/faculty" element={<FacultySection />} />
                  <Route path="/notices" element={<NoticesSection />} />
                  <Route path="/attendance" element={<AttendanceSection />} />
                  <Route path="/polls" element={<PollsSection />} />
                  <Route path="/gallery" element={<GallerySection />} />
                  <Route path="/bus" element={<BusSection />} />
                  <Route path="/about" element={<AboutSection />} />
                  <Route path="/admin" element={<AdminSection />} />
                  <Route path="/profile" element={<ProfileSection />} />
                  <Route path="/tools" element={<ToolsSection />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </GuestProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
