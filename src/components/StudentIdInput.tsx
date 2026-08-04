import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, History, X, Clock, GraduationCap, Sparkles } from 'lucide-react';
import { LocalStorageService } from '@/services/localStorageService';
import { AuthStorage } from '@/types/user';
import { Link } from 'react-router-dom';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';

interface StudentIdInputProps {
  onSubmit: (studentId: string) => void;
  loading: boolean;
}

export const StudentIdInput: React.FC<StudentIdInputProps> = ({ onSubmit, loading }) => {
  const [studentId, setStudentId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
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
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadHistory = () => {
    const savedHistory = LocalStorageService.getStudentIdHistory();
    setHistory(savedHistory);
    if (savedHistory.length === 0) {
      setShowHistory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{9}$/.test(studentId)) {
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="student-id" className="sr-only">
              Mã sinh viên
            </FieldLabel>
            <div className="relative overflow-hidden rounded-md border-2 border-border bg-card shadow-brutal">
              <div className="flex flex-col items-center gap-2 p-2 sm:flex-row">
                <div className="relative w-full flex-1">
                  <Input
                    id="student-id"
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{9}"
                    autoComplete="off"
                    aria-describedby="student-id-description"
                    placeholder="Nhập mã sinh viên..."
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="border-0 bg-transparent px-4 py-3 text-base shadow-none placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 sm:px-6 sm:py-4 sm:text-lg"
                    disabled={loading}
                    minLength={9}
                    maxLength={9}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <GraduationCap className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" strokeWidth={2.5} />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:ml-2 sm:w-auto"
                  disabled={loading || !/^\d{9}$/.test(studentId)}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="text-sm sm:text-base">Đang tìm...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                      <span className="text-sm sm:text-base">Tìm kiếm</span>
                    </span>
                  )}
                </Button>

                {loggedInUser?.UserID ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="w-full sm:ml-2 sm:w-auto"
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
                    className="w-full sm:ml-2 sm:w-auto"
                  >
                    <Link to="/login">Đăng nhập</Link>
                  </Button>
                )}
              </div>
            </div>
            <FieldDescription id="student-id-description" className="px-1 text-center sm:text-left">
              Mã sinh viên gồm 9 chữ số.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>

      {history.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-center"
            aria-expanded={showHistory}
            aria-controls="student-id-history"
            onClick={() => setShowHistory((current) => !current)}
          >
            <History data-icon="inline-start" />
            {showHistory ? 'Ẩn lịch sử tìm kiếm' : 'Xem lịch sử tìm kiếm'}
          </Button>

          {showHistory && (
            <Card id="student-id-history" className="flex flex-col gap-3 rounded-md border-2 border-border bg-card p-4 shadow-brutal">
              <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
                <History className="h-4 w-4" strokeWidth={2.5} />
                <span className="font-medium">Lịch sử tìm kiếm</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {history.length} mục
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {history.map((id) => (
                  <div key={id} className="flex items-center gap-2 rounded-md border-2 border-border p-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-sm p-1 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => handleHistorySelect(id)}
                      aria-label={`Tìm lịch cho mã sinh viên ${id}`}
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border-2 border-border bg-secondary">
                        <Clock className="h-4 w-4 text-black" strokeWidth={2.5} />
                      </span>
                      <span className="truncate font-mono text-foreground">{id}</span>
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Xóa mã sinh viên ${id} khỏi lịch sử`}
                      onClick={(e) => removeFromHistory(id, e)}
                    >
                      <X className="text-destructive" strokeWidth={2.5} />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Info Badge */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full border-2 border-border shadow-brutal-sm">
          <Sparkles className="h-4 w-4 text-foreground" strokeWidth={2.5} />
          <Badge variant="outline" className="text-xs font-medium">
           { navigator.onLine ? "Dữ liệu được lưu cache trong 30 phút" : "Bạn đang ngoại tuyến"}
          </Badge>
        </div>
      </div>
    </div>
  );
};
