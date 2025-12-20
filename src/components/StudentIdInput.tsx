import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, History, X, Clock, GraduationCap, Sparkles } from 'lucide-react';
import { LocalStorageService } from '@/services/localStorageService';
import { AuthStorage } from '@/types/user';
import { Link } from 'react-router-dom';

interface StudentIdInputProps {
  onSubmit: (studentId: string) => void;
  loading: boolean;
}

export const StudentIdInput: React.FC<StudentIdInputProps> = ({ onSubmit, loading }) => {
  const [studentId, setStudentId] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loggedInUser = useMemo(() => AuthStorage.getUser(), []);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadHistory = () => {
    const savedHistory = LocalStorageService.getStudentIdHistory();
    setHistory(savedHistory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      LocalStorageService.addStudentIdToHistory(studentId.trim());
      onSubmit(studentId.trim());
      setShowHistory(false);
      loadHistory();
    }
  };

  const handleHistorySelect = (id: string) => {
    setStudentId(id);
    onSubmit(id);
    setShowHistory(false);
  };

  const removeFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    LocalStorageService.removeFromHistory(id);
    loadHistory();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enhanced Input Container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center p-2 gap-2">
              <div className="flex-1 relative w-full">
          <Input
            ref={inputRef}
            type="text"
            inputMode='numeric'
            pattern='[0-9]*'
            placeholder="Nhập mã sinh viên..."
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="border-0 shadow-none text-base sm:text-lg py-3 sm:py-4 px-4 sm:px-6 bg-transparent focus:ring-0 focus-visible:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            disabled={loading}
            minLength={9}
            maxLength={9}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
              </div>
              
              <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto ml-0 sm:ml-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          disabled={loading || !studentId.trim()}
              >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm sm:text-base">Đang tìm...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Tìm kiếm</span>
            </div>
          )}
              </Button>
              {loggedInUser?.UserID ? (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto ml-0 sm:ml-2"
                  disabled={loading}
                  onClick={() => onSubmit(loggedInUser.UserID)}
                >
                  Lấy lịch của tôi
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto ml-0 sm:ml-2"
                >
                  <Link to="/login">Đăng nhập</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* History Dropdown */}
        {showHistory && history.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 p-4 shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md z-50 rounded-2xl">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3 px-2">
              <History className="h-4 w-4" />
              <span className="font-medium">Lịch sử tìm kiếm</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {history.length} mục
              </Badge>
            </div>
            <div className="space-y-2">
              {history.map((id, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl cursor-pointer group transition-all duration-200"
                  onClick={() => handleHistorySelect(id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-mono text-gray-700 dark:text-gray-200">{id}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/30"
                    onClick={(e) => removeFromHistory(id, e)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </form>

      {/* Info Badge */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <Badge variant="outline" className="text-xs font-medium">
           { navigator.onLine ? "Dữ liệu được lưu cache trong 30 phút" : "Bạn đang ngoại tuyến"}
          </Badge>
        </div>
      </div>
    </div>
  );
};