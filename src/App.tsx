import { useEffect, lazy, Suspense } from 'react';
import { StudentSchedule } from './components/StudentSchedule';
const LoginPage = lazy(() => import('./components/LoginPage'));
const WeatherPage = lazy(() => import('./components/WeatherPage'));
const Timetable = lazy(() => import('./components/Timetable'));
const MarkPage = lazy(() => import('./components/StudentMark'));
const LmsDiemDanhPage = lazy(() => import('./components/LmsDiemDanhPage'));
const QRScanner = lazy(() => import('./components/LmsQr'));
const ParkingLHUPage = lazy(() => import('./components/ParkingLHU'));
const SettingsPage = lazy(() => import('./components/Setting'));
const DiemRL = lazy(() => import('./components/DiemRL'));
const Elib = lazy(() => import('./components/Elib'));
const ToolLHU = lazy(() => import('./components/ToolLHU'));
const ChisaAI = lazy(() => import('./components/ChisaAI'));
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Chat } from './components/Chat';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LHU_UI/LoadingScreen';

declare global {
  interface Window {
    electron: {
      // Variables
      isElectron: boolean;

      // Callbacks
      onGetLocalStorage: () => void;
      getSettings: () => Promise<{
          autoStart: boolean, 
          minimizeToTray: boolean, 
          checkForUpdatesOnStart: boolean, 
          notifyNextClassStartedSoon: boolean,
          minimizeOnClose: boolean,
          hardwareAcceleration: boolean,
          useDiscordRpc: boolean
        }>;
      forceRestartApp: () => void;
      loggedOffUser: () => void;

      // Settings setters
      setAutoStart: (enabled: boolean) => void;
      setCheckForUpdatesOnStart: (enabled: boolean) => void;
      setMinimizeToTray: (enabled: boolean) => void;
      setNotifyNextClassStartedSoon: (enabled: boolean) => void;
      setMinimizeOnClose: (enabled: boolean) => void;
      setHardwareAcceleration: (enabled: boolean) => void;
      setUseDiscordRpc: (enabled: boolean) => void;
    };
    ReactNativeWebView: {
      postMessage: (message: string) => any;
    }
  }
  
}

// Page title mapping
const pageTitles: Record<string, string> = {
  '/': 'Trang chủ',
  '/home': 'Trang chủ',
  '/schedule': 'Lịch học',
  '/timetable': 'Thời khóa biểu',
  '/weather': 'Thời tiết',
  '/mark': 'Điểm thi',
  '/diemdanh': 'Điểm danh',
  '/qrscan': 'Quét mã điểm danh',
  '/parking': 'Quản lý đỗ xe LHU',
  '/settings': 'Cài đặt',
  '/diemrenluyen': 'Điểm rèn luyện',
  '/thuvien': 'Quản lý thư viện',
  '/toollhu': 'Công cụ LHU',
  '/chisaAI': 'Chisa AI',
  '/chat': 'Trò chuyện',
  '/login': 'Đăng nhập',
};

function App() {
  const location = useLocation();

  useEffect(() => {
    if (window?.electron) {
      window.electron.onGetLocalStorage();
    }
  }, []);

  // Get current page title based on pathname
  const getCurrentTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/toollhu')) return 'Công cụ LHU';
    if (path.startsWith('/chisaAI')) return 'Chisa AI';
    return pageTitles[path] || 'CalendarLHU';
  };

  // Routes that don't need Layout wrapper
  const noLayoutRoutes = ['/login', '/chat'];
  const shouldShowLayout = !noLayoutRoutes.includes(location.pathname);

  return shouldShowLayout ? (
    <Layout title={getCurrentTitle()}>
      <Routes>
        <Route path="/" element={<StudentSchedule />} />
        <Route path="/home" element={<StudentSchedule />} />
        <Route path="/schedule" element={<StudentSchedule />} />
        <Route path="/timetable" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-6 sm:py-8 px-4">
              <div className="max-w-6xl mx-auto">
                <Timetable schedules={[]} studentName="" exams={[]} examDurationMinutes={120} />
              </div>
            </div>
          </Suspense>
        } />
        <Route path="/weather" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-6 sm:py-8 px-4">
              <div className="max-w-6xl mx-auto">
                <WeatherPage />
              </div>
            </div>
          </Suspense>
        } />
        <Route path="/mark" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-6 sm:py-8 px-4">
              <div className="max-w-6xl mx-auto">
                <MarkPage />
              </div>
            </div>
          </Suspense>
        } />
        <Route path="/diemdanh" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-6 sm:py-8 px-4">
              <div className="max-w-6xl mx-auto">
                <LmsDiemDanhPage />
              </div>
            </div>
          </Suspense>
        } />
        <Route path="/qrscan" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="flex justify-center items-start px-4">
              <QRScanner />
            </div>
          </Suspense>
        } />
        <Route path="/parking" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="flex justify-center items-start w-full">
              <ParkingLHUPage />
            </div>
          </Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-8 px-4">
              <SettingsPage />
            </div>
          </Suspense>
        } />
        <Route path="/diemrenluyen" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-8 px-4">
              <DiemRL />
            </div>
          </Suspense>
        } />
        <Route path="/thuvien" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-8 px-4">
              <Elib />
            </div>
          </Suspense>
        } />
        <Route path="/toollhu/*" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="min-h-screen py-8 px-4">
              <ToolLHU />
            </div>
          </Suspense>
        } />
        <Route path="/chisaAI/*" element={
          <Suspense fallback={<LoadingScreen loading={true} />}>
            <div className="py-8 px-4">
              <ChisaAI />
            </div>
          </Suspense>
        } />
        <Route path="*" element={<StudentSchedule />} />
      </Routes>
    </Layout>
  ) : (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<div>Loading...</div>}>
          <LoginPage />
        </Suspense>
      } />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
}

export default App;