import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AuthStorage } from '@/types/user';
import { NavigationInstruction } from '@/types/settings';

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden hidden md:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex w-full">
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
        <div className="flex-1 w-full min-w-0 lg:ml-0">
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
          <main className="relative w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
