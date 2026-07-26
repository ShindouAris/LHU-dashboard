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
        "fixed top-0 left-0 z-50 h-full w-80 bg-card border-r-2 border-border transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-section text-section-foreground border-2 border-border shadow-brutal-sm rounded-md flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg font-black text-foreground truncate">
                  LHU Dashboard
                </h1>
                <p className="text-xs font-medium text-muted-foreground truncate text-left">
                  {title}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
              aria-label="Đóng menu"
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
                className="flex items-center justify-between w-full p-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-accent rounded-md transition-colors"
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
                          "flex items-center gap-3 w-full p-3 text-left rounded-md border-2 transition-all group",
                          isActive
                            ? "bg-section text-section-foreground border-border shadow-brutal-sm font-bold"
                            : "border-transparent hover:border-border hover:bg-accent text-foreground",
                            !isAuth && item.authrequired && "hidden"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-section-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold">{item.label}</div>
                          <div className={cn(
                            "text-xs truncate",
                            isActive ? "text-section-foreground/80" : "text-muted-foreground"
                          )}>
                            {item.description}
                          </div>
                        </div>
                        {
                          (item.isBetaItem) && (
                            <Badge variant={isActive ? 'outline' : 'section'}>Beta</Badge>
                          )
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="pt-4 mt-2 border-t-2 border-border">
              <div className="flex items-center gap-2 p-3 border-2 border-border bg-[hsl(142_71%_45%)] text-black rounded-md shadow-brutal-sm">
                <div className="w-2.5 h-2.5 bg-black rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">
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
