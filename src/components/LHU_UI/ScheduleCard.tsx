import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Clock,
    MapPin,
    User,
    BookOpen,
    Building,
    ExternalLink,
    Video,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock3,
    AlertTriangle,
    CircleSlash
} from 'lucide-react';
import { ScheduleItem } from '@/types/schedule';
import { formatTime, formatDate, getDayName, getRealtimeStatus, StartAfter } from '@/utils/dateUtils';
import { ApiService } from '@/services/apiService';
import type { HourForecast } from '@/types/weather';
import { 
  detectDuplicateSchedules, 
  getDuplicateGroupStatus 
} from '@/utils/scheduleUtils';
import { getTinhTrangInfo, isTinhTrangCancelled } from '@/utils/tinhtrang';
import FuzzyText from "@/components/LHU_UI/FuzzyText";
import { motion } from "framer-motion";
import { PiExam } from 'react-icons/pi';

interface ScheduleCardProps {
  schedule: ScheduleItem;
  isNext?: boolean;
  allSchedules?: ScheduleItem[]; // Thêm để phát hiện lịch trùng
  is_a_exam_class?: boolean;
}

const ScheduleCardInner: React.FC<ScheduleCardProps> = ({ schedule, isNext = false, allSchedules = [] }) => {
  const getStatusConfig = (status: number, isCanceled: boolean) => {
    // Trạng thái bị hủy
    if (isCanceled) {
        return {
            color: 'bg-gradient-to-r from-rose-600 to-rose-700',
            text: 'Bị hủy',
            icon: CircleSlash,
            textColor: 'text-rose-700 dark:text-rose-300'
        };
    }
    switch (status) {
      case 1:
        return {
          color: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
          text: 'Đang diễn ra',
          icon: CheckCircle2,
          textColor: 'text-emerald-700 dark:text-emerald-300'
        };
      case 2:
        return {
          color: 'bg-gradient-to-r from-sky-600 to-sky-700',
          text: 'Sắp diễn ra',
          icon: Clock3,
          textColor: 'text-sky-700 dark:text-sky-300'
        };
      case 3:
        return {
          color: 'bg-gradient-to-r from-slate-500 to-slate-600',
          text: 'Đã kết thúc',
          icon: AlertCircle,
          textColor: 'text-slate-700 dark:text-slate-300'
        };
      default:
        return {
          color: 'bg-gradient-to-r from-sky-600 to-sky-700',
          text: 'Chưa bắt đầu',
          icon: AlertCircle,
          textColor: 'text-slate-700 dark:text-slate-300'
        };
    }
  };

  const getColor = (isCanceled: boolean, isNext: boolean, is_a_exam_class: boolean): string => {
    if (isNext && !isCanceled) {
      // Tiết tiếp theo
      return 'bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 dark:from-indigo-900 dark:via-indigo-800 dark:to-sky-900 shadow-lg shadow-sky-300/40 dark:shadow-sky-900/40'
    }

    if (is_a_exam_class && !isCanceled) {
      // Tiết thi
      return 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-[#FFAA00] dark:via-[#FF77AA] dark:to-[#FFBBE1] shadow-lg shadow-amber-300/40 dark:shadow-indigo-900/40'
    }
  
    if (isCanceled) {
      // Tiết bị hủy
      return 'bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 dark:from-zinc-800 dark:via-zinc-900 dark:to-black shadow-md shadow-zinc-700/20 dark:shadow-black/30'
    }
  
    // Tiết đang học
    return 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-[#03A791] dark:via-[#DD7BDF] dark:to-[#FFBBE1] shadow-lg shadow-amber-300/40 dark:shadow-indigo-900/40'
  }
  

  function minutesToHourMinute(minutes: number): string {
    const h = Math.floor(minutes / 60); // chia lấy giờ
    const m = minutes % 60; // còn dư là phút
    return `${h} giờ ${m > 0 ? `${m} phút` : ''}`;
  }
  // Ưu tiên trạng thái tính theo thời gian thực để tránh sai do API cũ
  const realtimeStatus = getRealtimeStatus(schedule.ThoiGianBD, schedule.ThoiGianKT);
  const effectiveStatus = realtimeStatus !== undefined && realtimeStatus !== null
    ? realtimeStatus
    : schedule.TinhTrang;
  const tinhTrangInfo = getTinhTrangInfo(schedule.TinhTrang);
  const canceled = isTinhTrangCancelled(schedule.TinhTrang);
  const statusConfig = getStatusConfig(effectiveStatus, canceled);
  const StatusIcon = statusConfig.icon;
  const overlayTitle = tinhTrangInfo.type === 'holiday' ? 'Nghỉ lễ' : 'Tiết báo nghỉ';
  const overlayDescription = tinhTrangInfo.type === 'holiday'
    ? `Môn học ${schedule.TenMonHoc} được nghỉ do lịch nghỉ lễ`
    : `Môn học ${schedule.TenMonHoc} đã báo nghỉ`;
  const overlayBackgroundClass = tinhTrangInfo.type === 'holiday'
    ? 'bg-gradient-to-br from-emerald-100/60 via-green-100/40 to-emerald-200/40 dark:from-emerald-950/60 dark:via-green-900/40 dark:to-emerald-900/50'
    : 'bg-gradient-to-br from-rose-100/50 via-rose-200/50 to-red-100/50 dark:from-rose-950/50 dark:via-rose-900/50 dark:to-red-950/50';
  const overlayTitleClass = tinhTrangInfo.type === 'holiday'
    ? 'text-emerald-700 dark:text-emerald-200'
    : 'text-rose-700 dark:text-rose-300';

  const getStudyPlace = (schedule: ScheduleItem) => {
    if (schedule.TenCoSo.toLocaleLowerCase().includes("khác")) {
      return "Khác";
    }
    if (schedule.TenCoSo.toLocaleLowerCase().includes("online") && schedule.TenPhong.toLowerCase().includes("online learn")) {
        return "Học Trên Learn"
    }
    if (schedule.TenCoSo.toLocaleLowerCase().includes("online")) {
      return "Học Online";
    }

    return schedule.TenCoSo.replace("Cơ sở ", "").trim();
  }

  const [timestring, setTimestring] = useState("Đang tính toán...")

  // Chỉ chạy marquee nếu nội dung tràn hộp
  const groupNameRef = useRef<HTMLDivElement | null>(null)
  const [shouldMarquee, setShouldMarquee] = useState(false)

  useEffect(() => {
    const evaluateOverflow = () => {
      const el = groupNameRef.current
      if (!el) return
      const isOverflowing = el.scrollWidth > el.clientWidth
      setShouldMarquee(isOverflowing)
    }

    // đo lần đầu và khi resize
    evaluateOverflow()
    window.addEventListener('resize', evaluateOverflow)
    return () => window.removeEventListener('resize', evaluateOverflow)
  }, [])

  // Phát hiện lịch trùng
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    duplicateGroup?: string;
    duplicateSchedules?: ScheduleItem[];
    status?: ReturnType<typeof getDuplicateGroupStatus>;
  }>({ isDuplicate: false });

  useEffect(() => {
    if (allSchedules.length > 0) {
      const duplicates = detectDuplicateSchedules(allSchedules);
      // Tìm group chứa lịch hiện tại
      const duplicateGroup = duplicates.find(d => 
        d.schedules.some(s => s.ID === schedule.ID)
      );
      
      if (duplicateGroup) {
        const status = getDuplicateGroupStatus(duplicateGroup.schedules);
        setDuplicateInfo({
          isDuplicate: true,
          duplicateGroup: duplicateGroup.key,
          duplicateSchedules: duplicateGroup.schedules,
          status
        });
      } else {
        setDuplicateInfo({ isDuplicate: false });
      }
    }
  }, [allSchedules, schedule.ID]);

  useEffect(() => {

    const timer = setInterval(() => {
      const start_time = StartAfter(schedule.ThoiGianBD)
      if (start_time) {
        setTimestring(start_time)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [schedule.ThoiGianBD])

  // Weather forecast (only if class within 3 days)
  const [forecastHour, setForecastHour] = useState<HourForecast | null>(null)
  const [breakpoint, setbreakpoint] = useState<boolean>(false)
  useEffect(() => {
    const now = Date.now()
    const start = new Date(schedule.ThoiGianBD).getTime()
    if (breakpoint) {
      return
    }
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000
    if (isNaN(start) || start - now > threeDaysMs) {
      setForecastHour(null)
      setbreakpoint(true)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        console.log('[WeatherForecast] Gọi API lấy dự báo thời tiết cho', schedule.ThoiGianBD)
        const data: HourForecast = await ApiService.get_forecast_weather(schedule.ThoiGianBD)
        console.log('[WeatherForecast] Giờ dự báo gần nhất:', data)
        if (data.error) {
          cancelled = true
          return
        }
        if (!cancelled) setForecastHour(data)
      } catch (err) {
        console.log('[WeatherForecast] Lỗi khi lấy dự báo thời tiết:', err)
        if (!cancelled) setForecastHour(null)
      }
    }
    load().then(() => {
      console.log('[WeatherForecast] Đã lấy dự báo thời tiết cho', schedule.ThoiGianBD)
    })
    return () => {
      cancelled = true
      console.log('[WeatherForecast] Hủy lấy dự báo thời tiết (unmount hoặc đổi tiết học)')
      setbreakpoint(false)
    }
  }, [schedule.ThoiGianBD])

  return (
    <Card className={`group relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-0 overflow-hidden focus-within:ring-2 focus-within:ring-sky-500/70 dark:focus-within:ring-sky-400/60 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-900 ${
      getColor(canceled, isNext, schedule.CalenType === 2)
    }`}>
      {/* Next Class Banner */}
      {isNext && schedule.CalenType !== 2 && (
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 text-white px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 animate-pulse" />
            Tiết học tiếp theo - Bắt đầu sau: {timestring}
          </div>
        </div>
      )}

      {schedule.CalenType === 2 && !canceled && (
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 text-white px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PiExam className="h-4 w-4 animate-pulse" />
              Đây là lịch thi. {!isNext ? 'Hãy chuẩn bị thật tốt cho kỳ thi sắp tới!' : 'Chúc bạn thi tốt!'} - Bắt đầu sau: {timestring}
          </div>
        </div>
      )}


        {canceled && (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4 ${overlayBackgroundClass}`}>
                <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${overlayTitleClass}`}>
                    <FuzzyText baseIntensity={0.3} hoverIntensity={0.7} enableHover={true}>{overlayTitle}</FuzzyText>
                </h2>
                <motion.p
                    className="mt-4 text-slate-200 dark:text-slate-300 lg:text-2xl sm:text-sm tracking-wider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    {overlayDescription}
                </motion.p>
            </div>
        )}
            <CardContent className={`p-5 sm:p-6 lg:p-8 transition-all duration-500 bg-white/60 dark:bg-gray-900/30 backdrop-blur supports-[backdrop-filter]:bg-white/30 dark:supports-[backdrop-filter]:bg-gray-900/20 ${
                canceled ? 'blur-sm brightness-75 pointer-events-none select-none' : ''
            }`}>
            {/* Header Section */}
            <div className="flex items-start justify-between mb-5 sm:mb-6 gap-3">
                <div className="flex-1 min-w-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h3 className="text-lg sm:text-xl font-bold mb-2.5 sm:mb-3 bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-sky-200 dark:to-indigo-200 bg-clip-text text-transparent group-hover:from-sky-600 group-hover:to-indigo-400 group-hover:dark:from-sky-300 group-hover:dark:to-indigo-300 transition-all cursor-help line-clamp-2 hover:line-clamp-none">
                                    {schedule.TenMonHoc}
                                </h3>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p className="text-sm">{schedule.TenMonHoc}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div
                        className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <div
                            className="flex items-center gap-2 bg-sky-100 dark:bg-sky-900/40 text-slate-700 dark:text-slate-300 px-2.5 sm:px-3 py-1 rounded-full">
                            <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400"/>
                            <span className="font-medium">{getDayName(schedule.Thu)}</span>
                        </div>
                        <span className="hidden sm:inline text-slate-400 dark:text-slate-500">•</span>
                        <span className="font-medium text-slate-500 dark:text-slate-400">{formatDate(schedule.ThoiGianBD)}</span>
                        {/* Badges: TinhTrang, CalenType, Type */}
                        {tinhTrangInfo.flagText && (
                            <Badge
                                className={`${tinhTrangInfo.badgeClassName ?? ''} px-2.5 py-1 rounded-full shadow text-xs sm:text-sm font-semibold`}>
                                {tinhTrangInfo.flagText}
                            </Badge>
                        )}
                        {duplicateInfo.isDuplicate && (
                            <Badge
                                className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-2.5 py-1 rounded-full shadow">
                                {duplicateInfo.duplicateSchedules?.length ? duplicateInfo.duplicateSchedules.length - 1 : 0} lịch
                                trùng
                            </Badge>
                        )}
                        {schedule.CalenType === 2 && (
                            <Badge
                                className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-2.5 py-1 rounded-full shadow">
                                Thi
                            </Badge>
                        )}
                        <Badge
                            className="bg-gradient-to-r from-zinc-200 to-slate-300 text-slate-900 dark:from-slate-700 dark:to-zinc-700 dark:text-white px-2.5 py-1 rounded-full shadow">
                            {schedule.Type === 0 ? 'Lý thuyết' : 'Thực hành'}
                        </Badge>
                    </div>
                </div>

                <Badge
                    className={`${statusConfig.color} text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium shadow-lg whitespace-nowrap`}
                >
                    <StatusIcon className="h-4 w-4 mr-2"/>
                    {statusConfig.text}
                </Badge>
            </div>

            {/* Schedule Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-5 sm:mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                    <div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 rounded-xl min-h-[60px] sm:min-h-[72px]">
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Thời gian</div>
                            <div
                                className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white break-words">
                                {formatTime(schedule.ThoiGianBD)} - {formatTime(schedule.ThoiGianKT)}
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 rounded-xl min-h-[60px] sm:min-h-[72px]">
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Phòng học</div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white cursor-help line-clamp-1 hover:line-clamp-none transition-all">
                                            {schedule.TenPhong}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-sm">{schedule.TenPhong}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl min-h-[60px] sm:min-h-[72px]">
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-white"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Giảng viên</div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white cursor-help line-clamp-1 hover:line-clamp-none transition-all">
                                            {schedule.GiaoVien}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-sm">{schedule.GiaoVien}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 rounded-xl min-h-[60px] sm:min-h-[72px]">
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white"/>
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Nhóm học</div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div ref={groupNameRef}
                                             className={`text-sm sm:text-base font-semibold text-slate-900 dark:text-white cursor-help ${shouldMarquee ? 'animate-marquee' : 'line-clamp-1 hover:line-clamp-none'} transition-all`}>
                                            {schedule.TenNhom}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-sm">{schedule.TenNhom}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl min-h-[60px] sm:min-h-[72px]">
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Cơ sở</div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white cursor-help line-clamp-1 hover:line-clamp-none transition-all">
                                            {getStudyPlace(schedule)}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-sm">{getStudyPlace(schedule)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-950/30 dark:to-zinc-950/30 rounded-xl min-h-[60px] sm:min-h-[72px]">
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Thời lượng tiết</div>
                            <div
                                className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white break-words">
                                {minutesToHourMinute(schedule.SoTietBuoi)}
                            </div>
                        </div>
                    </div>
                    {forecastHour && (
                        <div
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 rounded-xl min-h-[60px] sm:min-h-[72px]">
                            <div
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 flex items-center justify-center overflow-hidden">
                                <img
                                    src={
                                        forecastHour?.condition?.icon
                                            ? (forecastHour.condition.icon.startsWith('http')
                                                ? forecastHour.condition.icon
                                                : `https:${forecastHour.condition.icon}`)
                                            : '/favicon.svg'
                                    }
                                    alt="weather"
                                    className="w-6 h-6"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Thời tiết dự kiến
                                </div>
                                <div
                                    className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white break-words">
                                    {forecastHour.temp_c}°C • {forecastHour?.condition?.text ?? 'Không có dữ liệu'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Duplicate Schedule Info */}
                    {duplicateInfo.isDuplicate && duplicateInfo.duplicateSchedules && (
                        <div
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl min-h-[60px] sm:min-h-[72px] border border-amber-200 dark:border-amber-700">
                            <div
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white"/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-semibold">
                                    Cảnh báo: Lịch trùng thời gian
                                </div>
                                <div
                                    className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-100">
                                    Có {duplicateInfo.duplicateSchedules.length - 1} lịch cùng thời gian
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    {duplicateInfo.status?.statusText && `Trạng thái: ${duplicateInfo.status.statusText}`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div
                className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-5 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
                {schedule.GoogleMap && (
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => window.open(schedule.GoogleMap, '_blank')}
                        className="flex items-center gap-2 hover:bg-sky-50 dark:hover:bg-sky-900/40 hover:border-sky-300 dark:hover:border-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group w-full"
                    >
                        <div
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900 dark:to-indigo-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400"/>
                        </div>
                        <span>Xem bản đồ</span>
                        <ExternalLink className="h-4 w-4 text-sky-500 group-hover:translate-x-1 transition-transform"/>
                    </Button>
                )}

                {schedule.OnlineLink && (
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                            if (getStudyPlace(schedule) === "Học Trên Learn") {
                                window.open("https://learn.lhu.edu.vn", "_blank");
                            } else {
                            window.open(schedule.OnlineLink, '_blank')
                            }
                        }}
                        className="flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group w-full"
                    >
                        <div
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            {getStudyPlace(schedule) === "Học Trên Learn" ? (<BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />) : (<Video className="h-4 w-4 text-emerald-600 dark:text-emerald-400"/>) }
                        </div>
                        <span>Tham gia online</span>
                        <ExternalLink
                            className="h-4 w-4 text-emerald-500 group-hover:translate-x-1 transition-transform"/>
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
  );
};

// Tránh re-render không cần thiết
const areEqual = (prev: ScheduleCardProps, next: ScheduleCardProps) => {
  const a = prev.schedule;
  const b = next.schedule;
  if ((prev.isNext ?? false) !== (next.isNext ?? false)) return false;
  // Nếu reference danh sách thay đổi (ảnh hưởng phát hiện trùng), cho phép rerender
  if (prev.allSchedules !== next.allSchedules) return false;
  return (
    a.ID === b.ID &&
    a.ThoiGianBD === b.ThoiGianBD &&
    a.ThoiGianKT === b.ThoiGianKT &&
    a.TinhTrang === b.TinhTrang &&
    a.TenPhong === b.TenPhong &&
    a.GiaoVien === b.GiaoVien &&
    a.TenNhom === b.TenNhom &&
    a.CalenType === b.CalenType &&
    a.Type === b.Type &&
    a.GoogleMap === b.GoogleMap &&
    a.OnlineLink === b.OnlineLink &&
    a.Thu === b.Thu &&
    a.SoTietBuoi === b.SoTietBuoi &&
    a.TenCoSo === b.TenCoSo
  );
};

export const ScheduleCard = React.memo(ScheduleCardInner, areEqual);