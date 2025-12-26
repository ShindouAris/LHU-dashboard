import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Send, AlertTriangle, XCircle } from 'lucide-react';
import { SurveyListItem } from '@/types/automation';
import { automationService } from '@/services/AutomationService';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const SurveyAutomationTool = () => {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [logs, setLogs] = useState<Array<{type: 'success' | 'error' | 'info' | 'warning', message: string}>>([]);
  
  const cancelRef = useRef(false);
  const processingRef = useRef(false);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addLog = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setLogs(prev => [...prev.slice(-9), { type, message }]);
  };

  const clearLogs = () => {
    setLogs([]);
  }

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

  // Reset cancel flag khi processing thay đổi
  useEffect(() => {
    if (!processing) {
      cancelRef.current = false;
      processingRef.current = false;
    }
  }, [processing]);

  // 📥 Lấy danh sách khảo sát
  const handleFetchSurveys = async () => {
    setLoading(true);
    setSurveys([]);
    setLogs([]);
    setProcessedCount(0);
    setCurrentProgress(0);

    try {
      clearLogs();
      addLog('info', '⏳ Đang tải danh sách khảo sát...');
      const data = await automationService.getSurveyList();
      
      setSurveys(data);

      if (data.length === 0) {
        addLog('info', '📭 Không có khảo sát nào cần xử lý.');
      } else {
        addLog('success', `✅ Tải xong ${data.length} khảo sát chờ xử lý.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        addLog('error', `❌ Lỗi khi tải khảo sát: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🤖 Xử lý khảo sát tự động với sleep và submit
  const handleProcessBatch = async () => {
    const batch = surveys.slice(0, surveys.length);
    clearLogs();
    if (batch.length === 0) {
      addLog('info', '📭 Không còn khảo sát để xử lý.');
      return;
    }

    setProcessing(true);
    processingRef.current = true;
    cancelRef.current = false;
    setShowWarning(false);
    
    addLog('info', `🚀 Bắt đầu xử lý ${batch.length} khảo sát...`);

    let successCount = 0;
    const processedIds: string[] = [];
    
    // Estimate: process (2s) + sleep (15-20s) + submit (1s) = ~18-23s per survey
    const avgTimePerSurvey = 20;
    const totalEstimatedTime = batch.length * avgTimePerSurvey;
    setEstimatedTimeLeft(totalEstimatedTime);

    const startTime = Date.now();

    for (let i = 0; i < batch.length; i++) {
      // Check cancel flag
      if (cancelRef.current) {
        addLog('warning', `⚠️ Đã hủy tiến trình. Xử lý được ${successCount}/${batch.length} khảo sát.`);
        break;
      }

      const survey = batch[i];
      
      try {
        // Step 1: Process survey
        addLog('info', `[${i + 1}/${batch.length}] 🔄 Xử lý: ${survey.TenKhaoSat}`);
        const processResult = await automationService.processSurvey(survey);
        
        if (cancelRef.current) break;

        // Step 2: Random sleep 10-16 seconds
        const sleepTime = Math.floor(Math.random() * 6000) + 10000; // 10000 to 16000 ms
        addLog('info', `⏱️ Chờ ${(sleepTime / 1000).toFixed(1)}s trước khi submit...`);
        
        // Sleep với check cancel mỗi 500ms
        for (let j = 0; j < sleepTime; j += 500) {
          if (cancelRef.current) break;
          await sleep(500);
        }
        
        if (cancelRef.current) break;

        // Step 3: Submit survey
        addLog('info', `📤 Đang submit khảo sát...`);
        if (cancelRef.current) break;
        if (!processResult.data) {
          throw new Error("Dữ liệu gửi lên không hợp lệ");
        }
        await automationService.submit_survey(processResult.data);
        
        successCount++;
        processedIds.push(survey.KhaoSatID);
        setProcessedCount(prev => prev + 1);
        addLog('success', `✅ [${i + 1}/${batch.length}] ${survey.TenKhaoSat} - Hoàn thành!`);
        
        // Update progress
        const progress = ((i + 1) / batch.length) * 100;
        setCurrentProgress(progress);
        
        // Update estimated time left
        const elapsed = (Date.now() - startTime) / 1000;
        const avgTimeSpent = elapsed / (i + 1);
        const remaining = Math.ceil((batch.length - (i + 1)) * avgTimeSpent);
        setEstimatedTimeLeft(remaining);
        
      } catch (error) {
        if (error instanceof Error) {
            addLog('error', `❌ [${i + 1}/${batch.length}] ${survey.TenKhaoSat}: ${error.message}`);
        }
        
        // Update progress even on error
        const progress = ((i + 1) / batch.length) * 100;
        setCurrentProgress(progress);
      }
    }

    // Xóa các khảo sát đã xử lý thành công
    setSurveys(prev => prev.filter(s => !processedIds.includes(s.KhaoSatID)));
    
    if (!cancelRef.current) {
      addLog('success', `🎉 Hoàn thành: ${successCount}/${batch.length} khảo sát.`);
      setCurrentProgress(100);
      setEstimatedTimeLeft(0);
    }
    
    setProcessing(false);
    processingRef.current = false;
  };

  // Cancel task
  const handleCancelTask = () => {
    if (processing) {
      setShowWarning(true);
    }
  };

  const confirmCancel = () => {
    cancelRef.current = true;
    setShowWarning(false);
    addLog('warning', '⚠️ Đang hủy tiến trình...');
  };
  type SurveyInfo = {
    teacher: string
    subject: string
    }

const extractSurveyInfoFromHtml = (
    html: string,
    fallback: Partial<SurveyInfo> = {}
    ): SurveyInfo => {
    const getBoldText = (label: string): string | null => {
        const regex = new RegExp(
        `${label}\\s*:\\s*<b>(.*?)<\\/b>`,
        "i"
        )
        return html.match(regex)?.[1]?.trim() ?? null
    }

    return {
        teacher:
        getBoldText("Giáo viên") ??
        fallback.teacher ??
        "UNKNOWN_TEACHER",

        subject:
        getBoldText("Môn") ??
        fallback.subject ??
        "UNKNOWN_SUBJECT",
    }
}

return (
        <div className=" mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
                
                {/* Header */}
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Tự động xử lý khảo sát
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Công cụ tự động xử lý khảo sát hàng loạt. Tiết kiệm thời gian và công sức.
                    </p>
                </div>

                {/* Warning Modal */}
                <Dialog open={showWarning} onOpenChange={setShowWarning}>
                    <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
                        <DialogHeader>
                            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                                <AlertTriangle className="w-8 h-8" />
                                <h3 className="text-xl font-bold dark:text-gray-100">Cảnh báo!</h3>
                            </div>
                        </DialogHeader>
                        <p className="text-gray-700 dark:text-gray-300">
                            Bạn có chắc muốn hủy tiến trình? Các khảo sát đã xử lý sẽ không thể khôi phục.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowWarning(false)}
                                variant="outline"
                                className="flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Tiếp tục xử lý
                            </Button>
                            <Button
                                onClick={confirmCancel}
                                variant="destructive"
                                className="flex-1"
                            >
                                Hủy tiến trình
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm min-w-0">
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex-shrink-0">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Khảo sát chờ xử lý</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                {surveys.length}
                                <span className="ml-3 text-xs font-medium text-gray-400">{loading ? 'Đang tải...' : 'Sẵn sàng'}</span>
                            </div>
                            {surveys.length > 0 && (
                                <div className="mt-2 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-2 bg-blue-500 dark:bg-blue-600 transition-all"
                                        style={{ width: `${Math.min(100, (surveys.length / Math.max(1, surveys.length + processedCount)) * 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm min-w-0">
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 flex-shrink-0">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Đã xử lý</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                {processedCount}
                                <span className="ml-3 text-xs font-medium text-gray-400">tổng</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {processedCount + surveys.length > 0
                                    ? `${Math.round((processedCount / (processedCount + surveys.length)) * 100)}% đã hoàn thành`
                                    : 'Chưa có dữ liệu'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar with Estimated Time */}
                {processing && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-5 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                ⚡ Đang xử lý... {currentProgress.toFixed(0)}%
                            </div>
                            <div className="text-sm font-mono text-purple-700 dark:text-purple-300">
                                ⏱️ Còn lại: ~{formatTime(estimatedTimeLeft)}
                            </div>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${currentProgress}%` }}
                            >
                                {currentProgress > 10 && (
                                    <span className="text-xs text-white font-bold drop-shadow">
                                        {currentProgress.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            Xử lý → Chờ 15-20s → Submit → Hoàn thành
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleFetchSurveys}
                        disabled={loading || processing}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white font-medium py-3 px-4 sm:px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Đang tải...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5" />
                                <span className="text-sm">Lấy danh sách</span>
                            </>
                        )}
                    </button>

                    {!processing ? (
                        <button
                            onClick={handleProcessBatch}
                            disabled={processing || surveys.length === 0 || loading}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white font-medium py-3 px-4 sm:px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            <span className="text-sm">Xử lý tự động</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleCancelTask}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 text-white font-medium py-3 px-4 sm:px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <XCircle className="w-5 h-5" />
                            <span className="text-sm">Hủy tiến trình</span>
                        </button>
                    )}
                </div>

                {/* Survey List */}
                {surveys.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                📋 Danh sách khảo sát ({surveys.length})
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="col-span-1">
                                    <div className="rounded-xl p-2 bg-transparent">
                                        <div className="max-h-[40vh] sm:max-h-64 overflow-y-auto space-y-2 pr-2">
                                            {surveys.map((survey, idx) => (
                                                <div
                                                    key={survey.KhaoSatID || idx}
                                                    className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                                                            {survey.TenKhaoSat}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                                            {extractSurveyInfoFromHtml(survey.MoTa)?.teacher || "404"}
                                                            <span className="mx-2">•</span>
                                                            {extractSurveyInfoFromHtml(survey.MoTa)?.subject || "404"}
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                                                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded truncate">
                                                            ID: {survey.KhaoSatID}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded truncate">
                                                            Template: {survey.templateID}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Logs column (responsive: under list on small, side-by-side on md+) */}
                                <div className="col-span-1">
                                    {logs.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">📝 Nhật ký xử lý</div>
                                            <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-3 max-h-[40vh] sm:max-h-64 overflow-y-auto space-y-1 font-mono text-xs border dark:border-gray-800">
                                                {logs.map((log, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-start gap-2 break-words ${
                                                            log.type === 'success' ? 'text-green-400 dark:text-green-300' :
                                                            log.type === 'error' ? 'text-red-400 dark:text-red-300' :
                                                            log.type === 'warning' ? 'text-yellow-400 dark:text-yellow-300' :
                                                            'text-blue-400 dark:text-blue-300'
                                                        }`}
                                                    >
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            {log.type === 'success' && <CheckCircle className="w-4 h-4" />}
                                                            {log.type === 'error' && <AlertCircle className="w-4 h-4" />}
                                                            {log.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                                                            {log.type === 'info' && <Loader2 className="w-4 h-4" />}
                                                        </div>
                                                        <div className="whitespace-pre-wrap break-words text-xs">
                                                            {log.message}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 p-3">
                                            📝 Chưa có nhật ký — các thông báo xử lý sẽ hiển thị ở đây.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && surveys.length === 0 && logs.length === 0 && (
                    <div className="text-center py-12 space-y-3">
                        <div className="text-6xl">📋</div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                            Nhấn "Lấy danh sách" để bắt đầu tải khảo sát
                        </div>
                    </div>
                )}

            </div>
        </div>
);
}