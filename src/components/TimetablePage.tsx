import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Timetable from './Timetable';
import { StudentIdInput } from './StudentIdInput';
import { ErrorMessage } from './LHU_UI/ErrorMessage';
import { ApiService } from '@/services/apiService';
import { cacheService } from '@/services/cacheService';
import { examCacheService } from '@/services/examCacheService';
import { ApiResponse, ExamInfo } from '@/types/schedule';
import { AuthStorage } from '@/types/user';
import { GraduationCap } from 'lucide-react';
import GradientText from './ui/GradientText';

export const TimetablePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ApiResponse | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  const [exams, setExams] = useState<ExamInfo[] | null>(null);

  useEffect(() => {
    cacheService.init();
  }, [AuthStorage.getUser()?.UserID]);

  // Auto-load schedule if user is logged in
  useEffect(() => {
    if (AuthStorage.isLoggedIn() && AuthStorage.getUser()?.UserID) {
      const userid = AuthStorage.getUser()?.UserID;
      fetchSchedule(String(userid));
      fetchPrivateExam(String(userid));
    }
  }, []);

  const fetchSchedule = useCallback(async (studentId: string, useCache = true) => {
    setLoading(true);
    setError(null);

    if (!/^\d+$/.test(studentId)) {
      toast.error('Mã sinh viên không hợp lệ. Vui lòng chỉ nhập chữ số.');
      setLoading(false);
      return;
    }

    try {
      const hasnet = await ApiService.testnet();
      
      if (useCache) {
        const cachedData = await cacheService.get(studentId, hasnet);
        if (cachedData) {
          setScheduleData(cachedData);
          setCurrentStudentId(studentId);
          setLoading(false);
          return;
        }
      }

      const apiRequest = {
        Ngay: new Date().toISOString(),
        PageIndex: 1,
        PageSize: 300,
        StudentID: studentId
      };

      const response = await ApiService.getSchedule(apiRequest);
      await cacheService.set(studentId, response);
      
      setScheduleData(response);
      setCurrentStudentId(studentId);
      
      if (!navigator.onLine) {
        toast.error('Đang ngoại tuyến');
      }
    } catch (err) {
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

  const fetchPrivateExam = useCallback(async (studentId: string) => {
    try {
      const hasnet = await ApiService.testnet();
      const cached = await examCacheService.get(studentId, hasnet);
      
      if (cached) {
        setExams(cached);
        return;
      }

      const numericId = Number(studentId);
      if (!Number.isFinite(numericId)) {
        setExams(null);
        return;
      }

      const res = await ApiService.getPrivateExam(numericId);
      if (res && res.length > 0) {
        const list = Array.isArray(res) ? res : [res as unknown as ExamInfo];
        await examCacheService.set(studentId, list);
        setExams(list);
      } else {
        setExams([]);
      }
    } catch {
      try {
        const stale = await examCacheService.getStale(studentId);
        if (stale) {
          setExams(stale);
        }
      } catch {
        // Ignore exam loading errors
      }
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3 sm:mb-4 font-loveHouse">
              <GradientText
                yoyo={false}
                animationSpeed={0.8}
                colors={["#F6B1CE", "#1581BF", "#3DB6B1", "#CCE5CF"]}
              >
                Thời khóa biểu
              </GradientText>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Xem lịch học theo dạng lịch
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-600 dark:text-gray-300">Đang tải...</div>
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

  const studentInfo = scheduleData?.data?.[0]?.[0];
  const schedules = scheduleData?.data?.[2] || [];

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Timetable 
          schedules={schedules}
          studentName={studentInfo?.HoTen}
          exams={exams || []}
          examDurationMinutes={120}
        />
      </div>
    </div>
  );
};

export default TimetablePage;
