import React, { useMemo, useState, useCallback, memo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScheduleItem, ExamInfo } from '@/types/schedule';
import { getRealtimeStatus } from '@/utils/dateUtils';
import { 
  detectDuplicateSchedules, 
  addScheduleMetadata, 
  ScheduleWithMetadata
} from '@/utils/scheduleUtils';
import { getTinhTrangInfo, isTinhTrangCancelled, type TinhTrangInfo } from '@/utils/tinhtrang';
import { DuplicateScheduleWarning } from './LHU_UI/DuplicateScheduleWarning';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Timetable.css';

const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TimetableProps {
  schedules: ScheduleItem[];
  studentName?: string;
  exams?: ExamInfo[];
  examDurationMinutes?: number;
  includeCancelled?: boolean; // hiển thị cả lịch huỷ/báo nghỉ
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduleWithMetadata | (ExamInfo & { __isExam: true });
}

const getStatusColor = (status: number, tinhTrangInfo?: TinhTrangInfo | null) => {
  if (tinhTrangInfo) {
    if (tinhTrangInfo.type === 'holiday') {
      return 'pastel-holiday';
    }
    if (tinhTrangInfo.type === 'cancelled' || tinhTrangInfo.type === 'special') {
      return 'pastel-cancelled';
    }
  }
  switch (status) {
    case 1: return 'pastel-ongoing';  // Đang diễn ra
    case 2: return 'pastel-upcoming'; // Sắp diễn ra
    case 3: return 'pastel-done';     // Đã kết thúc
    default: return 'pastel-default';
  }
};

const getStatusText = (status: number, tinhTrangInfo?: TinhTrangInfo | null) => {
  if (tinhTrangInfo) {
    if (tinhTrangInfo.type === 'holiday') {
      return tinhTrangInfo.flagText ?? 'Nghỉ lễ';
    }
    if (tinhTrangInfo.type === 'cancelled' || tinhTrangInfo.type === 'special') {
      return 'Báo nghỉ';
    }
  }
  switch (status) {
    case 1: return 'Đang diễn ra';
    case 2: return 'Sắp diễn ra';
    case 3: return 'Đã kết thúc';
    case 0: return "Chưa bắt đầu"
    default: return 'Không xác định';
  }
};

