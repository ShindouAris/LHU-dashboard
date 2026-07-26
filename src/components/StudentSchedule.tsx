import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
// Layouts
import { StudentIdInput } from './StudentIdInput';
import { ScheduleCard } from './LHU_UI/ScheduleCard';
import { EmptySchedule } from './LHU_UI/EmptySchedule';
import { ErrorMessage } from './LHU_UI/ErrorMessage';
// Interfaces & Helpers
import { ApiService } from '@/services/apiService';
import { cacheService } from '@/services/cacheService';
import { ApiResponse, ExamInfo } from '@/types/schedule';
import { formatDate, getNextClass, hasClassesInNext7Days, isWithinNext7Days, getRealtimeStatus } from '@/utils/dateUtils';
import type { WeatherCurrentAPIResponse } from '@/types/weather';
import { examCacheService } from '@/services/examCacheService';
import { authService } from '@/services/authService';
import { AuthStorage } from '@/types/user';
// Shadcn UI Components
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExamCard } from './LHU_UI/ExamCard';
// Icons
import { PiExamDuotone } from 'react-icons/pi';
import { CalendarDays, User, GraduationCap, BookOpen, MapPin, Download, TestTubes, School, QrCode, CloudSun, Car, Award, Library, Wrench, ClipboardList } from 'lucide-react';
import GradientText from './ui/GradientText';


