import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, User, Clock, ArrowLeft, GraduationCap, BookOpen, MapPin, Download, TestTubes, School } from 'lucide-react';
// Layouts
import { StudentIdInput } from './StudentIdInput';
import { ScheduleCard } from './ScheduleCard';
import { EmptySchedule } from './EmptySchedule';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { StatsCard } from './StatsCard';
import { Layout } from './Layout';
// Others
import { ApiService } from '@/services/apiService';
import { cacheService } from '@/services/cacheService';
import { ApiResponse, ExamInfo } from '@/types/schedule';
import { formatDate, getNextClass, hasClassesInNext7Days, isWithinNext7Days, getRealtimeStatus } from '@/utils/dateUtils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Timetable } from './Timetable';
import type { WeatherCurrentAPIResponse } from '@/types/weather';

// Pages
import WeatherPage from '@/components/WeatherPage';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthStorage } from '@/types/user';
import { MarkPage } from './StudentMark';
import { examCacheService } from '@/services/examCacheService';
import { ExamCard } from './ExamCard';
import { LmsDiemDanhPage } from './LmsDiemDanhPage';
import { authService } from '@/services/authService';
import { QRScanner } from './LmsQr';
import ParkingLHUPage from './ParkingLHU'
import SettingsPage from './Setting';

