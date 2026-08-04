import React, { useState } from 'react';
import { 
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
    if (settings.hiddenSidebarItems == null) return true;
    return !settings.hiddenSidebarItems.includes(item.id);
  });

  const handleNavigation = (item: NavigationItem, closeAfterNavigation: boolean) => {
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (item.authrequired && !isAuth) {
      toast.error("Vui lòng đăng nhập để truy cập trang này");
      return;
    }
    if (item.path) {
      navigate(item.path);
    }
    if (closeAfterNavigation) {
      onToggle?.();
    }
  };

  const renderSidebarNavigation = (instance: 'desktop' | 'mobile') => {
    const navigationId = `${instance}-sidebar-navigation`;

    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => toggleExpanded('navigation')}
            aria-expanded={expandedItems.includes('navigation')}
            aria-controls={navigationId}
            className="flex w-full items-center justify-between rounded-md p-2 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-accent"
          >
            <span>Điều hướng</span>
            {expandedItems.includes('navigation') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {expandedItems.includes('navigation') && (
            <div id={navigationId} className="ml-4 flex min-w-0 flex-col gap-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path === '/' && location.pathname === '/home');

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleNavigation(item, instance === 'mobile')}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      "group flex min-w-0 w-full items-center gap-3 overflow-hidden rounded-md border-2 p-3 text-left transition-all",
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
                        "truncate text-xs",
                        isActive ? "text-section-foreground/80" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                    {item.isBetaItem && (
                      <Badge className="shrink-0" variant={isActive ? 'outline' : 'section'}>Beta</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 border-t-2 border-border pt-4">
          <div className="flex items-center gap-2 rounded-md border-2 border-border bg-[hsl(142_71%_45%)] p-3 text-black shadow-brutal-sm">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-black" />
            <span className="text-sm font-bold">Đang học</span>
          </div>
        </div>
      </div>
    );
  };

  const renderBrandMark = () => (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-border bg-section text-section-foreground shadow-brutal-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-lg font-black text-foreground">
          LHU Dashboard
        </div>
        <p className="truncate text-left text-xs font-medium text-muted-foreground">
          {title}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-full w-80 flex-shrink-0 overflow-hidden border-r-2 border-border bg-card lg:sticky lg:top-0 lg:flex">
        <div className="flex h-full min-w-0 w-full flex-col">
          <div className="border-b-2 border-border p-4">
            {renderBrandMark()}
          </div>
          {renderSidebarNavigation('desktop')}
        </div>
      </aside>

      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (open !== isOpen) onToggle?.();
        }}
      >
        <SheetContent side="left" className="flex w-80 max-w-[85vw] flex-col gap-0 overflow-hidden border-r-2 border-border bg-card p-0 lg:hidden">
          <SheetHeader className="border-b-2 border-border p-4 pr-14 text-left">
            <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
            <SheetDescription className="sr-only">
              Chọn trang bạn muốn mở trong LHU Dashboard.
            </SheetDescription>
            {renderBrandMark()}
          </SheetHeader>
          {renderSidebarNavigation('mobile')}
        </SheetContent>
      </Sheet>
    </>
  );
};
