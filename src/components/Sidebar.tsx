import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Home, 
  Calendar, 
  Sun,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  QrCode,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PiExamDuotone } from "react-icons/pi";
import { toast } from 'react-hot-toast';
import { FaParking, FaToolbox } from 'react-icons/fa';
import { getSettings } from '@/types/settings';
import { MdOutlineBadge, MdOutlineLocalLibrary } from 'react-icons/md';
import { Badge } from './ui/badge';
import { ChisaAI } from './ui/ChisaAI';
import GradientText from './ui/GradientText';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  title?: string;
  isOpen?: boolean;
  isAuth?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  title = "LHU Dashboard",
  isOpen = false,
  isAuth = false,
  onToggle
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['navigation']);

  const toggleExpanded = (item: string) => {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  interface NavigationItem {
    id: string;
    label: string;
    icon: React.ElementType;
    description: string;
    path?: string;
    url?: string;
    authrequired?: boolean;
    hidden?: boolean;
    forceshow?: boolean;
    isBetaItem?: boolean;
  }

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      description: 'Trang chính của ứng dụng',
      forceshow: true,
      path: '/'
    },
    {
      id: 'schedule',
      label: 'Lịch học',
      icon: Calendar,
      description: 'Xem lịch học chi tiết',
      path: '/schedule'
    },
    {
      id: 'timetable',
      label: 'Thời khóa biểu',
      icon: Calendar,
      description: 'Xem thời khóa biểu dạng lịch',
      forceshow: true,
      path: '/timetable'
    },
    {
      id: 'weather',
      label: 'Thời tiết',
      icon: Sun,
      description: 'Thông tin thời tiết hiện tại',
      path: '/weather'
    },
    {
      id: "diemdanh",
      label: "Điểm danh",
      icon: PiExamDuotone,
      description: "Xem thông tin điểm danh (cần đăng nhập)",
      authrequired: true,
      forceshow: true,
      path: '/diemdanh'
    },
    {
      id: "mark",
      label: "Xem điểm thi", 
      icon: PiExamDuotone,
      description: "Xem điểm thi của bạn (cần đăng nhập)",
      authrequired: true,
      path: '/mark'
    },
    {
      id: "qrscan",
      label: "Quét QR",
      icon: QrCode,
      description: "Quét QR điểm danh cho lớp của bạn (cần đăng nhập)",
      authrequired: false,
      forceshow: true,
      path: '/qrscan'
    },
    {
      id: "parkinglhu",
      label: "Quản lý đỗ xe LHU",
      icon: FaParking,
      description: "Quản lý xe của tôi",
      authrequired: true,
      path: '/parking'
    },
    {
      id: "diemrenluyen",
      label: "Điểm rèn luyện",
      icon: MdOutlineBadge,
      description: "Xem điểm rèn luyện của bạn (cần đăng nhập)",
      authrequired: true,
      path: '/diemrenluyen'
    },
    {
      id: "thuvien",
      label: "Quản lý thư viện",
      icon: MdOutlineLocalLibrary ,
      description: "Quản lý thư viện LHU",
      authrequired: true,
      isBetaItem: true,
      path: '/thuvien'
    },
    {
      id: "toollhu",
      label: "Công cụ LHU",
      icon: FaToolbox,
      description: "Các công cụ hỗ trợ LHU",
      authrequired: true,
      path: '/toollhu'
    },
    {
      id: "chisaAI",
      label: "Chisa AI",
      icon: ChisaAI,
      description: "Trợ lý AI của LHU-dashboard",
      authrequired: true,
      isBetaItem: true,
      path: '/chisaAI'
    },
    {
      id: "settings",
      label: "Cài đặt",
      icon: Settings,
      description: "Cài đặt và tùy chọn ứng dụng",
      forceshow: true,
      path: '/settings'
    },
  ];

  const settings = getSettings();

  const sidebarItems = navigationItems.filter(item => {
    if (item.forceshow) return true;
    if (!settings.hiddenSidebarItems === null) return true;
    return !settings.hiddenSidebarItems.includes(item.id);
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate font-loveHouse">
                  <GradientText
                  yoyo={false}
                  animationSpeed={0.8}
                  colors={["#F6B1CE", "#1581BF", "#3DB6B1", "#CCE5CF"]}
                  >
                    LHU Dashboard
                  </GradientText>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate text-left">
                  {title}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Navigation Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleExpanded('navigation')}
                className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span>Điều hướng</span>
                {expandedItems.includes('navigation') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {expandedItems.includes('navigation') && (
                <div className="ml-4 space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || 
                                   (item.path === '/' && location.pathname === '/home');
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.url) {
                            window.open(item.url, "_blank", "noopener,noreferrer")
                            return;
                          }
                          if (item.authrequired && !isAuth) {
                            toast.error("Vui lòng đăng nhập để truy cập trang này")
                            return;
                          }
                          if (item.path) {
                            navigate(item.path);
                          }
                          // Close sidebar on mobile after selection
                          if (window.innerWidth < 1024) {
                            onToggle?.();
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full p-3 text-left rounded-lg transition-colors group",
                          isActive 
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
                            !isAuth && item.authrequired && "hidden"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
                        )}
                        {
                          (item.isBetaItem) && (
                            <Badge>Beta</Badge>
                          )
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Đang học
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
