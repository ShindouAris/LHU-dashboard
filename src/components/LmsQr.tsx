import React, { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { nextAutoZoom, startQrAssist, type ZoomRange } from "@/services/qrAssist";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, /* CardHeader */ } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, QrCode, RefreshCw, AlertTriangle } from "lucide-react";
import { ApiService } from "@/services/apiService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs"
import { FaRegQuestionCircle } from "react-icons/fa";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog.tsx";

export const QRScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [scanned, setScanned] = useState<string>("");
  const [scale, setScale] = useState<number>(1);
  const [error, setError] = useState<null | string>(null)
  const [isExpiredQR, setIsExpiredQR] = useState<boolean>(false)
  const [success, setIsSuccess] = useState<boolean>(false)
  const [dialogTutorialOpen, setDialogTutorialOpen] = useState<boolean>(false)
  const [dialogExpiredQROpen, setDialogExpiredQROpen] = useState<boolean>(false)
  const [monHocDaDiemDanh, setMonHocDaDiemDanh] = useState<string | null>(null)
  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
  const nav = useNavigate()
  const isReactNativeWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView?.postMessage;

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const extractQrFromMessage = useCallback((data: unknown): { type?: string; code?: string } => {
    if (!data) return {};

    // ReactNativeWebView.postMessage usually sends a string
    if (typeof data === "string") {
      try {
        const parsed: unknown = JSON.parse(data);
        if (isRecord(parsed)) {
          const payload = parsed.payload;
          return {
            type: typeof parsed.type === "string" ? parsed.type : undefined,
            code:
              typeof parsed.code === "string"
                ? parsed.code
                : isRecord(payload) && typeof payload.code === "string"
                  ? payload.code
                  : typeof payload === "string"
                    ? payload
                    : undefined,
          };
        }
      } catch {
        // Not JSON; ignore
      }
      return {};
    }

    if (typeof data === "object") {
      const anyData = data as Record<string, unknown>;
      const payload = anyData.payload;
      return {
        type: typeof anyData.type === "string" ? anyData.type : undefined,
        code:
          typeof anyData.code === "string"
            ? anyData.code
            : isRecord(payload) && typeof payload.code === "string"
              ? payload.code
              : typeof payload === "string"
                ? payload
                : undefined,
      };
    }

    return {};
  }, []);

  const openReactNativeCamera = useCallback(() => {
    if (!isReactNativeWebView) return;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "DASHBOARD_REQUEST_CAMERA_ACCESS",
        payload: "",
    })
    )
  }, [isReactNativeWebView])

  const acceptedRef = useRef(false);
  const sessionRef = useRef(0);
  const processedRef = useRef<string | null>(null);
  const invalidateSession = useCallback(() => { sessionRef.current++; }, []);
  const manualZoomRef = useRef(false);
  const zoomRef = useRef(1);
  const zoomBusyRef = useRef(false);
  const zoomPendingRef = useRef<number | null>(null);
  const lastAutoZoomRef = useRef(0);
  const zoomRangeRef = useRef<ZoomRange | null>(null);
  const acceptCode = useCallback((code: string) => {
    if (!code.trim() || acceptedRef.current) return;
    acceptedRef.current = true;
    setScanned(code);
  }, []);

  const refreshTrack = useCallback(() => {
    const stream = videoRef.current?.srcObject;
    const track = stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined;
    if (!track || track === trackRef.current) return;
    trackRef.current = track;
    const capabilities = track.getCapabilities?.() as (MediaTrackCapabilities & { zoom?: ZoomRange }) | undefined;
    const range = capabilities?.zoom ?? null;
    zoomRangeRef.current = range;
    setZoomRange(range);
    const current = (track.getSettings() as MediaTrackSettings & { zoom?: number }).zoom ?? range?.min ?? 1;
    zoomRef.current = current;
    setScale(current);
  }, []);

  const applyZoom = useCallback(async (value: number) => {
    zoomPendingRef.current = value;
    if (zoomBusyRef.current) return;
    zoomBusyRef.current = true;
    try {
      while (zoomPendingRef.current !== null) {
        const requested = zoomPendingRef.current;
        zoomPendingRef.current = null;
        refreshTrack();
        const track = trackRef.current, range = zoomRangeRef.current;
        if (!track || !range) continue;
        const step = range.step || 0.1;
        const value = Math.min(range.max, Math.max(range.min, range.min + Math.round((requested - range.min) / step) * step));
        const constraints = track.getConstraints();
        try {
          const advanced = (constraints.advanced ?? []).map(constraint => {
            const preserved = { ...constraint } as MediaTrackConstraintSet & { zoom?: number };
            delete preserved.zoom;
            return preserved;
          });
          await track.applyConstraints({ ...constraints, advanced: [...advanced, { zoom: value } as MediaTrackConstraintSet] });
          if (track === trackRef.current) { zoomRef.current = value; setScale(value); }
        } catch { /* Unsupported/rejected zoom must not interrupt scanning. */ }
      }
    } finally { zoomBusyRef.current = false; }
  }, [refreshTrack]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    acceptedRef.current = false;
    if (isReactNativeWebView) openReactNativeCamera();
    const scanner = new QrScanner(video, result => { if (!cancelled) acceptCode(result.data); }, {
      returnDetailedScanResult: true, highlightScanRegion: true, highlightCodeOutline: true,
      preferredCamera: 'environment',
    });
    setQrScanner(scanner);
    setError(null);
    video.addEventListener('play', refreshTrack);
    const stopAssist = startQrAssist(video, acceptCode, fraction => {
      refreshTrack();
      if (acceptedRef.current || manualZoomRef.current || Date.now() - lastAutoZoomRef.current < 1200) return;
      const next = nextAutoZoom(zoomRef.current, zoomRangeRef.current, fraction);
      if (next !== null) { lastAutoZoomRef.current = Date.now(); void applyZoom(next); }
    }, () => sessionRef.current);
    void scanner.start().then(() => {
      if (cancelled) { scanner.stop(); return; }
      refreshTrack();
    }).catch(error => {
      if (!cancelled) toast.error("Mở camera thất bại: " + String(error));
    });
    return () => {
      cancelled = true;
      invalidateSession();
      acceptedRef.current = true;
      stopAssist();
      video.removeEventListener('play', refreshTrack);
      scanner.destroy();
      trackRef.current = null;
      zoomPendingRef.current = null;
    };
  }, [acceptCode, applyZoom, refreshTrack, isReactNativeWebView, openReactNativeCamera, invalidateSession]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const { type, code } = extractQrFromMessage(event.data);

      // Handle event qr scan từ React Native
      if (type === "QR_SCANNED" && typeof code === "string" && code.trim() !== "") {
        acceptCode(code);
      }
    };

    // In React Native WebView, messages may arrive on `document` instead of `window`.
    window.addEventListener("message", onMessage as EventListener);
    document.addEventListener("message", onMessage as EventListener);
    return () => {
      window.removeEventListener("message", onMessage as EventListener);
      document.removeEventListener("message", onMessage as EventListener);
    };
  }, [extractQrFromMessage, isReactNativeWebView, acceptCode]);

  useEffect(() => {

    const session = sessionRef.current;
    const processScanned = async () => {

      setError(null)
      setIsExpiredQR(false)
      setDialogExpiredQROpen(false)

      if (scanned === "" || processedRef.current === scanned) return;
      processedRef.current = scanned;

      if (scanned.startsWith("http")) {
        window.open(scanned)
        return
      }

      const access_token = localStorage.getItem("access_token")
      if (!access_token) {setError("Đăng nhập để sử dụng"); return}
      // Nếu không phải là QR STB (điểm danh sổ đầu bài) hoặc LIB (điểm danh sử dụng phòng thư viện) thì nổ lỗi
      const SUBSTR = scanned.substring(0,3)
      if (scanned !== "" && SUBSTR !== "STB" && SUBSTR !== "LIB") {
        setError("QR này không được hỗ trợ...")
        return
      }

      acceptedRef.current = true;
      qrScanner?.pause()
      .then(() => {console.log("Tạm dừng camera vì đã tìm thấy QR phù hợp")})
      .catch((error) => {
        console.log("Thất bại trong việc nỗ lực dừng camera" + error)
      })

      if (SUBSTR === "STB") {
        try {
          const res = await ApiService.send_diem_danh(scanned, access_token);
          if (session !== sessionRef.current || !res) return;

          if (!res.success) {
            const errorMessage = String(res.error || "Điểm danh thất bại");
            setError(errorMessage);
            if (errorMessage.toLowerCase().includes("hết hạn")) {
              setIsExpiredQR(true);
              setDialogExpiredQROpen(true);
              toast.error("⚠️ Mã QR điểm danh đã hết hạn!");
            } else {
              setIsExpiredQR(false);
              setDialogExpiredQROpen(false);
              toast.error(errorMessage);
            }
          } else {
            setIsSuccess(true);
            setIsExpiredQR(false);
            setMonHocDaDiemDanh("Thành công");
            toast.success("🎉 Điểm danh thành công!");
          }
        } catch (cause) {
          if (session !== sessionRef.current) return;
          const message = cause instanceof Error ? cause.message : "Lỗi không xác định";
          setError(message);
          toast.error("Điểm danh thất bại: " + message);
        }
      } else if (SUBSTR === "LIB") {
        try {
          const res = await ApiService.elib_scanCode(scanned, access_token)
          if (session !== sessionRef.current || !res) return

          if (!res.success) {
            const errorMessage = String(res.error)
            setError(errorMessage)
          }
          else { 
            setIsSuccess(true)
            toast.success(`Quét mã thư viện thành công - ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`)
          }

        } catch (error) {
          if (session !== sessionRef.current) return;
          if (error instanceof Error) {
            if (error.message.toLowerCase() === "failed to fetch") {
              toast.error("Lỗi mạng, vui lòng kiểm tra lại kết nối")
            }
            else {
              toast.error("Đã xảy ra lỗi không mong muốn, hãy thử lại")
            }
          }
        }
      }
    };

    processScanned();


  }, [scanned, qrScanner]);

  const handleReset = async () => {
    processedRef.current = null;
    sessionRef.current++;
    acceptedRef.current = false;
    manualZoomRef.current = false;
    setScanned("");
    setIsSuccess(false)
    setError(null)
    setMonHocDaDiemDanh(null)
    setIsExpiredQR(false)
    setDialogExpiredQROpen(false)
    await toast.promise(
      async () => { await qrScanner?.start(); refreshTrack(); },
      {
        loading: "Đang khởi động camera",
        success: "Khởi động camera thành công",
        error: "Không thể khởi động camera"
      }
    )
  };

  const handleCloseExpiredDialog = () => {
    setDialogExpiredQROpen(false)
  }

  const handleBack = () => {
    sessionRef.current++;
    acceptedRef.current = true;
    setScanned("")
    setMonHocDaDiemDanh(null)
    nav("/")
    qrScanner?.stop()
  }

  // --- Pinch zoom handlers ---
  const lastDistance = useRef<number | null>(null);

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      manualZoomRef.current = true;
      if (lastDistance.current) {
        const zoomFactor = distance / lastDistance.current;
        void applyZoom(Math.min(Math.max(zoomRef.current * zoomFactor, zoomRange?.min ?? 1), zoomRange?.max ?? 1));
      }

      lastDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = null;
  };

  const handleDialog = () => {
      setDialogTutorialOpen(!dialogTutorialOpen)
      console.log(dialogTutorialOpen);
  }

  return (
    <div className="flex min-h-screen w-full max-w-6xl flex-col items-center py-4 text-foreground sm:py-6">
      {/* App Bar */}
      <div className="mb-4 w-full">
        <div className="bg-section text-section-foreground border-2 border-border rounded-t-md shadow-brutal px-4 py-4">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" strokeWidth={2.5} />
            <h1 className="text-xl font-display font-bold">Quét mã điểm danh</h1>
            <button type="button" aria-label="Hướng dẫn quét mã" className="ml-auto shrink-0 p-2 rounded-sm focus-ring opacity-70 hover:opacity-100" onClick={handleDialog}>
              <FaRegQuestionCircle size={25} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl">
      {/* Main Card */}
      <Card className="w-full overflow-hidden bg-card">
        <CardContent className="p-0">
          {/* Scanner Container */}
          <div className="relative mx-2 mt-2 bg-black overflow-hidden border-2 border-border rounded-md">
            <div
              className="relative w-full aspect-square touch-none"
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {videoRef.current ? (<div><img alt={"IMAGE"} src="/cibi.png"/></div>) : (<></>)}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover"
              />

              {/* Zoom indicator */}
              {scale > 1 && (
                <div className="absolute top-4 right-4 bg-primary text-black border-2 border-border px-3 py-1 rounded-full text-sm font-bold">
                  {scale.toFixed(1)}x
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {success && !error ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-[hsl(142_71%_45%)] text-black border-2 border-border rounded-md shadow-brutal-sm p-4"
                >
                  <div className="flex items-start gap-2">
                    <img className="w-8 h-8" src="/Success.gif" alt="Success"/>
                    <div className="flex-1">
                      <p className="font-bold text-sm">
                        {
                        scanned.substring(0,3) === "STB" ? "Điểm danh thành công" :
                        scanned.substring(0,3) === "LGN" ? "Liên kết tài khoản thành công" :
                        scanned.substring(0,3) === "LIB" ? "Quét mã thư viện thành công" : "Thành công"
                        }
                      </p>
                      <p className="text-black/80 text-xs mt-1 break-all">
                        {scanned.substring(0,3) === "STB" ? monHocDaDiemDanh ? `Kết quả: ${monHocDaDiemDanh}` : scanned :
                        scanned.substring(0,3) === "LGN" ? "Đã thêm tài khoản vào thiết bị này" :
                        scanned.substring(0,3) === "LIB" ? "Đã checkin phòng thành công" : ""
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`${
                    isExpiredQR
                      ? "bg-destructive text-black border-2 border-border shadow-brutal"
                      : "bg-[hsl(334_100%_71%)] text-black border-2 border-border shadow-brutal-sm"
                  } p-4 rounded-md`}
                >
                  <div className="flex items-start gap-3">
                    {isExpiredQR ? (
                      <AlertTriangle className="w-6 h-6 text-black flex-shrink-0 mt-0.5 animate-pulse" strokeWidth={2.5} />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    )}
                    <div className="flex-1">
                      <p className={`${isExpiredQR ? "font-bold text-base" : "font-bold text-sm"}`}>
                        {isExpiredQR ? "Cảnh báo: Mã QR đã hết hạn" : "Lỗi"}
                      </p>
                      <p className={`${isExpiredQR ? "font-semibold" : ""} text-xs mt-1 break-all`}>
                        {error}
                      </p>
                      {isExpiredQR && (
                        <p className="text-xs mt-2 italic">
                          Vui lòng quét mã QR mới để điểm danh.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-secondary text-black border-2 border-border rounded-md shadow-brutal-sm p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                    <p className="text-black font-bold text-sm">
                      Đang quét QR...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Helper Text */}
            <p className="text-muted-foreground text-xs text-center mt-4">
              Sử dụng hai ngón tay để phóng to/thu nhỏ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-4 pt-0">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 py-6 font-medium"
            >
              <ArrowLeft data-icon="inline-start" />
              Trở về
            </Button>
            <Button
              onClick={handleReset}
              variant="section"
              className="flex-1 py-6 font-bold"
            >
              <RefreshCw data-icon="inline-start" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* FAB-style zoom reset (optional) */}
      {scale > 1 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          aria-label="Đặt lại độ phóng camera"
          onClick={() => { manualZoomRef.current = true; void applyZoom(zoomRange?.min ?? 1); }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-section text-section-foreground border-2 border-border rounded-full shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-150 flex items-center justify-center z-40"
        >
          <span className="text-sm font-bold">1x</span>
        </motion.button>
      )}
        <Dialog open={dialogTutorialOpen} onOpenChange={setDialogTutorialOpen}>
            <DialogContent className="max-w-3xl p-4">
                <DialogHeader>
                    <DialogTitle>Hướng dẫn sử dụng hệ thống điểm danh</DialogTitle>
                </DialogHeader>
                <DialogDescription className="flex justify-center">
                    <video
                        src="/tut.mp4"
                        autoPlay
                        muted
                        loop
                        controls
                        playsInline
                        className="rounded-md border-2 border-border w-full max-h-[70vh] object-contain"
                    />
                </DialogDescription>
            </DialogContent>
        </Dialog>

        {/* Expired QR Code Warning Dialog */}
        <Dialog open={dialogExpiredQROpen} onOpenChange={setDialogExpiredQROpen}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-destructive p-1.5">
                            <AlertTriangle className="w-7 h-7 text-black animate-pulse" strokeWidth={2.5} />
                        </span>
                        <DialogTitle className="text-foreground text-xl font-display font-bold">
                            CẢNH BÁO: Mã QR đã hết hạn
                        </DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription className="text-foreground space-y-3">
                    <p className="font-semibold text-base">
                        Mã QR điểm danh bạn vừa quét đã hết hạn sử dụng.
                    </p>
                    <div className="bg-destructive text-black p-3 rounded-md border-2 border-border">
                        <p className="text-sm font-bold mb-1">
                            Chi tiết lỗi:
                        </p>
                        <p className="text-sm break-all">
                            {error}
                        </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        💡 Vui lòng quét mã QR mới từ giảng viên để điểm danh.
                    </p>
                </DialogDescription>
                <DialogFooter className="mt-4">
                    <Button
                        onClick={handleCloseExpiredDialog}
                        variant="destructive"
                    >
                        Đã hiểu
                    </Button>
                    <Button
                        onClick={handleReset}
                        variant="outline"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Quét lại
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default QRScanner;