export const StudentSchedule: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ApiResponse | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [showEnded, setShowEnded] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<WeatherCurrentAPIResponse | null>(null);
  const [avatar, setAvatar] = useState("");
  const user = AuthStorage.getUser();

  // Exam state
  const [exams, setExams] = useState<ExamInfo[] | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  // Determine if we should show full schedule based on route
  useEffect(() => {
    if (location.pathname === '/schedule') {
      setShowFullSchedule(true);
    } else {
      setShowFullSchedule(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    cacheService.init();
  }, [AuthStorage.getUser()?.UserID]);

  // lấy lịch của mình luôn
  useEffect(() => {
    
    if (AuthStorage.isLoggedIn() && AuthStorage.getUser()?.UserID ) {
      const userid = AuthStorage.getUser()?.UserID
      fetchSchedule(String(userid))
      fetchPrivateExam(String(userid))
      console.log("Lấy id sinh viên thành công")
    }
  }, []) // mount thì chạy 1 lần fr

  useEffect(() => {
    getAvatar();
  }, [])
  
  const getAvatar = () => {
    const isLogin = AuthStorage.isLoggedIn()
    if (isLogin) {
      const user  = AuthStorage.getUser()
      if (user?.Avatar) {
        setAvatar(user.Avatar)
      }
    }
  }

  useEffect(() => {
    const fetchCurrentWeather = async () => {
      try {
        const data = await ApiService.get_current_weather();
        setCurrentWeather(data);
      } catch {
        // bỏ qua lỗi thời tiết để không ảnh hưởng trải nghiệm
      }
    };
    fetchCurrentWeather();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const access_token = localStorage.getItem("access_token");
      if (!access_token) return;
  
      try {
        const userinfo = await authService.getUserInfo();
        AuthStorage.setUser(userinfo);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Phiên đã hết hạn")) {
          AuthStorage.deleteUser();
          toast.error("Phiên đã hết hạn, vui lòng đăng nhập lại");
        }
      }
    };
  
    initAuth();
  }, []);

  const quickNavigationItems = [
    {
      id: "diemdanh",
      label: "Điểm danh",
      icon: ClipboardList,
      description: "Xem thông tin điểm danh (cần đăng nhập)",
      path: "/diemdanh"
    },
    {
      id: "mark",
      label: "Điểm thi",
      icon: PiExamDuotone,
      description: "Xem điểm thi của bạn (cần đăng nhập)",
      path: "/mark"
    },
    {
      id: "qrscan",
      label: "Quét QR",
      icon: QrCode,
      description: "Quét QR điểm danh cho lớp của bạn (cần đăng nhập)",
      path: "/qrscan"
    },
    {
      id: "diemrenluyen",
      label: "Rèn luyện",
      icon: Award,
      description: "Xem điểm rèn luyện",
      path: "/diemrenluyen"
    },
    {
      id: "thuvien",
      label: "Thư viện",
      icon: Library,
      description: "Truy cập thư viện",
      path: "/thuvien"
    },
    {
      id: "parking",
      label: "Bãi xe",
      icon: Car,
      description: "Thông tin bãi xe",
      path: "/parking"
    },
    {
      id: "weather",
      label: "Thời tiết",
      icon: CloudSun,
      description: "Xem thời tiết",
      path: "/weather"
    },
    {
      id: "toollhu",
      label: "Tools",
      icon: Wrench,
      description: "Công cụ tiện ích",
      path: "/toollhu"
    }
  ];

  const fetchSchedule = useCallback(async (studentId: string, useCache = true) => {
    setLoading(true);
    setError(null);

    if (!/^\d+$/.test(studentId)) {
      toast.error('Mã sinh viên không hợp lệ. Vui lòng chỉ nhập chữ số.');
      setLoading(false);
      return;
    }
    
    try {
        const hasnet = await ApiService.testnet()
        // Check cache first
      if (useCache) {
        const cachedData = await cacheService.get(studentId, hasnet);
        if (cachedData) {
          setScheduleData(cachedData);
          setCurrentStudentId(studentId);
          setLoading(false);
          return;
        }
      }

      // Make API request
      const apiRequest = {
        Ngay: new Date().toISOString(),
        PageIndex: 1,
        PageSize: 300,
        StudentID: studentId
      };

      const response = await ApiService.getSchedule(apiRequest);
      
      // Cache the response
      await cacheService.set(studentId, response);
      
      setScheduleData(response);
      setCurrentStudentId(studentId);
      if (!navigator.onLine) {
        toast.error('Đang ngoại tuyến');
      }
    } catch (err) {
      // Thử fallback sang dữ liệu đã lưu (kể cả khi đã hết hạn) để hỗ trợ offline
      try {
        const stale = await cacheService.getStale(studentId);
        if (stale) {
          setScheduleData(stale);
          setCurrentStudentId(studentId);
          toast.error('Không thể kết nối máy chủ. Đang dùng dữ liệu đã lưu.');
        } else {
          setError(err instanceof Error ? err.message : 'Không thể tải lịch học');
        }
      } catch {
        setError(err instanceof Error ? err.message : 'Không thể tải lịch học');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Precompute schedule-related data early so hooks below are unconditional
  const studentInfo = scheduleData?.data?.[0]?.[0];
  const weekInfo = scheduleData?.data?.[1]?.[0];
  const schedules = scheduleData?.data?.[2] || [];

  const nextClass = getNextClass(schedules);
  const hasUpcomingClasses = hasClassesInNext7Days(schedules);

  const baseSchedules = showFullSchedule 
    ? schedules 
    : schedules.filter(schedule => isWithinNext7Days(schedule.ThoiGianBD));

  // Bỏ qua các lịch bị huỷ/báo nghỉ (TinhTrang 1 hoặc 2)
  // const activeSchedules = baseSchedules.filter(s => s.TinhTrang !== 1 && s.TinhTrang !== 2);

  const displaySchedules = baseSchedules.filter(s => {
    if (showEnded) return true;
    const status = getRealtimeStatus(s.ThoiGianBD, s.ThoiGianKT);
    return status !== 3; // ẩn các lớp đã kết thúc khi toggle OFF
  });

  // Incremental rendering to avoid mounting too many heavy cards
  const INITIAL_COUNT = 10;
  const LOAD_MORE_STEP = 10;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visibleCount when filters or data change
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [showFullSchedule, showEnded, scheduleData]);

  const visibleSchedules = useMemo(() => {
    return displaySchedules.slice(0, visibleCount);
  }, [displaySchedules, visibleCount]);

  // Auto-load more when scrolling near bottom using IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (visibleCount >= displaySchedules.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + LOAD_MORE_STEP, displaySchedules.length));
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 1.0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, displaySchedules.length]);

  const fetchPrivateExam = useCallback(async (studentId: string) => {
    setLoadingExam(true);
    setExamError(null);
    try {
        // TEST NET FIRST
      const hasnet = await ApiService.testnet()
      // Try cache first
      const cached = await examCacheService.get(studentId, hasnet);
      if (cached) {
        setExams(cached);
        setLoadingExam(false);
        return;
      }

      const numericId = Number(studentId);
      if (!Number.isFinite(numericId)) {
        setExams(null);
        setLoadingExam(false);
        return;
      }

      const res = await ApiService.getPrivateExam(numericId);
      if (res && res.length > 0) {
        const list = Array.isArray(res) ? res : [res as unknown as ExamInfo];
        await examCacheService.set(studentId, list);
        setExams(list);
      } else {
        // no exams
        setExams([]);
      }
    } catch {
      try {
        const stale = await examCacheService.getStale(studentId);
        if (stale) {
          setExams(stale);
          toast.error('Không thể tải lịch thi. Đang dùng dữ liệu thi đã lưu.');
        } else {
          setExamError('Không thể tải lịch thi');
        }
      } catch {
        setExamError('Không thể tải lịch thi');
      }
    } finally {
      setLoadingExam(false);
    }
  }, []);

  const handleRetry = () => {
    if (currentStudentId) {
      fetchSchedule(currentStudentId, false);
      fetchPrivateExam(currentStudentId);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <ErrorMessage message={error} onRetry={handleRetry} />
        </div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="min-h-screen py-6 sm:py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-section border-2 border-border rounded-md mb-6 shadow-brutal">
              <GraduationCap className="h-10 w-10 text-section-foreground" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-black text-foreground mb-3 sm:mb-4">
              <GradientText
                yoyo={false}
                animationSpeed={0.8}
                colors={["#F6B1CE", "#1581BF", "#3DB6B1", "#CCE5CF"]}
              >
                LHU Dashboard
              </GradientText>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tra cứu lịch học nhanh chóng
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">Đang tải...</div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <StudentIdInput 
                onSubmit={async (id) => { 
                  await fetchSchedule(id); 
                  await fetchPrivateExam(id); 
                }} 
                loading={loading} 
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // (đã chuyển tính toán schedule lên trên để tránh thay đổi thứ tự hooks)

  const buildICSDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const iso = d.toISOString();
      // 2025-08-28T12:00:00.000Z -> 20250828T120000Z
      const compact = iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      return compact.substring(0, 15) + 'Z';
    } catch {
      return '';
    }
  };

  const escapeText = (text: string): string => {
    return (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/, /g, '\\, ')
      .replace(/;/g, '\\;');
  };

  const generateICS = (items: typeof schedules): string => {
    const now = new Date().toISOString();
    const dtstamp = buildICSDate(now);
    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//LHU DASHBOARD//VN');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    const calName = `Lịch học ${studentInfo?.HoTen || ''}`.trim();
    if (calName) {
      lines.push(`X-WR-CALNAME:${escapeText(calName)}`);
    }

    items.forEach((ev, idx) => {
      const uid = `${ev.ID || idx}-${buildICSDate(ev.ThoiGianBD)}@lhu-dashboard`;
      const dtStart = buildICSDate(ev.ThoiGianBD);
      const dtEnd = buildICSDate(ev.ThoiGianKT);
      const summary = `${ev.TenMonHoc || ''}${ev.TenNhom ? ' - ' + ev.TenNhom : ''}`.trim();
      const location = ev.TenPhong || ev.OnlineLink || '';
      const descriptionParts = [
        ev.GiaoVien ? `Giảng viên: ${ev.GiaoVien}` : '',
        ev.TenCoSo ? `Cơ sở: ${ev.TenCoSo}` : '',
        ev.GoogleMap ? `Bản đồ: ${ev.GoogleMap}` : '',
        ev.OnlineLink ? `Link: ${ev.OnlineLink}` : '',
      ].filter(Boolean);
      const description = descriptionParts.join('\n');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      if (dtStart) lines.push(`DTSTART:${dtStart}`);
      if (dtEnd) lines.push(`DTEND:${dtEnd}`);
      if (summary) lines.push(`SUMMARY:${escapeText(summary)}`);
      if (location) lines.push(`LOCATION:${escapeText(location)}`);
      if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  };

  const handleExportICS = () => {
    try {
      const icsContent = generateICS(displaySchedules);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (studentInfo?.HoTen || currentStudentId || 'schedule')
        .toString()
        .replace(/[^\p{L}\p{N}_-]+/gu, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      a.download = `lich_hoc_${safeName || 'sinh_vien'}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Đã xuất tệp ICS, Bạn có thể nhập vào Google/Apple Calendar.');
    } catch (e) {
      toast.error('Xuất ICS thất bại');
      console.error(e)
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Student Info Card */}
        <Card className="mb-8 overflow-hidden border-2 border-border shadow-brutal bg-card rounded-md">
          <CardHeader className="relative pb-1">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-secondary border-2 border-border rounded-md flex items-center justify-center shadow-brutal-sm overflow-hidden">
                    {avatar ? <img src={avatar} alt='avatar' onError={() => setAvatar("")} /> : <User className="h-8 w-8 text-black" strokeWidth={2.5} /> }
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[hsl(142_71%_45%)] rounded-full border-2 border-border"></div>
                </div>
                <div>
                  <CardTitle className="text-left text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
                    {studentInfo?.HoTen || 'Không có thông tin'}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" strokeWidth={2.5} />
                      Mã SV: <span className="font-mono font-semibold text-foreground">{currentStudentId}</span>
                    </span>
                  </div>
                  {user && user.UserID === currentStudentId &&
                      <>
                        <div className='flex flex-wrap gap-1 text-sm text-muted-foreground'>
                          <TestTubes className='h-4 w-4' strokeWidth={2.5} />
                          Thuộc: <span className='font-mono font-semibold text-foreground'>{user.DepartmentName}</span>
                        </div>
                        <div className='flex flex-wrap gap-1 text-sm text-muted-foreground'>
                          <School className='h-4 w-4' strokeWidth={2.5} />
                          Lớp: <span className='font-mono font-semibold text-foreground'>{user.Class}</span>
                        </div>
                      </>
                  }
                </div>
              </div>

              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-2 text-sm text-muted-foreground mb-1">
                  <CalendarDays className="h-4 w-4" strokeWidth={2.5} />
                  <span>Kì học hiện tại</span>
                </div>
                <p className="font-bold text-foreground">
                  {weekInfo?.TuanBD && formatDate(weekInfo.TuanBD)} - {weekInfo?.TuanKT && formatDate(weekInfo.TuanKT)}
                </p>
              </div>
            </div>
          </CardHeader>
          
            <CardContent className="relative">
              <div className="flex items-center justify-center mb-3">
                <span className="relative text-xl sm:text-2xl font-display font-bold text-foreground font-Purrfect">
                  Quick Actions
                  <span className="absolute left-0 bottom-0 w-full h-0.5 bg-section"></span>
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
                {
                user && user.UserID === currentStudentId &&
                quickNavigationItems.map((item) => {
                  return (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    title={item.description}
                    onClick={() => navigate(item.path)}
                    className="h-auto w-full transition-colors flex flex-col items-center justify-center gap-1 px-1 py-2 sm:py-3 aspect-square sm:aspect-auto"
                    >
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" strokeWidth={2.5} />
                    <span className="font-bold text-[10px] sm:text-xs leading-tight text-center truncate w-full">{item.label}</span>
                    </Button>
                  )
                })
                }
              </div>
            </CardContent>
          <CardFooter className="w-full">
            {currentWeather && (
              <div className="flex items-center justify-center gap-3 p-3 rounded-md border-2 border-border bg-muted min-h-[72px] w-full">
                <div className="w-10 h-10 rounded-md border-2 border-border bg-secondary flex items-center justify-center">
                  {/* icon ảnh từ API */}
                  {currentWeather.current.condition?.icon && (
                    <img
                      src={(currentWeather.current.condition.icon || '').startsWith('http') ? currentWeather.current.condition.icon : `https:${currentWeather.current.condition.icon}`}
                      alt="weather"
                      className="w-7 h-7"
                    />
                  )}
                </div>
                <div className="min-w-0 text-center w-full">
                  <div className="text-xs text-muted-foreground">Thời tiết hiện tại</div>
                  <div className="text-sm sm:text-base font-bold text-foreground truncate">
                    {currentWeather.current.temp_c}°C • {currentWeather.current.condition?.text || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Schedule Display */}
        {!hasUpcomingClasses && !showFullSchedule ? (
          <EmptySchedule onViewFullSchedule={() => navigate('/schedule')} />
        ) : (
          <>
            {/* Exam section */}
            <div className={`mb-6 ${exams?.length !== undefined && exams?.length <= 0 && ("hidden")}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">Lịch thi riêng</h3>
                <Button variant="outline" size="sm" onClick={() => currentStudentId && fetchPrivateExam(currentStudentId)} disabled={loadingExam}>
                  Tải lại
                </Button>
              </div>
              {loadingExam ? (
                <div className="flex justify-center mb-4">
                  <div className="text-muted-foreground">Đang tải...</div>
                </div>
              ) : examError ? (
                <ErrorMessage message={examError} onRetry={() => currentStudentId && fetchPrivateExam(currentStudentId)} />
              ) : exams && exams.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {exams.map((ex, idx) => (
                    <ExamCard key={idx} exam={ex} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Không có lịch thi riêng.</p>
              )}
            </div>
            {/* Toggle View Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3 sm:gap-4 flex-wrap sm:flex-nowrap min-w-0">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-2">
                  {showFullSchedule ? 'Lịch học đầy đủ' : 'Lịch học 7 ngày tới'}
                </h2>
                <p className="text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" strokeWidth={2.5} />
                  {displaySchedules.length} tiết được tìm thấy
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap gap-y-2">
                <Button
                  onClick={() => navigate(showFullSchedule ? "/" : "/schedule")}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto transition-colors shrink-0 min-w-[180px] sm:min-w-[200px]"
                >
                  {showFullSchedule ? 'Xem lịch 7 ngày tới' : 'Xem lịch đầy đủ'}
                </Button>
                {displaySchedules.length > 0 && (
                  <Button
                    onClick={handleExportICS}
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto transition-colors shrink-0 min-w-[180px] sm:min-w-[200px]"
                  >
                    <Download className="h-4 w-4 mr-2" strokeWidth={2.5} /> Xuất lịch học
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch id="toggle-ended" checked={showEnded} onCheckedChange={setShowEnded} />
                <Label htmlFor="toggle-ended" className="whitespace-nowrap">Hiển thị lớp đã kết thúc</Label>
              </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-4 sm:space-y-6">
              {displaySchedules.length === 0 ? (
                <Card className="text-center py-16 border-2 border-border shadow-brutal bg-card rounded-md">
                  <CardContent>
                    <div className="w-16 h-16 bg-muted border-2 border-border rounded-md flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-foreground" strokeWidth={2.5} />
                    </div>
                    <p className="text-muted-foreground text-lg">Không có lịch học nào</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {visibleSchedules.map((schedule, index) => (
                    <ScheduleCard
                      key={schedule.ID || index}
                      schedule={schedule}
                      isNext={nextClass?.ID === schedule.ID}
                      allSchedules={schedules}
                    />
                  ))}
                  {visibleCount < displaySchedules.length && (
                    <div className="flex flex-col items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount(c => Math.min(c + LOAD_MORE_STEP, displaySchedules.length))}
                        className="w-full sm:w-auto"
                      >
                        Tải thêm
                      </Button>
                      <div ref={sentinelRef} className="h-1 w-full opacity-0" />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};