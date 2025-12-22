import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  RefreshCw, 
  GraduationCap, 
  Home, 
  Calendar, 
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  onRefresh?: () => void;
  showBack?: boolean;
  showRefresh?: boolean;
  page: string;
  onPageChange?: (page: "home" | "schedule" | "timetable" | "weather" | "mark") => void;
  title?: string;
  showThemeToggle?: boolean;
  onThemeToggle?: () => void;
  isDark?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  onRefresh,
  showBack = false,
  showRefresh = false,
  title = "LHU Dashboard",
  showThemeToggle = false,
  page = "home",
  onPageChange,
  onThemeToggle,
  isDark = false
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {showBack && onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Quay lại</span>
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {showRefresh && onRefresh && (
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Làm mới</span>
              </Button>
            )}

            {showThemeToggle && onThemeToggle && (
              <Button
                onClick={onThemeToggle}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </Button>
            )}

            {/* Status Badge - Hidden on mobile */}
            <Badge variant="outline" className="hidden lg:flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Đang học</span>
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        {onPageChange && (
          <div className="flex items-center gap-1 pb-3">
            <Button
              variant={page === "home" ? "default" : "ghost"}
              size="sm"
              className="flex items-center gap-2 text-sm"
              onClick={() => onPageChange("home")}
              disabled={page === "home"}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Button>
            
            <Button
              variant={page === "schedule" ? "default" : "ghost"}
              size="sm"
              className="flex items-center gap-2 text-sm"
              onClick={() => onPageChange("schedule")}
              disabled={page === "schedule"}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Lịch học</span>
            </Button>
            
            <Button
              variant={page === "timetable" ? "default" : "ghost"}
              size="sm"
              className="hidden sm:flex items-center gap-2 text-sm"
              onClick={() => onPageChange("timetable")}
              disabled={page === "timetable"}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Thời khóa biểu</span>
            </Button>

            <Button
              variant={page === "weather" ? "default" : "ghost"}
              size="sm"
              className="flex items-center gap-2 text-sm"
              onClick={() => onPageChange("weather")}
              disabled={page === "weather"}
            >
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Thời tiết</span>
            </Button>

          </div>
        )}
      </div>
    </header>
  );
};