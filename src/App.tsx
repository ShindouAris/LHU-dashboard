import { StudentSchedule } from './components/StudentSchedule';
import LoginPage from './components/LoginPage';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

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
          hardwareAcceleration: boolean
        }>;
      forceRestartApp: () => void;

      // Settings setters
      setAutoStart: (enabled: boolean) => void;
      setCheckForUpdatesOnStart: (enabled: boolean) => void;
      setMinimizeToTray: (enabled: boolean) => void;
      setNotifyNextClassStartedSoon: (enabled: boolean) => void;
      setMinimizeOnClose: (enabled: boolean) => void;
      setHardwareAcceleration: (enabled: boolean) => void;
    };
  }
}


function App() {

  useEffect(() => {
    if (window?.electron) {
      window.electron.onGetLocalStorage();
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<StudentSchedule />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/schedule" element={<StudentSchedule />} />
      <Route path="/timetable" element={<StudentSchedule />} />
      <Route path="/weather" element={<StudentSchedule />} />
      <Route path='/diemdanh' element={<StudentSchedule />} />
      <Route path='/mark' element={<StudentSchedule />} />
      <Route path='/qrscan' element={<StudentSchedule/>}/>
      <Route path='/parking' element={<StudentSchedule />} />
      <Route path='/settings' element={<StudentSchedule />} />
      <Route path='/diemrenluyen' element={<StudentSchedule />} />
      <Route path='/thuvien' element={<StudentSchedule />} />
      <Route path="*" element={<StudentSchedule />} />
    </Routes>
  );
}

export default App;