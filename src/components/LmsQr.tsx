import React, { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
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
import { authService } from "@/services/authService";
import { multiSessionService, type UserSession } from "@/services/multisession";
import { AuthStorage } from "@/types/user";
import { LoginQrCard } from "@/components/LHU_UI/LoginQrCard";
import {
  AttendanceResultsPanel,
  LinkedAccountsPanel,
  type AttendanceResult,
} from "@/components/LHU_UI/LinkedAccountsPanel";

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
  const [accountSessions, setAccountSessions] = useState<UserSession[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [attendanceResults, setAttendanceResults] = useState<AttendanceResult[]>([])
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false)
  const accountSessionsRef = useRef<UserSession[]>([])
  const selectedUserIdsRef = useRef<Set<string>>(new Set())
  const [monHocDaDiemDanh, setMonHocDaDiemDanh] = useState<string | null>(null)
  const [zoomRange, setZoomRange] = useState<{min: number, max: number} | null>(null);
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

  const getCamera = useCallback(async () => {
    // Try React Native camera first, then attempt web camera regardless of React Native response.
    // This provides a graceful fallback if React Native camera is unavailable or fails.
    if (isReactNativeWebView) {
      openReactNativeCamera();
    }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: "environment"}, audio: false});
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        const capabilities = track.getCapabilities?.();
        // @ts-expect-error Zoom can be unavailable on some devices
        if (capabilities?.zoom) {
          setZoomRange({
            // @ts-expect-error Zoom can be unavailable on some devices
            min: capabilities.zoom.min,
            // @ts-expect-error Zoom can be unavailable on some devices
            max: capabilities.zoom.max,
          });
        }
      } catch (err) {
        console.error("Lỗi khi truy cập camera:", err);
      }
  }, [isReactNativeWebView, openReactNativeCamera]);

  const refreshAccountSessions = useCallback(async (selectUserId?: string) => {
    const currentToken = AuthStorage.getUserToken();
    const currentUser = AuthStorage.getUser();

    if (currentToken && currentUser) {
      await multiSessionService.createSession(currentToken, currentUser);
    }

    const sessions = await multiSessionService.getAllUserSessions();
    setAccountSessions(sessions);
    setSelectedUserIds((previous) => {
      const availableIds = new Set(sessions.map((session) => session.user_id));
      const next = new Set(Array.from(previous).filter((userId) => availableIds.has(userId)));

      if (next.size === 0 && currentUser?.UserID && availableIds.has(currentUser.UserID)) {
        next.add(currentUser.UserID);
      }
      if (selectUserId && availableIds.has(selectUserId)) {
        next.add(selectUserId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    refreshAccountSessions().catch((cause) => {
      console.error('Không thể tải danh sách tài khoản liên kết:', cause);
    });
  }, [refreshAccountSessions]);

  useEffect(() => {
    accountSessionsRef.current = accountSessions;
  }, [accountSessions]);

  useEffect(() => {
    selectedUserIdsRef.current = selectedUserIds;
  }, [selectedUserIds]);

  useEffect(() => {
    let cancelled = false;
    
    const handleZoom = async () => {
      const track = trackRef.current;
      if (!track) return;
      
      const capabilities = track.getCapabilities?.();
    // @ts-expect-error Zoom can be unavailable on some devices
      if (!capabilities?.zoom) {
        console.warn('Zoom not supported');
        return;
      }
      
      // Clamp scale to camera's min/max zoom capabilities
    // @ts-expect-error Zoom can be unavailable on some devices
      const { min, max } = capabilities.zoom;
      const clampedScale = Math.min(Math.max(scale, min), max);
      
      if (clampedScale !== scale) {
        console.warn(`Scale ${scale} out of range [${min}, ${max}], clamped to ${clampedScale}`);
      }
      
      try {
        console.log(`Zooming to ${clampedScale} (range: ${min}-${max})`);
        await track.applyConstraints({
        // @ts-expect-error Zoom can be unavailable on some devices
          advanced: [{ zoom: clampedScale }]
        });
        
        if (!cancelled) {
          console.log("Zoom applied successfully");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to apply zoom:", error);
        }
      }
    };
    
    handleZoom();
    
    return () => {
      cancelled = true;
    };
  }, [scale]);


  useEffect(() => {
    if (!videoRef.current) return;

    getCamera()

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        // console.log("decoded qr code:", result);
        setScanned(result.data);
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );
    setQrScanner(scanner);
    setError(null)
    scanner.start().catch((error) => {
      if (error instanceof Error) {
        toast.error("Mở camera thất bại: " + error.message)
      }
      console.error ("Mở camera thất bại: " + error)
    });

    return () => {
      scanner.stop();
      scanner.destroy();
      if (trackRef.current) {
        trackRef.current.stop()
      }
      
    };
  }, [getCamera]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const { type, code } = extractQrFromMessage(event.data);

      // Handle event qr scan từ React Native
      if (type === "QR_SCANNED" && typeof code === "string" && code.trim() !== "") {
        setScanned(code);
      }
    };

    // In React Native WebView, messages may arrive on `document` instead of `window`.
    window.addEventListener("message", onMessage as EventListener);
    document.addEventListener("message", onMessage as EventListener);
    return () => {
      window.removeEventListener("message", onMessage as EventListener);
      document.removeEventListener("message", onMessage as EventListener);
    };
  }, [extractQrFromMessage, isReactNativeWebView]);

  useEffect(() => {

    const processScanned = async () => {

      setError(null)
      setIsExpiredQR(false)
      setDialogExpiredQROpen(false)

      if (scanned === "") return

      if (scanned.startsWith("http")) {
        window.open(scanned)
        return
      }

      const access_token = localStorage.getItem("access_token")
      if (!access_token) {setError("Đăng nhập để sử dụng"); return}
      // Nếu không phải là QR STB (điểm danh sổ đầu bài) hoặc LGN (đăng nhập) hoặc LIB (điểm danh sử dụng phòng thư viện) thì nổ lỗi
      const SUBSTR = scanned.substring(0,3)
      if (scanned !== "" && SUBSTR !== "STB" && SUBSTR !== "LGN" && SUBSTR !== "LIB") {
        setError("QR này không được hỗ trợ...")
        return
      }

      qrScanner?.pause()
      .then(() => {console.log("Tạm dừng camera vì đã tìm thấy QR phù hợp")})
      .catch((error) => {
        console.log("Thất bại trong việc nỗ lực dừng camera" + error)
      })

      if (SUBSTR === "STB") {
        const targets = accountSessionsRef.current.filter((session) =>
          selectedUserIdsRef.current.has(session.user_id)
        );

        if (targets.length === 0) {
          setError("Chọn ít nhất một tài khoản trước khi điểm danh");
          return;
        }

        setIsBatchSubmitting(true);
        setAttendanceResults([]);
        try {
          const results = await Promise.all(
            targets.map(async (session): Promise<AttendanceResult> => {
              try {
                const response = await ApiService.send_diem_danh(scanned, session.token);
                if (response?.success) {
                  return {
                    user: session.user,
                    status: 'success',
                    message: `Đã gửi lúc ${dayjs().format('HH:mm:ss')}`,
                  };
                }
                return {
                  user: session.user,
                  status: 'error',
                  message: String(response?.error || 'Không nhận được phản hồi'),
                };
              } catch (cause) {
                return {
                  user: session.user,
                  status: 'error',
                  message: cause instanceof Error ? cause.message : 'Lỗi không xác định',
                };
              }
            })
          );

          setAttendanceResults(results);
          const successCount = results.filter((result) => result.status === 'success').length;
          const expired = results.some((result) => result.message.toLowerCase().includes('hết hạn'));
          setIsSuccess(successCount > 0);
          setMonHocDaDiemDanh(`${successCount}/${targets.length} tài khoản`);
          setIsExpiredQR(expired);
          setDialogExpiredQROpen(expired);

          if (successCount > 0) {
            toast.success(`Điểm danh thành công ${successCount}/${targets.length} tài khoản`);
          } else {
            setError(
              results.find((result) => result.status === 'error')?.message ||
                'Không tài khoản nào điểm danh thành công',
            );
            toast.error('Điểm danh thất bại cho tất cả tài khoản');
          }
        } finally {
          setIsBatchSubmitting(false);
        }
      } else if (SUBSTR === "LGN") {
        Promise.resolve().then(async () => {
          const newUser = await authService.send_login(scanned)
          if (newUser) {
            await refreshAccountSessions(newUser.UserID)
            setIsSuccess(true)
            toast.success(`Đã liên kết ${newUser.FullName || newUser.UserID}`)
          }
        }).catch((error) => {
          if (error instanceof Error) {
            setError(error.message)
          }
        })
      } else if (SUBSTR === "LIB") {
        try {
          const res = await ApiService.elib_scanCode(scanned, access_token)
          if (!res) return

          if (!res.success) {
            const errorMessage = String(res.error)
            setError(errorMessage)
          }
          else { 
            setIsSuccess(true)
            toast.success(`Quét mã thư viện thành công - ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`)
          }

        } catch (error) {
          if (error instanceof Error) {
            if (error.message.toLowerCase() === "failed to fetch") {
              toast.error("Lỗi mạng, vui lòng kiểm tra lại kết nối")
            }
            else {
              toast.error("Đã xảy ra lỗi không mong muốn, hãy thử lại")
            }
          }
        }
    }}

    processScanned();

    return () => {
      setScanned("");
      setIsSuccess(false)
      setError(null)
      setIsExpiredQR(false)
      setDialogExpiredQROpen(false)
    }

  }, [scanned, qrScanner, refreshAccountSessions])

  const handleReset = async () => {
    setScanned("");
    setIsSuccess(false)
    setError(null)
    setMonHocDaDiemDanh(null)
    setIsExpiredQR(false)
    setDialogExpiredQROpen(false)
    setAttendanceResults([])
    setIsBatchSubmitting(false)
    await toast.promise(
      async () => {qrScanner?.start(); await getCamera()},
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

      if (lastDistance.current) {
        const zoomFactor = distance / lastDistance.current;
        setScale((prev) => Math.min(Math.max(prev * zoomFactor, 1), zoomRange?.max || 10)); // zoom range 1x to devide's maximum zoom range (or 10x for falling back)
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

  const handleToggleAccount = (userId: string, checked: boolean) => {
    setSelectedUserIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const handleSelectAllAccounts = () => {
    setSelectedUserIds((previous) =>
      previous.size === accountSessions.length
        ? new Set()
        : new Set(accountSessions.map((session) => session.user_id))
    );
  };

  const handleRemoveAccount = async (userId: string) => {
    try {
      await multiSessionService.deleteUserCompletely(userId);
      setSelectedUserIds((previous) => {
        const next = new Set(previous);
        next.delete(userId);
        return next;
      });
      await refreshAccountSessions();
      toast.success('Đã xóa tài khoản liên kết');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Không thể xóa tài khoản');
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-6xl flex-col items-center py-4 text-foreground sm:py-6">
      {/* App Bar */}
      <div className="mb-4 w-full">
        <div className="bg-section text-section-foreground border-2 border-border rounded-t-md shadow-brutal px-4 py-4">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" strokeWidth={2.5} />
            <h1 className="text-xl font-display font-bold">Quét mã điểm danh</h1>
            <FaRegQuestionCircle size={25} className="ml-auto cursor-pointer opacity-70 hover:opacity-100" onClick={handleDialog} />
          </div>
        </div>
      </div>

      <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="flex min-w-0 flex-col gap-4">
      {/* Main Card */}
      <Card className="w-full overflow-hidden bg-card">
        <CardContent className="p-0">
          {/* Scanner Container */}
          <div className="relative mx-2 mt-2 bg-black overflow-hidden border-2 border-border rounded-md">
            <div
              className="relative w-full aspect-square touch-none"
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
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
                      {isBatchSubmitting
                        ? `Đang điểm danh cho ${selectedUserIds.size} tài khoản...`
                        : "Đang quét QR..."}
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

          <AttendanceResultsPanel results={attendanceResults} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <LinkedAccountsPanel
            sessions={accountSessions}
            selectedUserIds={selectedUserIds}
            currentUserId={AuthStorage.getUser()?.UserID}
            disabled={isBatchSubmitting}
            onToggle={handleToggleAccount}
            onSelectAll={handleSelectAllAccounts}
            onRemove={handleRemoveAccount}
          />
          <LoginQrCard />
        </div>
      </div>

      {/* FAB-style zoom reset (optional) */}
      {scale > 1 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setScale(1)}
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
