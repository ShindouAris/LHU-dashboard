import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Play,
  AlertTriangle,
  XCircle,
  Info,
  ListChecks,
  Activity,
  Clock,
  Inbox,
  Terminal,
} from 'lucide-react';
import { SurveyListItem } from '@/types/automation';
import { automationService } from '@/services/AutomationService';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type LogType = 'success' | 'error' | 'info' | 'warning';
type LogEntry = { type: LogType; message: string; time: string };

export const SurveyAutomationTool = () => {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const cancelRef = useRef(false);
  const processingRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nowHHMMSS = () => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  };

  const addLog = (type: LogType, message: string) => {
    setLogs((prev) => [...prev.slice(-49), { type, message, time: nowHHMMSS() }]);
  };

  const clearLogs = () => setLogs([]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [logs]);

  // Cảnh báo khi rời trang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (processingRef.current) {
        e.preventDefault();
        return 'Bạn đang xử lý khảo sát. Thoát trang sẽ hủy tiến trình. Bạn có chắc?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!processing) {
      cancelRef.current = false;
      processingRef.current = false;
    }
  }, [processing]);

  const handleFetchSurveys = async () => {
    setLoading(true);
    setSurveys([]);
    setProcessedCount(0);
    setErrorCount(0);
    setCurrentProgress(0);
    clearLogs();

    try {
      addLog('info', 'Đang tải danh sách khảo sát...');
      const data = await automationService.getSurveyList();
      setSurveys(data);
      if (data.length === 0) {
        addLog('info', 'Không có khảo sát nào cần xử lý.');
      } else {
        addLog('success', `Tải xong ${data.length} khảo sát chờ xử lý.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        addLog('error', `Lỗi khi tải khảo sát: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessBatch = async () => {
    const batch = surveys.slice(0, surveys.length);
    if (batch.length === 0) {
      addLog('info', 'Không còn khảo sát để xử lý.');
      return;
    }

    setProcessing(true);
    processingRef.current = true;
    cancelRef.current = false;
    setShowWarning(false);
    setErrorCount(0);

    addLog('info', `Bắt đầu xử lý ${batch.length} khảo sát...`);

    let successCount = 0;
    let errCount = 0;
    const processedIds: string[] = [];

    const avgTimePerSurvey = 20;
    setEstimatedTimeLeft(batch.length * avgTimePerSurvey);

    const startTime = Date.now();

    for (let i = 0; i < batch.length; i++) {
      if (cancelRef.current) {
        addLog('warning', `Đã hủy. Xử lý được ${successCount}/${batch.length} khảo sát.`);
        break;
      }

      const survey = batch[i];
      try {
        addLog('info', `[${i + 1}/${batch.length}] Đang xử lý: ${survey.TenKhaoSat}`);
        const processResult = await automationService.processSurvey(survey);
        if (cancelRef.current) break;

        const sleepTime = Math.floor(Math.random() * 6000) + 10000;
        addLog('info', `Chờ ${(sleepTime / 1000).toFixed(1)}s trước khi submit...`);
        for (let j = 0; j < sleepTime; j += 500) {
          if (cancelRef.current) break;
          await sleep(500);
        }
        if (cancelRef.current) break;

        addLog('info', 'Đang submit khảo sát...');
        if (!processResult.data) throw new Error('Dữ liệu gửi lên không hợp lệ');
        await automationService.submit_survey(processResult.data);

        successCount++;
        processedIds.push(survey.KhaoSatID);
        setProcessedCount((prev) => prev + 1);
        addLog('success', `[${i + 1}/${batch.length}] ${survey.TenKhaoSat} — Hoàn thành`);

        const progress = ((i + 1) / batch.length) * 100;
        setCurrentProgress(progress);

        const elapsed = (Date.now() - startTime) / 1000;
        const avgTimeSpent = elapsed / (i + 1);
        const remaining = Math.ceil((batch.length - (i + 1)) * avgTimeSpent);
        setEstimatedTimeLeft(remaining);
      } catch (error) {
        errCount++;
        setErrorCount((prev) => prev + 1);
        if (error instanceof Error) {
          addLog('error', `[${i + 1}/${batch.length}] ${survey.TenKhaoSat}: ${error.message}`);
        }
        const progress = ((i + 1) / batch.length) * 100;
        setCurrentProgress(progress);
      }
    }

    setSurveys((prev) => prev.filter((s) => !processedIds.includes(s.KhaoSatID)));

    if (!cancelRef.current) {
      addLog(
        errCount > 0 ? 'warning' : 'success',
        `Hoàn thành: ${successCount} thành công, ${errCount} lỗi / ${batch.length} khảo sát.`
      );
      setCurrentProgress(100);
      setEstimatedTimeLeft(0);
    }

    setProcessing(false);
    processingRef.current = false;
  };

  const handleCancelTask = () => {
    if (processing) setShowWarning(true);
  };

  const confirmCancel = () => {
    cancelRef.current = true;
    setShowWarning(false);
    addLog('warning', 'Đang hủy tiến trình...');
  };

  type SurveyInfo = { teacher: string; subject: string };

  const extractSurveyInfoFromHtml = (
    html: string,
    fallback: Partial<SurveyInfo> = {}
  ): SurveyInfo => {
    const getBoldText = (label: string): string | null => {
      const regex = new RegExp(`${label}\\s*:\\s*<b>(.*?)<\\/b>`, 'i');
      return html.match(regex)?.[1]?.trim() ?? null;
    };
    return {
      teacher: getBoldText('Giáo viên') ?? fallback.teacher ?? 'Không rõ giáo viên',
      subject: getBoldText('Môn') ?? fallback.subject ?? 'Không rõ môn học',
    };
  };

  const totalKnown = processedCount + surveys.length;
  const completionPct =
    totalKnown > 0 ? Math.round((processedCount / totalKnown) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="bg-card border-2 border-border rounded-md shadow-brutal overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-foreground" strokeWidth={2.5} />
              Tự động xử lý khảo sát
            </h2>
            <p className="text-sm text-muted-foreground">
              Tải danh sách khảo sát còn tồn và xử lý hàng loạt một cách an toàn.
            </p>
          </div>

          {/* Action Buttons - moved to header */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleFetchSurveys}
              disabled={loading || processing}
              variant="outline"
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{loading ? 'Đang tải' : 'Lấy danh sách'}</span>
            </Button>

            {!processing ? (
              <Button
                onClick={handleProcessBatch}
                disabled={processing || surveys.length === 0 || loading}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Xử lý ({surveys.length})</span>
              </Button>
            ) : (
              <Button onClick={handleCancelTask} variant="destructive" className="gap-2">
                <XCircle className="w-4 h-4" />
                <span>Hủy</span>
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Stats - 4 đều cột, cân đối */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Inbox className="w-4 h-4" />}
              label="Chờ xử lý"
              value={surveys.length}
              tone="blue"
              hint={loading ? 'Đang tải...' : 'Sẵn sàng'}
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Đã xử lý"
              value={processedCount}
              tone="green"
              hint={`${completionPct}% hoàn thành`}
            />
            <StatCard
              icon={<AlertCircle className="w-4 h-4" />}
              label="Lỗi"
              value={errorCount}
              tone="red"
              hint={errorCount > 0 ? 'Cần kiểm tra' : 'Không có lỗi'}
            />
            <StatCard
              icon={<Activity className="w-4 h-4" />}
              label="Trạng thái"
              valueText={processing ? 'Đang chạy' : loading ? 'Đang tải' : 'Nghỉ'}
              tone={processing ? 'amber' : 'gray'}
              hint={processing ? `${currentProgress.toFixed(0)}%` : '—'}
            />
          </div>

          {/* Progress */}
          {processing && (
            <div className="rounded-md border-2 border-border bg-secondary text-secondary-foreground p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 text-black font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý {Math.ceil((currentProgress / 100) * (surveys.length + processedCount))}/
                  {surveys.length + processedCount}
                </div>
                <div className="flex items-center gap-2 text-black font-mono text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Còn lại ~{formatTime(estimatedTimeLeft)}
                </div>
              </div>
              <div className="w-full h-3 bg-card border-2 border-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <div className="text-xs text-black flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Mỗi khảo sát: xử lý → chờ ngẫu nhiên 10–16s → submit
              </div>
            </div>
          )}

          {/* Main content: List + Logs */}
          {(surveys.length > 0 || logs.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Survey List */}
              <div className="lg:col-span-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Danh sách khảo sát
                    <span className="text-xs text-muted-foreground font-normal">
                      ({surveys.length})
                    </span>
                  </div>
                </div>

                <div className="border-2 border-border rounded-md bg-muted">
                  {surveys.length > 0 ? (
                    <div className="max-h-[420px] overflow-y-auto divide-y-2 divide-border">
                      {surveys.map((survey, idx) => {
                        const info = extractSurveyInfoFromHtml(survey.MoTa);
                        return (
                          <div
                            key={survey.KhaoSatID || idx}
                            className="p-3 hover:bg-card transition-colors flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-border bg-secondary text-black text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-bold text-sm text-foreground truncate"
                                title={survey.TenKhaoSat}
                              >
                                {survey.TenKhaoSat}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span className="truncate">GV: {info.teacher}</span>
                                <span className="truncate">Môn: {info.subject}</span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded-md border-2 border-border bg-card text-foreground font-mono">
                                  ID {survey.KhaoSatID}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md border-2 border-border bg-card text-foreground font-mono">
                                  TPL {survey.templateID}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Chưa có khảo sát nào trong danh sách.
                    </div>
                  )}
                </div>
              </div>

              {/* Logs */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Nhật ký
                    <span className="text-xs text-muted-foreground font-normal">
                      ({logs.length})
                    </span>
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={clearLogs}
                      disabled={processing}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="border-2 border-border rounded-md bg-muted">
                  {logs.length > 0 ? (
                    <div className="max-h-[420px] overflow-y-auto p-2 space-y-1 text-xs">
                      {logs.map((log, idx) => (
                        <LogRow key={idx} log={log} />
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Nhật ký xử lý sẽ hiển thị tại đây.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && surveys.length === 0 && logs.length === 0 && (
            <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-md">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-border bg-secondary text-black mb-3">
                <Inbox className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="text-sm font-bold text-foreground">
                Chưa có dữ liệu
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Nhấn <span className="font-bold">"Lấy danh sách"</span> để bắt đầu tải khảo sát.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md border-2 border-border bg-[hsl(27_96%_61%)] text-black">
                <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">
                Hủy tiến trình?
              </h3>
            </div>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tiến trình đang chạy sẽ dừng ngay lập tức. Các khảo sát đã xử lý xong vẫn được giữ
            nguyên, nhưng những khảo sát đang chờ sẽ không tiếp tục.
          </p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowWarning(false)} variant="outline">
              Tiếp tục xử lý
            </Button>
            <Button onClick={confirmCancel} variant="destructive">
              Hủy tiến trình
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ───────────────── Sub components ───────────────── */

type Tone = 'blue' | 'green' | 'red' | 'amber' | 'gray';

const toneClasses: Record<Tone, { bg: string; text: string; ring: string }> = {
  blue: {
    bg: 'bg-secondary',
    text: 'text-black',
    ring: '',
  },
  green: {
    bg: 'bg-[hsl(142_71%_45%)]',
    text: 'text-black',
    ring: '',
  },
  red: {
    bg: 'bg-destructive',
    text: 'text-destructive-foreground',
    ring: '',
  },
  amber: {
    bg: 'bg-[hsl(27_96%_61%)]',
    text: 'text-black',
    ring: '',
  },
  gray: {
    bg: 'bg-muted',
    text: 'text-foreground',
    ring: '',
  },
};

const StatCard = ({
  icon,
  label,
  value,
  valueText,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  valueText?: string;
  hint?: string;
  tone: Tone;
}) => {
  const t = toneClasses[tone];
  return (
    <div className="rounded-md border-2 border-border bg-card shadow-brutal-sm p-3">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md border-2 border-border ${t.bg} ${t.text}`}>{icon}</div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
      </div>
      <div className="mt-2 text-2xl font-black tabular-nums text-foreground leading-none">
        {value !== undefined ? value : valueText}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-muted-foreground truncate">{hint}</div>
      )}
    </div>
  );
};

const LogRow = ({ log }: { log: LogEntry }) => {
  const config: Record<LogType, { icon: React.ReactNode; color: string }> = {
    success: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: 'text-[hsl(142_71%_45%)]',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: 'text-destructive',
    },
    warning: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-[hsl(27_96%_61%)]',
    },
    info: {
      icon: <Info className="w-3.5 h-3.5" />,
      color: 'text-foreground',
    },
  };
  const c = config[log.type];
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-card transition-colors">
      <div className={`flex-shrink-0 mt-0.5 ${c.color}`}>{c.icon}</div>
      <span className="font-mono text-[10px] text-muted-foreground mt-0.5 flex-shrink-0">
        {log.time}
      </span>
      <div className={`flex-1 min-w-0 break-words ${c.color}`}>{log.message}</div>
    </div>
  );
};
