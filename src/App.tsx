import { StudentSchedule } from './components/StudentSchedule';
import LoginPage from './components/LoginPage';
import './App.css';
import { Routes, Route } from 'react-router-dom';

function App() {
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
      <Route path="*" element={<StudentSchedule />} />
    </Routes>
  );
}

export default App;