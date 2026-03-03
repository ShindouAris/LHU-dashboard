import React, { useMemo, useState, useCallback, memo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      return 'bg-pink-500';
    }
    if (tinhTrangInfo.type === 'cancelled' || tinhTrangInfo.type === 'special') {
      return 'bg-red-500';
    }
  }
  switch (status) {
    case 1: return 'bg-green-500'; // Đang diễn ra
    case 2: return 'bg-yellow-500'; // Sắp diễn ra
    case 3: return 'bg-gray-400'; // Đã kết thúc
    default: return 'bg-blue-500';
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
    const color = isExam ? 'bg-indigo-600' : getStatusColor(status, tinhTrangInfo);
    
    const getColorValue = (colorClass: string) => {
      switch (colorClass) {
        case 'bg-green-500': return '#10b981';
        case 'bg-yellow-500': return '#f59e0b';
        case 'bg-gray-400': return '#9ca3af';
        case 'bg-red-500': return '#E62727';
        case 'bg-indigo-600': return '#4f46e5';
        case 'bg-pink-500': return '#FF8FB7'
        default: return '#C47BE4';
      }
    };
    
    const getFontSize = () => {
      if (isMobile) return '10px';
      if (isTablet) return '11px';
      return '12px';
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
    
    return {
      style: {
        backgroundColor: getColorValue(color),
        borderRadius: getBorderRadius(),
        opacity: is_duplicate ? 0.8 : 0.9,
        color: 'white',
        border: is_duplicate ? '2px solid #f59e0b' : '0px',
        display: 'block',
        fontSize: getFontSize(),
        fontWeight: '500',
        padding: getPadding(),
        boxShadow: is_duplicate ? '0 2px 6px rgba(245, 158, 11, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
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
    
    const getPaddingClass = () => {
      if (isMobile) return 'p-0.5 text-xs';
      if (isTablet) return 'p-0.75 text-xs';
      return 'p-1 text-sm';
    };
    
    const getTitleClass = () => {
      if (isMobile) return 'text-xs leading-tight';
      if (isTablet) return 'text-xs leading-snug';
      return 'text-sm leading-normal';
    };
    
    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return `${text.substring(0, maxLength)}...`;
    };
    
    const getMaxLength = () => {
      if (isMobile) return 15;
      if (isTablet) return 25;
      return 50;
    };
  
    return (
      <div className={`${getPaddingClass()} transition-transform duration-200`}>
        <div className={`font-semibold mb-1 line-clamp-2 text-white ${getTitleClass()}`}>
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
        <div className="opacity-90 text-white space-y-0.5">
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
          <div className={`line-clamp-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {(() => {
              if (isExam) return '';
              const teacher = scheduleResource.GiaoVien;
              return truncateText(teacher, getMaxLength());
            })()}
          </div>
          <div className="mt-1">
            <Badge
              variant="secondary"
              className={`${isMobile ? 'text-xs px-1 py-0' : isTablet ? 'text-xs px-1 py-0.5' : 'text-xs px-1.5 py-0.5'} ${isExam ? 'bg-indigo-600' : getStatusColor(
                status,
                tinhTrangInfo
              )} text-white border-0 shadow-sm`}
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
      month: isMobile ? 'M' : isTablet ? 'Tháng' : 'Tháng',
      week: isMobile ? 'W' : isTablet ? 'Tuần' : 'Tuần',
      day: isMobile ? 'D' : isTablet ? 'Ngày' : 'Ngày'
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
              className={`${getButtonSize()} bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md`}
              aria-label="Đi đến hôm nay"
            >
              Hôm nay
            </button>
            <button
              onClick={goToPrev}
              className={`${getNavButtonSize()} bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors shadow-sm hover:shadow-md`}
              aria-label="Tuần trước"
            >
              ←
            </button>
            <button
              onClick={goToNext}
              className={`${getNavButtonSize()} bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors shadow-sm hover:shadow-md`}
              aria-label="Tuần sau"
            >
              →
            </button>
          </div>
          
          <div className={`${getTitleSize()} font-semibold text-gray-900 dark:text-white text-center`}>
            {toolbar.label}
          </div>
        </div>
        
        {/* View Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1 shadow-sm">
            {Object.entries(viewNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => toolbar.onView(key)}
                className={`${getViewButtonSize()} rounded font-medium transition-colors ${
                  toolbar.view === key
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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

  if (schedules.length === 0) {
    return (
      <Card className="text-center py-8 sm:py-16 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl sm:text-2xl">📅</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">Không có lịch học nào để hiển thị</p>
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
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">
            Thống kê lịch học
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{schedules.length}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tổng số tiết</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                {schedules.filter(s => getRealtimeStatus(s.ThoiGianBD, s.ThoiGianKT) === 2).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sắp diễn ra</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">
                {schedules.filter(s => getRealtimeStatus(s.ThoiGianBD, s.ThoiGianKT) === 1).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Đang diễn ra</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">
                {schedules.filter(s => getRealtimeStatus(s.ThoiGianBD, s.ThoiGianKT) === 3).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Đã kết thúc</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="border-0 shadow-lg" role="main" aria-label="Lịch học">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">
            Lịch học {studentName ? `của ${studentName}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-2' : isTablet ? 'p-3' : 'p-2 sm:p-3 md:p-6'}`}>
          <div 
            className={`${
              isMobile ? 'h-[calc(100vh-150px)]' : 
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
              views={['month', 'week', 'day']}
              defaultView={isMobile ? 'day' : isTablet ? 'week' : 'week'}
              step={30}
              timeslots={4}
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
                toolbar: ToolbarComponent,
              }}
              onSelectEvent={(event) => {
                // Handle event selection for accessibility
                console.log('Event selected:', event);
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
    </div>
  );
});

export default Timetable;