export const Timetable: React.FC<TimetableProps> = memo(({ schedules, studentName, exams = [], examDurationMinutes = 120, includeCancelled = true }) => {
  const [screenSize, setScreenSize] = useState(() => {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';
  const isDesktop = screenSize === 'desktop';

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const events: CalendarEvent[] = useMemo(() => {
    // Tùy theo includeCancelled mà lọc hay không
    const filtered = includeCancelled
      ? (schedules || [])
      : (schedules || []).filter(s => !isTinhTrangCancelled(s.TinhTrang));
    // Thêm metadata và xử lý lịch trùng
    const schedulesWithMetadata = addScheduleMetadata(filtered);
    const duplicates = detectDuplicateSchedules(filtered);
    
    const subjectEvents: CalendarEvent[] = schedulesWithMetadata.map(schedule => {
      const startDate = new Date(schedule.ThoiGianBD);
      const endDate = new Date(schedule.ThoiGianKT);
      
      // Thêm indicator cho lịch trùng
      let title = `${schedule.TenMonHoc} - ${schedule.TenNhom}`;
      if (schedule.isDuplicate) {
        const duplicateGroup = duplicates.find(d => 
          d.schedules.some(s => s.ID === schedule.ID)
        );
        if (duplicateGroup) {
          const isPrimary = schedule.priority === 1; // Lịch bình thường có priority = 1
          title += isPrimary ? ' ⭐' : ' 🔄';
        }
      }
      
      return {
        id: schedule.ID,
        title,
        start: startDate,
        end: endDate,
        resource: schedule,
      };
    });

    const parseExamStart = (e: ExamInfo): Date | null => {
      try {
        // NgayThi có thể là dd/MM/yyyy hoặc yyyy-MM-dd. GioThi là HH:mm
        const d = e.NgayThi || '';
        const t = (e.GioThi || '').trim();
        if (!d) return null;
        let iso = '';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
          const [dd, mm, yyyy] = d.split('/');
          iso = `${yyyy}-${mm}-${dd}`;
        } else {
          iso = d;
        }
        const startStr = t ? `${iso}T${t}:00` : `${iso}T08:00:00`;
        const date = new Date(startStr);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    };

    const examEvents: CalendarEvent[] = (exams || []).map((exam, idx) => {
      const startDate = parseExamStart(exam) || new Date();
      const endDate = new Date(startDate.getTime() + examDurationMinutes * 60 * 1000);
      return {
        id: 1000000 + idx, // tránh trùng với ID lịch học
        title: `${exam.TenKT}`,
        start: startDate,
        end: endDate,
        resource: Object.assign({}, exam, { __isExam: true as const }),
      };
    });

    return [...subjectEvents, ...examEvents];
  }, [schedules, exams, examDurationMinutes, includeCancelled]);

  // Phát hiện lịch trùng để hiển thị cảnh báo
  const duplicates = useMemo(() => {
    const source = includeCancelled
      ? (schedules || [])
      : (schedules || []).filter(s => !isTinhTrangCancelled(s.TinhTrang));
    return detectDuplicateSchedules(source);
  }, [schedules, includeCancelled]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = getRealtimeStatus(event.start.toISOString(), event.end.toISOString());
    const isExam = (event.resource as any).__isExam === true;
    const scheduleResource = event.resource as ScheduleWithMetadata;
    const tinhTrangInfo = !isExam ? getTinhTrangInfo(scheduleResource.TinhTrang) : null;
    const is_duplicate = !isExam && scheduleResource.isDuplicate;
    const color = isExam ? 'pastel-exam' : getStatusColor(status, tinhTrangInfo);
    
    // [bg, textColor]
    const getColorValue = (colorClass: string): [string, string] => {
      switch (colorClass) {
        case 'pastel-ongoing':   return ['#bbf7d0', '#14532d'];
        case 'pastel-upcoming':  return ['#bfdbfe', '#1e3a5f'];
        case 'pastel-done':      return ['#e5e7eb', '#374151'];
        case 'pastel-cancelled': return ['#fecaca', '#7f1d1d'];
        case 'pastel-holiday':   return ['#fbcfe8', '#831843'];
        case 'pastel-exam':      return ['#e0e7ff', '#1e1b4b'];
        default:                 return ['#ddd6fe', '#2e1065'];
      }
    };
    
    const getFontSize = () => {
      if (isMobile) return '12px';
      if (isTablet) return '12px';
      return '13px';
    };
    
    const getPadding = () => {
      if (isMobile) return '2px';
      if (isTablet) return '3px';
      return '4px';
    };
    
    const getBorderRadius = () => {
      if (isMobile) return '4px';
      if (isTablet) return '5px';
      return '6px';
    };
    
    const [bgColor, textColor] = getColorValue(color);
    return {
      style: {
        backgroundColor: bgColor,
        borderRadius: getBorderRadius(),
        opacity: is_duplicate ? 0.85 : 1,
        color: textColor,
        border: is_duplicate ? `2px solid ${textColor}` : `1px solid ${bgColor}`,
        display: 'block',
        fontSize: getFontSize(),
        fontWeight: '500',
        padding: getPadding(),
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease-in-out',
      }
    };
  }, [isMobile, isTablet, isDesktop]);

  const EventComponent = memo(({ event }: { event: CalendarEvent }) => {
    const status = getRealtimeStatus(
      event.start.toISOString(),
      event.end.toISOString()
    );
    const isExam = (event.resource as any).__isExam === true;
    const scheduleResource = event.resource as ScheduleWithMetadata;
    const tinhTrangInfo = !isExam ? getTinhTrangInfo(scheduleResource.TinhTrang) : null;
    const is_duplicate = !isExam && scheduleResource.isDuplicate;
    const statusText = isExam ? 'Kỳ thi' : getStatusText(status, tinhTrangInfo);

    // Lấy màu text từ eventStyleGetter để đồng nhất
    const colorKey = isExam ? 'pastel-exam' : getStatusColor(status, tinhTrangInfo);
    const colorMap: Record<string, [string, string]> = {
      'pastel-ongoing':   ['#bbf7d0', '#14532d'],
      'pastel-upcoming':  ['#bfdbfe', '#1e3a5f'],
      'pastel-done':      ['#e5e7eb', '#374151'],
      'pastel-cancelled': ['#fecaca', '#7f1d1d'],
      'pastel-holiday':   ['#fbcfe8', '#831843'],
      'pastel-exam':      ['#e0e7ff', '#1e1b4b'],
    };
    const [bgColor, textColor] = colorMap[colorKey] ?? ['#ddd6fe', '#2e1065'];
    
    const getPaddingClass = () => {
      if (isMobile) return 'p-1 text-xs';
      if (isTablet) return 'p-1 text-xs';
      return 'p-1 text-sm';
    };
    
    const getTitleClass = () => {
      if (isMobile) return 'text-xs leading-snug';
      if (isTablet) return 'text-xs leading-snug';
      return 'text-sm leading-normal';
    };
    
    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return `${text.substring(0, maxLength)}...`;
    };
    
    const getMaxLength = () => {
      if (isMobile) return 20;
      if (isTablet) return 30;
      return 50;
    };
  
    return (
      <div className={`${getPaddingClass()} transition-transform duration-200`} style={{ color: textColor }}>
        <div className={`font-semibold mb-1 line-clamp-2 ${getTitleClass()}`}>
          {(() => {
            if (isExam) {
              const name = (event.resource as any).TenKT as string;
              return truncateText(name, getMaxLength());
            } else {
              const subj = scheduleResource.TenMonHoc;
              const group = scheduleResource.TenNhom;
              let title = `${subj} - ${group}`;
              if (is_duplicate) {
                title += scheduleResource.priority === 1 ? ' ⭐' : ' 🔄';
              }
              return truncateText(title, getMaxLength());
            }
          })()}
        </div>
        <div className="opacity-80 space-y-0.5">
          {!isMobile && (
            <div className="line-clamp-1 text-xs">
              {(() => {
                if (isExam) {
                  const r = event.resource as any;
                  return r.PhongThi || r.CSS || 'Không có địa điểm';
                }
                const r = scheduleResource;
                return r.TenPhong || r.OnlineLink || 'Không có địa điểm';
              })()}
            </div>
          )}
          <div className="line-clamp-1 text-xs">
            {(() => {
              if (isExam) return '';
              const teacher = scheduleResource.GiaoVien;
              return truncateText(teacher, getMaxLength());
            })()}
          </div>
          <div className="mt-1">
            <Badge
              variant="secondary"
              className={`${isMobile ? 'text-xs px-1 py-0' : isTablet ? 'text-xs px-1 py-0.5' : 'text-xs px-1.5 py-0.5'} border-0`}
              style={{ backgroundColor: `${bgColor}cc`, color: textColor }}
            >
              {statusText}
            </Badge>
          </div>
        </div>
      </div>
    );
  });

  const ToolbarComponent = memo((toolbar: any) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const goToPrev = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const viewNames = {
      agenda: isMobile ? 'DS' : 'Danh sách',
      month: isMobile ? 'M' : 'Tháng',
      week: isMobile ? 'T' : 'Tuần',
      day: isMobile ? 'N' : 'Ngày',
    };

    const getButtonSize = () => {
      if (isMobile) return 'px-2 py-1 text-xs';
      if (isTablet) return 'px-2.5 py-1.5 text-sm';
      return 'px-3 py-2 text-sm';
    };
    
    const getNavButtonSize = () => {
      if (isMobile) return 'p-1';
      if (isTablet) return 'p-1.5';
      return 'p-2';
    };
    
    const getTitleSize = () => {
      if (isMobile) return 'text-sm';
      if (isTablet) return 'text-base';
      return 'text-base sm:text-lg';
    };
    
    const getViewButtonSize = () => {
      if (isMobile) return 'px-2 py-1 text-xs';
      if (isTablet) return 'px-2.5 py-1 text-sm';
      return 'px-2 sm:px-3 py-1 text-xs sm:text-sm';
    };

    return (
      <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={goToToday}
              className={`${getButtonSize()} bg-[#8839ef] text-white rounded-md hover:bg-[#6a1fd4] transition-colors font-medium shadow-sm hover:shadow-md`}
              aria-label="Đi đến hôm nay"
            >
              Hôm nay
            </button>
            <button
              onClick={goToPrev}
              className={`${getNavButtonSize()} bg-muted hover:bg-muted/80 rounded-md transition-colors shadow-sm hover:shadow-md`}
              aria-label="Tuần trước"
            >
              ←
            </button>
            <button
              onClick={goToNext}
              className={`${getNavButtonSize()} bg-muted hover:bg-muted/80 rounded-md transition-colors shadow-sm hover:shadow-md`}
              aria-label="Tuần sau"
            >
              →
            </button>
          </div>
          
          <div className={`${getTitleSize()} font-semibold text-foreground text-center`}>
            {toolbar.label}
          </div>
        </div>
        
        {/* View Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-muted rounded-md p-1 shadow-sm">
            {Object.entries(viewNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => toolbar.onView(key)}
                className={`${getViewButtonSize()} rounded font-medium transition-colors ${
                  toolbar.view === key
                    ? 'bg-background text-[#8839ef] dark:text-[#cba6f7] shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={`Chuyển sang chế độ ${name}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  });

  // Màu theo trạng thái dùng cho dialog header
  const getEventColors = (event: CalendarEvent): [string, string] => {
    const isExam = (event.resource as any).__isExam === true;
    const status = getRealtimeStatus(event.start.toISOString(), event.end.toISOString());
    const tinhTrangInfo = !isExam ? getTinhTrangInfo((event.resource as ScheduleWithMetadata).TinhTrang) : null;
    const colorKey = isExam ? 'pastel-exam' : getStatusColor(status, tinhTrangInfo);
    const colorMap: Record<string, [string, string]> = {
      'pastel-ongoing':   ['#bbf7d0', '#14532d'],
      'pastel-upcoming':  ['#bfdbfe', '#1e3a5f'],
      'pastel-done':      ['#e5e7eb', '#374151'],
      'pastel-cancelled': ['#fecaca', '#7f1d1d'],
      'pastel-holiday':   ['#fbcfe8', '#831843'],
      'pastel-exam':      ['#e0e7ff', '#1e1b4b'],
    };
    return colorMap[colorKey] ?? ['#ddd6fe', '#2e1065'];
  };

  if (schedules.length === 0) {
    return (
      <Card className="text-center py-8 sm:py-16 border-0 shadow-lg bg-background/80 backdrop-blur-sm">
        <CardContent>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl sm:text-2xl">📅</span>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg">Không có lịch học nào để hiển thị</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Cảnh báo lịch trùng */}
      {duplicates.length > 0 && (
        <DuplicateScheduleWarning duplicates={duplicates} />
      )}
      
      {/* Thống kê nhanh */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-[#e6e9ef] to-[#f5f0ff] dark:from-[#313244] dark:to-[#313244]">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
            Thống kê lịch học
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#89b4fa]">{schedules.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Tổng số tiết</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#a6e3a1]">
                {schedules.filter(s => getRealtimeStatus(s.ThoiGianBD, s.ThoiGianKT) === 2).length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Sắp diễn ra</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#fab387]">
                {schedules.filter(s => getRealtimeStatus(s.ThoiGianBD, s.ThoiGianKT) === 1).length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Đang diễn ra</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#6c7086]">
                {schedules.filter(s => getRealtimeStatus(s.ThoiGianBD, s.ThoiGianKT) === 3).length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Đã kết thúc</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="border-0 shadow-lg" role="main" aria-label="Lịch học">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
            Lịch học {studentName ? `của ${studentName}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-2' : isTablet ? 'p-3' : 'p-2 sm:p-3 md:p-6'}`}>
          <div 
            className={`${
              isMobile ? 'h-[70vh] min-h-[400px]' : 
              isTablet ? 'h-[calc(100vh-120px)]' : 
              'h-[calc(100vh-100px)]'
            }`}
            role="application"
            aria-label="Lịch học tương tác"
          >
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['agenda', 'month', 'week', 'day']}
              defaultView={isMobile ? 'agenda' : isTablet ? 'week' : 'week'}
              step={30}
              timeslots={4}
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
                toolbar: ToolbarComponent,
              }}
              onSelectEvent={(event) => {
                setSelectedEvent(event as CalendarEvent);
              }}
              onSelectSlot={(slotInfo) => {
                // Handle slot selection for accessibility
                console.log('Slot selected:', slotInfo);
              }}
              messages={{
                next: "Tiếp",
                previous: "Trước",
                today: "Hôm nay",
                month: "Tháng",
                week: "Tuần",
                day: "Ngày",
                agenda: "Danh sách",
                date: "Ngày",
                time: "Thời gian",
                event: "Sự kiện",
                noEventsInRange: "Không có sự kiện nào trong khoảng thời gian này.",
                showMore: (total: number) => `+${total} ${isMobile ? '' : 'sự kiện khác'}`,
              }}
              culture="vi"
              min={new Date(2023, 0, 1, 7, 0)} // 7:00 AM
              max={new Date(2023, 0, 1, 22, 0)} // 10:00 PM
              formats={{
                timeGutterFormat: (date: Date, culture?: string, localizer?: any) => {
                  const format = isMobile ? 'H:mm' : isTablet ? 'HH:mm' : 'HH:mm';
                  return localizer.format(date, format, culture);
                },
                dayFormat: (date: Date, culture?: string, localizer?: any) => {
                  const format = isMobile ? 'dd/MM' : isTablet ? 'dd/MM' : 'dd/MM/yyyy';
                  return localizer.format(date, format, culture);
                },
                monthHeaderFormat: (date: Date, culture?: string, localizer?: any) => {
                  const format = isMobile ? 'MM/yyyy' : isTablet ? 'MM/yyyy' : 'MMMM yyyy';
                  return localizer.format(date, format, culture);
                },
                dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }, culture?: string, localizer?: any) => {
                  const format = isMobile ? 'dd/MM' : isTablet ? 'dd/MM' : 'dd/MM/yyyy';
                  return `${localizer.format(start, format, culture)} - ${localizer.format(end, format, culture)}`;
                },
              }}
              popup={!isMobile}
              popupOffset={isMobile ? { x: 10, y: 10 } : isTablet ? { x: 20, y: 15 } : { x: 30, y: 20 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full rounded-xl p-0 overflow-hidden gap-0">
          {selectedEvent && (() => {
            const isExam = (selectedEvent.resource as any).__isExam === true;
            const schedule = selectedEvent.resource as ScheduleWithMetadata;
            const exam = selectedEvent.resource as ExamInfo & { __isExam: true };
            const status = getRealtimeStatus(selectedEvent.start.toISOString(), selectedEvent.end.toISOString());
            const tinhTrangInfo = !isExam ? getTinhTrangInfo(schedule.TinhTrang) : null;
            const statusText = isExam ? 'Kỳ thi' : getStatusText(status, tinhTrangInfo);
            const [bgColor, textColor] = getEventColors(selectedEvent);

            const formatDateTime = (date: Date) =>
              date.toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            const rows: { label: string; value: string | undefined; icon: string }[] = isExam ? [
              { icon: '🏫', label: 'Phòng thi',    value: exam.PhongThi || exam.CSS },
              { icon: '📋', label: 'Số báo danh',  value: exam.SoBaoDanh },
              { icon: '📅', label: 'Ngày thi',     value: `${exam.NgayThi} — ${exam.GioThi}` },
            ] : [
              { icon: '👤', label: 'Giảng viên',   value: schedule.GiaoVien },
              { icon: '🏫', label: 'Phòng học',    value: schedule.TenPhong || schedule.OnlineLink },
              { icon: '📍', label: 'Cơ sở',        value: schedule.TenCoSo },
              { icon: '🔗', label: 'Link online',  value: schedule.OnlineLink },
            ];

            return (
              <>
                {/* Header có màu theo trạng thái */}
                <DialogHeader
                  className="px-5 pt-5 pb-4"
                  style={{ backgroundColor: bgColor, color: textColor }}
                >
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div className="flex-1 min-w-0">
                      <Badge
                        className="mb-2 text-xs font-medium border-0"
                        style={{ backgroundColor: `${textColor}20`, color: textColor }}
                      >
                        {statusText}
                      </Badge>
                      <DialogTitle
                        className="text-base sm:text-lg font-bold leading-snug"
                        style={{ color: textColor }}
                      >
                        {isExam ? exam.TenKT : `${schedule.TenMonHoc}`}
                      </DialogTitle>
                      {!isExam && (
                        <p className="text-sm mt-1 font-medium opacity-80" style={{ color: textColor }}>
                          {schedule.TenNhom}
                        </p>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                  {/* Thời gian */}
                  <div className="flex gap-3 items-start text-sm">
                    <span className="text-base mt-0.5">🕐</span>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Thời gian</p>
                      <p className="font-medium text-foreground">{formatDateTime(selectedEvent.start)}</p>
                      <p className="text-muted-foreground text-xs">đến {selectedEvent.end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  {/* Các trường thông tin */}
                  {rows.filter(r => r.value).map(row => (
                    <div key={row.label} className="flex gap-3 items-start text-sm">
                      <span className="text-base mt-0.5">{row.icon}</span>
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs mb-0.5">{row.label}</p>
                        <p className="font-medium text-foreground break-words">{row.value}</p>
                      </div>
                    </div>
                  ))}

                  {/* Google Maps link */}
                  {!isExam && schedule.GoogleMap && (
                    <a
                      href={schedule.GoogleMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                      <span>🗺️</span>
                      <span>Xem trên Google Maps</span>
                    </a>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default Timetable;