export const StudentSchedule: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ApiResponse | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState("home"); // synced with URL
  const [showEnded, setShowEnded] = useState(false); // mặc định không hiển thị lớp đã kết thúc
  const [currentWeather, setCurrentWeather] = useState<WeatherCurrentAPIResponse | null>(null);
  const [avatar, setAvatar] = useState("")
  const user = AuthStorage.getUser()

  // Exam state
  const [exams, setExams] = useState<ExamInfo[] | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

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

  // Sync page state with URL on first load and when pathname changes
  useEffect(() => {
    const path = location.pathname;
    if (path === "/home") {
      setPage("home");
    } else if (path.startsWith("/schedule")) {
      setPage("schedule");
    } else if (path.startsWith("/timetable")) {
      setPage("timetable");
    } else if (path.startsWith("/weather")) {
      setPage("weather");
    } else if (path.startsWith("/mark")) {
      setPage("mark")
    } else if (path.startsWith("/diemdanh")) {
      setPage("diemdanh")
    } else if (path.startsWith("/qrscan")) {
      setPage("qrscan")
    } else if (path.startsWith("/parking")) {
      setPage("parkinglhu")
    } else if (path.startsWith("/settings")) {
      setPage("settings")
    }
    else {
      setPage("home");
    }
  }, [location.pathname || currentStudentId]);

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

  const fetchSchedule = useCallback(async (studentId: string, useCache = true) => {
    setLoading(true);
    setError(null);
    
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

  const handleBackToInput = () => {
    setScheduleData(null);
    setCurrentStudentId('');
    setShowFullSchedule(false);
    setError(null);
    setPage("home");
    navigate("/home");
  };

  const handleRefresh = () => {
    if (currentStudentId) {
      fetchSchedule(currentStudentId, false);
      fetchPrivateExam(currentStudentId);
    }
  };

  const handleChangeView = (newPage: string) => {
    if (newPage === "home") {
      setPage("home");
      setShowFullSchedule(false);
      navigate("/home");
    } else if (newPage === "schedule") {
      setPage("schedule");
      setShowFullSchedule(true);
      navigate("/schedule");
    } else if (newPage === "timetable") {
      setPage("timetable");
      setShowFullSchedule(false);
      navigate("/timetable");
    } else if (newPage === "weather") {
      setPage("weather");
      setShowFullSchedule(false);
      navigate("/weather");
    } else if (newPage === "mark") {
      setPage("mark")
      setShowFullSchedule(false);
      navigate("/mark")
    } else if (newPage === "diemdanh") {
      setPage("diemdanh")
      setShowFullSchedule(false);
      navigate("/diemdanh")
    } else if (newPage === "qrscan") {
      setPage("qrscan")
      setShowFullSchedule(false)
      navigate("/qrscan")
    } else if (newPage === "parkinglhu") {
      setPage("parkinglhu")
      navigate("/parking")
    } else if (newPage === "settings") {
      setPage("settings")
      navigate("/settings")
    }
  };

  // Ưu tiên hiển thị trang Điểm để không bị chặn bởi các nhánh !scheduleData hoặc error
  if (page === "mark") {
    return (
      <Layout
        showBack={true}
        onBack={() => handleChangeView('schedule')}
        page={page}
        onPageChange={handleChangeView}
        title="Điểm thi"
      >
        <div className="min-h-screen py-6 sm:py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <MarkPage onBackToSchedule={() => handleChangeView('schedule')} />
          </div>
        </div>
      </Layout>
    );
  }
  if (page === "diemdanh") {
    return (
      <Layout
        showBack={true}
        onBack={() => handleChangeView('schedule')}
        page={page}
        onPageChange={handleChangeView}
        title="Điểm danh"
      >
        <div className="min-h-screen py-6 sm:py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <LmsDiemDanhPage />
          </div>
        </div>
      </Layout>
    )
  } 

  if (page === "qrscan") {
    return (
      <Layout
        showBack={true}
        onBack={() => handleChangeView('schedule')}
        page={page}
        onPageChange={handleChangeView}
        title="Quét mã điểm danh"
      >
        <div className="flex justify-center items-start px-4">
          <QRScanner />
        </div>
      </Layout>
    )
  }

  if (page === "parkinglhu") {
    return (
      <Layout 
        showBack={true}
        onBack={() => handleChangeView('schedule')}
        page={page}
        onPageChange={handleChangeView}
        title='Quản lý đỗ xe LHU'
      >
        <div className="flex justify-center items-start w-full">
          <ParkingLHUPage />
        </div>
      </Layout>
    )
  }

  if (page === "settings") {
    return (
      <Layout
        showBack={true}
        onBack={handleBackToInput}
        page={page}
        onPageChange={handleChangeView}
      >
        <div className="min-h-screen py-8 px-4">
          <SettingsPage />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout
        showBack={true}
        onBack={handleBackToInput}
        page={page}
        onPageChange={handleChangeView}
        title="Đã xảy ra sự cố"
      >
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <Button
                onClick={handleBackToInput}
                variant="ghost"
                className="mb-4 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </div>
            <ErrorMessage message={error} onRetry={handleRetry} />
          </div>
        </div>
      </Layout>
    );
  }

  if (!scheduleData ) {
    return (
      <Layout
        page={page}
        onPageChange={handleChangeView}
        title="Home"
      >
        <div className="min-h-screen py-6 sm:py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3 sm:mb-4">
                LHU Dashboard
              </h1>
              <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Tra cứu lịch học nhanh chóng
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <StudentIdInput onSubmit={async (id) => { await fetchSchedule(id); await fetchPrivateExam(id); }} loading={loading} />
              </div>
            )}
          </div>
        </div>
      </Layout>
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
    <Layout
      showBack={true}
      showRefresh={true}
      onBack={handleBackToInput}
      onRefresh={handleRefresh}
      page={page}
      onPageChange={handleChangeView}
      title="Lịch học"
    >
      <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

        {/* Student Info Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-xl bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
          {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div> */}
          <CardHeader className="relative pb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    {avatar ? <img src={avatar} alt='avatar' onError={() => setAvatar("")} /> : <User className="h-8 w-8 text-white" /> }
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <CardTitle className="text-left text-xl sm:text-2xl text-gray-900 dark:text-white mb-2">
                    {studentInfo?.HoTen || 'Không có thông tin'}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Mã SV: <span className="font-mono font-semibold">{currentStudentId}</span>
                    </span>
                  </div>
                  {user && user.UserID === currentStudentId && 
                      <>
                        <div className='flex flex-wrap gap-1 text-sm'>
                          <TestTubes className='h-4 w-4' />
                          Thuộc: <span className='font-mono font-semibold'>{user.DepartmentName}</span>
                        </div>
                        <div className='flex flex-wrap gap-1 text-sm'>
                          <School className='h-4 w-4' />
                          Lớp: <span className='font-mono font-semibold'>{user.Class}</span>
                        </div>
                      </>
                  } 
                </div>
              </div>

              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>Kì học hiện tại</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {weekInfo?.TuanBD && formatDate(weekInfo.TuanBD)} - {weekInfo?.TuanKT && formatDate(weekInfo.TuanKT)}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className={`relative ${page!=="home" && page!=="schedule" && ("hidden")}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <StatsCard
                title="Tổng số tiết"
                value={weekInfo?.TotalRecord ?? 0}
                icon={BookOpen}
                color="blue"
                description="Tiết học còn lại trong kì"
              />
              
              {nextClass && (
                <StatsCard
                  title="Tiết tiếp theo"
                  value={formatDate(nextClass.ThoiGianBD)}
                  icon={Clock}
                  color="green"
                  description="Ngày có tiết học tiếp theo"
                />
              )}
              
              <StatsCard
                title="Trạng thái"
                value={hasUpcomingClasses ? "Có lịch" : "Không có lịch"}
                icon={CalendarDays}
                color={hasUpcomingClasses ? "purple" : "orange"}
                description={hasUpcomingClasses ? "Trong 7 ngày tới" : "Trong 7 ngày tới"}
              />
            </div>
          </CardContent>
          <CardFooter className="w-full">
            {currentWeather && (
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 min-h-[72px] w-full">
                <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center">
                  {/* icon ảnh từ API */}
                  <img
                    src={(currentWeather.current.condition.icon || '').startsWith('http') ? currentWeather.current.condition.icon : `https:${currentWeather.current.condition.icon}`}
                    alt="weather"
                    className="w-7 h-7"
                  />
                </div>
                <div className="min-w-0 text-center w-full">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Thời tiết hiện tại</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                    {currentWeather.current.temp_c}°C • {currentWeather.current.condition.text}
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Schedule Display */}
        {page === "timetable" ? (
          <Timetable 
            schedules={schedules} 
            studentName={studentInfo?.HoTen}
            exams={exams || []}
            examDurationMinutes={120}
          />
        ) : page === "weather" ? (
          <WeatherPage onBackToSchedule={() => handleChangeView('schedule')} />
        ) : page === "mark" ? (
          <MarkPage />
        ) : !hasUpcomingClasses && !showFullSchedule ? (
          <EmptySchedule onViewFullSchedule={handleChangeView} />
        ) : (
          <>
            {/* Exam section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Lịch thi riêng</h3>
                <Button variant="outline" size="sm" onClick={() => currentStudentId && fetchPrivateExam(currentStudentId)} disabled={loadingExam}>
                  Tải lại
                </Button>
              </div>
              {loadingExam ? (
                <div className="flex justify-center mb-4"><LoadingSpinner /></div>
              ) : examError ? (
                <ErrorMessage message={examError} onRetry={() => currentStudentId && fetchPrivateExam(currentStudentId)} />
              ) : exams && exams.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {exams.map((ex, idx) => (
                    <ExamCard key={idx} exam={ex} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Không có lịch thi riêng.</p>
              )}
            </div>
            {/* Toggle View Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3 sm:gap-4 flex-wrap sm:flex-nowrap min-w-0">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {showFullSchedule ? 'Lịch học đầy đủ' : 'Lịch học 7 ngày tới'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {displaySchedules.length} tiết được tìm thấy
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap gap-y-2">
                <Button
                  onClick={() => handleChangeView(showFullSchedule ? "home" : "schedule")}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors shrink-0 min-w-[180px] sm:min-w-[200px]"
                >
                  {showFullSchedule ? 'Xem lịch 7 ngày tới' : 'Xem lịch đầy đủ'}
                </Button>
                {displaySchedules.length > 0 && (
                  <Button
                    onClick={handleExportICS}
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 min-w-[180px] sm:min-w-[200px]"
                  >
                    <Download className="h-4 w-4 mr-2" /> Xuất lịch học
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
                <Card className="text-center py-16 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent>
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">Không có lịch học nào</p>
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
    </Layout>
  );
};