import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AuthStorage } from '@/types/user';
import GradientText from './ui/GradientText';
import { HostnameBanner } from './LHU_UI/HostnameBanner';
// import { Snowfall } from 'react-snowfall'; // Out of winter season

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

// Maps the current route to a section key so [data-section] accent theming
// (defined in src/index.css) lights up the right signature color per page.
const sectionForPath = (path: string): string => {
  if (path.startsWith('/toollhu')) return 'toollhu';
  if (path.startsWith('/chisaAI')) return 'chisaAI';
  if (path.startsWith('/timetable')) return 'timetable';
  if (path.startsWith('/weather')) return 'weather';
  if (path.startsWith('/mark')) return 'mark';
  if (path.startsWith('/diemrenluyen')) return 'diemrenluyen';
  if (path.startsWith('/diemdanh')) return 'diemdanh';
  if (path.startsWith('/thuvien')) return 'thuvien';
  if (path.startsWith('/qrscan')) return 'qrscan';
  if (path.startsWith('/parking')) return 'parking';
  if (path.startsWith('/settings')) return 'settings';
  return 'schedule';
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loggedInUser = AuthStorage.isLoggedIn();
  const location = useLocation();
  const section = sectionForPath(location.pathname);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const closeMobileSidebarAtDesktopBreakpoint = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', closeMobileSidebarAtDesktopBreakpoint);
    return () => window.removeEventListener('resize', closeMobileSidebarAtDesktopBreakpoint);
  }, []);

  const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 mt-auto border-t-2 border-border bg-background hidden lg:block">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LHU dashboard. All rights reserved.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://buymeacoffee.com/chisadinchan")}>
            <GradientText
            animationSpeed={0.8}
            yoyo={false}
            colors={["#B8DB80", "#F7F6D3", "#F39EB6"]}
            >
              Ủng hộ phát triển
            </GradientText>
          </Button>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#bruh-i-dont-collect-any-thing-from-your-guys" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#uhh-idk-but-dont-abuse-the-api-is-ok" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="https://github.com/ShindouAris/LHU-dashboard/commit/d3160d71e3a259d15be7ef6e4b9a55bc4267b7d1" className="hover:text-primary hover:underline transition-colors">
              Phiên bản 3.6.0
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};


  return (
    <div
      data-section={section}
      className="relative h-dvh overflow-hidden bg-background flex flex-col"
    >
      <div className="relative z-10 flex w-full flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar
          title={title}
          isOpen={sidebarOpen}
          isAuth={loggedInUser}
          onToggle={toggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 w-full min-w-0 lg:ml-0 flex flex-col min-h-0">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 bg-section text-section-foreground border-b-2 border-border">
            <div className="flex items-center justify-between p-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
                aria-label="Mở menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="font-display text-lg font-bold text-section-foreground truncate">
                {title}
              </h1>
              <div className="w-10" />
            </div>
          </div>

          {/* Content */}
          <main className="relative w-full min-w-0 flex-1 min-h-0 overflow-y-auto">
            <div className="px-4 pt-4">
              <HostnameBanner />
            </div>
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};
