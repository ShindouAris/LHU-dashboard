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
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Tự động xử lý khảo sát
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý {Math.ceil((currentProgress / 100) * (surveys.length + processedCount))}/
                  {surveys.length + processedCount}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Còn lại ~{formatTime(estimatedTimeLeft)}
                </div>
              </div>
              <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
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
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Danh sách khảo sát
                    <span className="text-xs text-gray-400 font-normal">
                      ({surveys.length})
                    </span>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                  {surveys.length > 0 ? (
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800">
                      {surveys.map((survey, idx) => {
                        const info = extractSurveyInfoFromHtml(survey.MoTa);
                        return (
                          <div
                            key={survey.KhaoSatID || idx}
                            className="p-3 hover:bg-white dark:hover:bg-gray-800/50 transition-colors flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center justify-center">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate"
                                title={survey.TenKhaoSat}
                              >
                                {survey.TenKhaoSat}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span className="truncate">GV: {info.teacher}</span>
                                <span className="truncate">Môn: {info.subject}</span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono">
                                  ID {survey.KhaoSatID}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono">
                                  TPL {survey.templateID}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Chưa có khảo sát nào trong danh sách.
                    </div>
                  )}
                </div>
              </div>

              {/* Logs */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Nhật ký
                    <span className="text-xs text-gray-400 font-normal">
                      ({logs.length})
                    </span>
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={clearLogs}
                      disabled={processing}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                  {logs.length > 0 ? (
                    <div className="max-h-[420px] overflow-y-auto p-2 space-y-1 text-xs">
                      {logs.map((log, idx) => (
                        <LogRow key={idx} log={log} />
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nhật ký xử lý sẽ hiển thị tại đây.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && surveys.length === 0 && logs.length === 0 && (
            <div className="text-center py-16 px-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chưa có dữ liệu
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nhấn <span className="font-medium">"Lấy danh sách"</span> để bắt đầu tải khảo sát.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Hủy tiến trình?
              </h3>
            </div>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-300',
    ring: 'ring-blue-100 dark:ring-blue-900/50',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-300',
    ring: 'ring-green-100 dark:ring-green-900/50',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-300',
    ring: 'ring-red-100 dark:ring-red-900/50',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-300',
    ring: 'ring-amber-100 dark:ring-amber-900/50',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
    ring: 'ring-gray-200 dark:ring-gray-700',
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
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${t.bg} ${t.text}`}>{icon}</div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-none">
        {value !== undefined ? value : valueText}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{hint}</div>
      )}
    </div>
  );
};

const LogRow = ({ log }: { log: LogEntry }) => {
  const config: Record<LogType, { icon: React.ReactNode; color: string }> = {
    success: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: 'text-red-600 dark:text-red-400',
    },
    warning: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      icon: <Info className="w-3.5 h-3.5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
  };
  const c = config[log.type];
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
      <div className={`flex-shrink-0 mt-0.5 ${c.color}`}>{c.icon}</div>
      <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0">
        {log.time}
      </span>
      <div className={`flex-1 min-w-0 break-words ${c.color}`}>{log.message}</div>
    </div>
  );
};
