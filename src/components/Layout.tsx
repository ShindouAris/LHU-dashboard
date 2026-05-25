import React, { useEffect, useState } from 'react';
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

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loggedInUser = AuthStorage.isLoggedIn();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 mt-auto border-t border-border bg-background/80 backdrop-blur-sm hidden lg:block">
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
    <div className="relative h-dvh overflow-hidden bg-gradient-to-br from-[#eff1f5] via-[#e6e9ef] to-[#dce0e8] dark:from-[#1e1e2e] dark:via-[#181825] dark:to-[#11111b] flex flex-col">
      {/* <Snowfall /> */}
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden hidden md:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#89b4fa] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#cba6f7] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:opacity-20"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-[#f5c2e7] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:opacity-20"></div>
      </div>

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
          <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground truncate">
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
