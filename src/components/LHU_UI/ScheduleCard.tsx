import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Clock,
    MapPin,
    User,
    BookOpen,
    Building,
    ExternalLink,
    Video,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    AlertCircle,
    CircleSlash,
    Cloud,
    type LucideIcon,
} from 'lucide-react';
import { ScheduleItem } from '@/types/schedule';
import {
    formatTime,
    formatDate,
    getDayName,
    getRealtimeStatus,
    StartAfter,
} from '@/utils/dateUtils';
import { ApiService } from '@/services/apiService';
import type { HourForecast } from '@/types/weather';
import {
    detectDuplicateSchedules,
    getDuplicateGroupStatus,
} from '@/utils/scheduleUtils';
import { getTinhTrangInfo, isTinhTrangCancelled } from '@/utils/tinhtrang';
import { PiExam } from 'react-icons/pi';

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

interface ScheduleCardProps {
    schedule: ScheduleItem;
    isNext?: boolean;
    allSchedules?: ScheduleItem[];
    is_a_exam_class?: boolean;
}

type StatusConfig = {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers (pure, không dùng hook)                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const minutesToHourMinute = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h <= 0) return `${m} phút`;
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h} giờ`;
};

const getStatusConfig = (
    status: number,
    cancelType: 'none' | 'holiday' | 'cancelled'
): StatusConfig => {
    if (cancelType === 'holiday') {
        return {
            label: 'Nghỉ lễ',
            icon: CircleSlash,
            badgeClass: 'bg-[#a6e3a1] text-[#1e1e2e] dark:bg-[#a6e3a1] dark:text-[#1e1e2e]',
        };
    }
    if (cancelType === 'cancelled') {
        return {
            label: 'Báo nghỉ',
            icon: CircleSlash,
            badgeClass: 'bg-[#f38ba8] text-[#1e1e2e] dark:bg-[#f38ba8] dark:text-[#1e1e2e]',
        };
    }
    switch (status) {
        case 1:
            return {
                label: 'Đang diễn ra',
                icon: CheckCircle2,
                badgeClass: 'bg-[#a6e3a1] text-[#1e1e2e] dark:bg-[#a6e3a1] dark:text-[#1e1e2e]',
            };
        case 2:
            return {
                label: 'Sắp diễn ra',
                icon: Clock3,
                badgeClass: 'bg-primary text-primary-foreground',
            };
        case 3:
            return {
                label: 'Đã kết thúc',
                icon: AlertCircle,
                badgeClass: 'bg-muted text-muted-foreground',
            };
        default:
            return {
                label: 'Chưa bắt đầu',
                icon: AlertCircle,
                badgeClass: 'bg-muted text-muted-foreground',
            };
    }
};

const getStudyPlace = (schedule: ScheduleItem): string => {
    const coSo = schedule.TenCoSo.toLowerCase();
    const phong = schedule.TenPhong.toLowerCase();
    if (coSo.includes('khác')) return 'Khác';
    if (coSo.includes('online') && phong.includes('online learn'))
        return 'Học Trên Learn';
    if (coSo.includes('online')) return 'Học Online';
    return schedule.TenCoSo.replace('Cơ sở ', '').trim();
};

/** Border/accent của card theo trạng thái */
const getCardAccent = (
    cancelType: 'none' | 'holiday' | 'cancelled',
    isNext: boolean,
    isExam: boolean
): string => {
    if (cancelType === 'holiday')
        return 'border-l-4 border-l-[#a6e3a1] bg-[#a6e3a1]/10 ring-1 ring-[#a6e3a1]/20';
    if (cancelType === 'cancelled')
        return 'border-l-4 border-l-[#f38ba8] bg-[#f38ba8]/10 ring-1 ring-[#f38ba8]/20';
    if (isNext)
        return 'border-l-4 border-l-primary bg-primary/5 ring-1 ring-primary/20';
    if (isExam)
        return 'border-l-4 border-l-[#fab387] bg-[#fab387]/5 ring-1 ring-[#fab387]/20';
    return 'border-l-4 border-l-border';
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Custom hooks                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const useStartCountdown = (startTime: string) => {
    const [text, setText] = useState('Đang tính toán...');
    useEffect(() => {
        const tick = () => {
            const v = StartAfter(startTime);
            if (v) setText(v);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [startTime]);
    return text;
};

const useOverflow = <T extends HTMLElement>() => {
    const ref = useRef<T | null>(null);
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
        const check = () => {
            const el = ref.current;
            if (!el) return;
            setOverflow(el.scrollWidth > el.clientWidth);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return { ref, overflow };
};

const useDuplicateInfo = (
    schedule: ScheduleItem,
    allSchedules: ScheduleItem[]
) => {
    return useMemo(() => {
        if (!allSchedules.length) return { isDuplicate: false as const };
        const groups = detectDuplicateSchedules(allSchedules);
        const group = groups.find(g =>
            g.schedules.some(s => s.ID === schedule.ID)
        );
        if (!group) return { isDuplicate: false as const };
        return {
            isDuplicate: true as const,
            schedules: group.schedules,
            status: getDuplicateGroupStatus(group.schedules),
        };
    }, [allSchedules, schedule.ID]);
};

const useWeatherForecast = (startTime: string) => {
    const [forecast, setForecast] = useState<HourForecast | null>(null);
    useEffect(() => {
        const start = new Date(startTime).getTime();
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        if (isNaN(start) || start - Date.now() > threeDays) {
            setForecast(null);
            return;
        }
        let cancelled = false;
        ApiService.get_forecast_weather(startTime)
            .then(data => {
                if (cancelled || !data || data.error) return;
                setForecast(data);
            })
            .catch(() => !cancelled && setForecast(null));
        return () => {
            cancelled = true;
        };
    }, [startTime]);
    return forecast;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Sub-components                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

interface InfoRowProps {
    icon?: LucideIcon;
    iconNode?: React.ReactNode;
    label: string;
    value: React.ReactNode;
    tooltip?: string;
    valueRef?: React.Ref<HTMLDivElement>;
    valueClassName?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({
    icon: Icon,
    iconNode,
    label,
    value,
    tooltip,
    valueRef,
    valueClassName = '',
}) => {
    const valueEl = (
        <div
            ref={valueRef}
            className={`text-sm font-semibold text-foreground truncate ${valueClassName}`}
        >
            {value}
        </div>
    );

    return (
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                {iconNode ?? (Icon ? <Icon className="h-4 w-4 text-primary-foreground" /> : null)}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>
                {tooltip ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>{valueEl}</TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p className="text-sm">{tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    valueEl
                )}
            </div>
        </div>
    );
};

interface CardBannerProps {
    icon: LucideIcon;
    children: React.ReactNode;
}

const CardBanner: React.FC<CardBannerProps> = ({ icon: Icon, children }) => (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-2">
        <Icon className="h-4 w-4 animate-pulse flex-shrink-0" />
        <span className="truncate">{children}</span>
    </div>
);

/* ────────────────────────────────────────────────────────────────────────── */
/* Main component                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

const ScheduleCardInner: React.FC<ScheduleCardProps> = ({
    schedule,
    isNext = false,
    allSchedules = [],
}) => {
    const isExam = schedule.CalenType === 2;
    const tinhTrangInfo = getTinhTrangInfo(schedule.TinhTrang);
    const canceled = isTinhTrangCancelled(schedule.TinhTrang);
    const cancelType: 'none' | 'holiday' | 'cancelled' = canceled
        ? tinhTrangInfo.type === 'holiday'
            ? 'holiday'
            : 'cancelled'
        : 'none';

    const realtimeStatus = getRealtimeStatus(
        schedule.ThoiGianBD,
        schedule.ThoiGianKT
    );
    const effectiveStatus =
        realtimeStatus !== undefined && realtimeStatus !== null
            ? realtimeStatus
            : schedule.TinhTrang;
    const status = getStatusConfig(effectiveStatus, cancelType);
    const StatusIcon = status.icon;

    const studyPlace = getStudyPlace(schedule);
    const countdown = useStartCountdown(schedule.ThoiGianBD);
    const { ref: groupRef, overflow: shouldMarquee } =
        useOverflow<HTMLDivElement>();
    const duplicate = useDuplicateInfo(schedule, allSchedules);
    const forecast = useWeatherForecast(schedule.ThoiGianBD);

    const handleOnlineClick = () => {
        if (studyPlace === 'Học Trên Learn') {
            window.open('https://learn.lhu.edu.vn', '_blank');
        } else if (schedule.OnlineLink) {
            window.open(schedule.OnlineLink, '_blank');
        }
    };

    return (
        <Card
            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-primary/60 ${getCardAccent(
                cancelType,
                isNext,
                isExam
            )}`}
        >
            {/* Banner */}
            {isNext && !isExam && !canceled && (
                <CardBanner icon={Clock}>
                    Tiết tiếp theo • Bắt đầu sau: {countdown}
                </CardBanner>
            )}
            {isExam && !canceled && (
                <CardBanner icon={PiExam as unknown as LucideIcon}>
                    {isNext
                        ? `Lịch thi • Bắt đầu sau: ${countdown}`
                        : 'Lịch thi sắp tới — chuẩn bị thật tốt!'}
                </CardBanner>
            )}

            <CardContent className="p-3 sm:p-4 transition-all">
                {/* Header: title + status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-2 leading-snug cursor-help">
                                        {schedule.TenMonHoc}
                                    </h3>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    className="max-w-xs"
                                >
                                    <p className="text-sm">
                                        {schedule.TenMonHoc}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Badge
                        className={`${status.badgeClass} px-2 py-1 text-[11px] sm:text-xs font-medium whitespace-nowrap shadow-sm flex items-center gap-1`}
                    >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </Badge>
                </div>

                {/* Meta row: day, date, badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-foreground">
                        <Calendar className="h-3 w-3" />
                        {getDayName(schedule.Thu)}
                    </span>
                    <span className="text-muted-foreground">
                        {formatDate(schedule.ThoiGianBD)}
                    </span>

                    {tinhTrangInfo.flagText && (
                        <Badge
                            className={`${
                                tinhTrangInfo.badgeClassName ?? ''
                            } px-2 py-0.5 text-[11px] rounded-full`}
                        >
                            {tinhTrangInfo.flagText}
                        </Badge>
                    )}
                    {duplicate.isDuplicate && (
                        <Badge className="bg-[#fab387] text-[#1e1e2e] px-2 py-0.5 text-[11px] rounded-full">
                            {duplicate.schedules.length - 1} trùng
                        </Badge>
                    )}
                    {isExam && (
                        <Badge className="bg-[#cba6f7] text-[#1e1e2e] px-2 py-0.5 text-[11px] rounded-full">
                            Thi
                        </Badge>
                    )}
                    <Badge className="bg-muted text-muted-foreground px-2 py-0.5 text-[11px] rounded-full">
                        {schedule.Type === 0 ? 'LT' : 'TH'}
                    </Badge>
                </div>

                {/* Time highlight */}
                <div className="mb-3 px-3 py-2 rounded-lg bg-primary/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Clock className="h-4 w-4 text-foreground flex-shrink-0" />
                        <div className="text-base sm:text-lg font-bold text-foreground tabular-nums truncate">
                            {formatTime(schedule.ThoiGianBD)} –{' '}
                            {formatTime(schedule.ThoiGianKT)}
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {minutesToHourMinute(schedule.SoTietBuoi)}
                    </span>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <InfoRow
                        icon={MapPin}
                        label="Phòng"
                        value={schedule.TenPhong}
                        tooltip={schedule.TenPhong}
                    />
                    <InfoRow
                        icon={Building}
                        label="Cơ sở"
                        value={studyPlace}
                        tooltip={schedule.TenCoSo}
                    />
                    <InfoRow
                        icon={User}
                        label="Giảng viên"
                        value={schedule.GiaoVien}
                        tooltip={schedule.GiaoVien}
                    />
                    <InfoRow
                        icon={BookOpen}
                        label="Nhóm"
                        value={schedule.TenNhom}
                        tooltip={schedule.TenNhom}
                        valueRef={groupRef}
                        valueClassName={
                            shouldMarquee
                                ? 'animate-marquee'
                                : 'truncate'
                        }
                    />

                    {forecast && (
                        <InfoRow
                            iconNode={
                                <img
                                    src={
                                        forecast.condition?.icon
                                            ? forecast.condition.icon.startsWith(
                                                  'http'
                                              )
                                                ? forecast.condition.icon
                                                : `https:${forecast.condition.icon}`
                                            : '/favicon.svg'
                                    }
                                    alt="weather"
                                    className="w-5 h-5"
                                />
                            }
                            label="Thời tiết"
                            value={`${forecast.temp_c}°C • ${
                                forecast.condition?.text ?? '—'
                            }`}
                        />
                    )}

                    {!forecast && (
                        <InfoRow
                            icon={Cloud}
                            label="Thời tiết"
                            value={
                                <span className="text-muted-foreground italic">
                                    —
                                </span>
                            }
                        />
                    )}
                </div>

                {/* Duplicate warning */}
                {duplicate.isDuplicate && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-[#fab387]/10 border border-[#fab387]/30 text-xs">
                        <AlertTriangle className="h-4 w-4 text-[#fab387] flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-[#df8e1d] dark:text-[#fab387]">
                                Cảnh báo lịch trùng (
                                {duplicate.schedules.length - 1} lịch khác)
                            </div>
                            {duplicate.status?.statusText && (
                                <div className="text-[#df8e1d] dark:text-[#fab387] mt-0.5">
                                    {duplicate.status.statusText}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {(schedule.GoogleMap || schedule.OnlineLink) && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-border">
                        {schedule.GoogleMap && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    window.open(schedule.GoogleMap, '_blank')
                                }
                                className="flex-1 group/btn"
                            >
                                <MapPin className="h-4 w-4 mr-1.5" />
                                Bản đồ
                                <ExternalLink className="h-3.5 w-3.5 ml-1.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                        )}
                        {schedule.OnlineLink && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleOnlineClick}
                                className="flex-1 group/btn"
                            >
                                {studyPlace === 'Học Trên Learn' ? (
                                    <BookOpen className="h-4 w-4 mr-1.5" />
                                ) : (
                                    <Video className="h-4 w-4 mr-1.5" />
                                )}
                                Online
                                <ExternalLink className="h-3.5 w-3.5 ml-1.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Memoization                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const areEqual = (prev: ScheduleCardProps, next: ScheduleCardProps) => {
    if ((prev.isNext ?? false) !== (next.isNext ?? false)) return false;
    if (prev.allSchedules !== next.allSchedules) return false;
    const a = prev.schedule;
    const b = next.schedule;
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
