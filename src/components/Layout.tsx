import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AuthStorage } from '@/types/user';
import { NavigationInstruction } from '@/types/settings';
import GradientText from './ui/GradientText';
// import { Snowfall } from 'react-snowfall'; // Out of winter season

interface LayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  onRefresh?: () => void;
  showBack?: boolean;
  showRefresh?: boolean;
  page: string;
  onPageChange?: (page: NavigationInstruction) => void;
  title?: string;
  isDark?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onBack,
  onRefresh,
  showBack = false,
  showRefresh = false,
  page,
  onPageChange,
  title,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loggedInUser = AuthStorage.isLoggedIn()

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
    <footer className="relative z-10 mt-auto border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hidden lg:block">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} CalendarLHU. All rights reserved.
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
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            <a href="#bruh-i-dont-collect-any-thing-from-your-guys" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#uhh-idk-but-dont-abuse-the-api-is-ok" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Terms of Service
            </a>
            <a href="https://github.com/ShindouAris/LHU-dashboard/commit/d3160d71e3a259d15be7ef6e4b9a55bc4267b7d1" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">
              Phiên bản 3.6.0
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};


  return (
    <div className="relative h-dvh overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* <Snowfall /> */}
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden hidden md:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex w-full flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar
          onBack={onBack}
          onRefresh={onRefresh}
          showBack={showBack}
          showRefresh={showRefresh}
          page={page}
          onPageChange={onPageChange}
          title={title}
          isOpen={sidebarOpen}
          isAuth={loggedInUser}
          onToggle={toggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 w-full min-w-0 lg:ml-0 flex flex-col min-h-0">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Content */}
          <main className="relative w-full min-w-0 flex-1 min-h-0 overflow-y-auto">
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};
