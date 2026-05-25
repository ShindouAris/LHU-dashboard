import React, { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, /* CardHeader */ } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, QrCode, RefreshCw, AlertTriangle, UserPlus, CheckCircle2 } from "lucide-react";
import { ApiService } from "@/services/apiService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs"
import { FaRegQuestionCircle } from "react-icons/fa";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog.tsx";
import { authService } from "@/services/authService";
import { multiSessionService } from "@/services/multisession";
import { UserResponse } from "@/types/user";
import { DiemDanhOut } from "@/types/schedule";

export const QRScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  // @ts-ignore
  const [isLoginQR, setIsLoginQR] = useState(false)
  const [scanned, setScanned] = useState<string>("");
  const [scale, setScale] = useState<number>(1);
  const [error, setError] = useState<null | string>(null)
  const [isExpiredQR, setIsExpiredQR] = useState<boolean>(false)
  const [success, setIsSuccess] = useState<boolean>(false)
  const [dialogTutorialOpen, setDialogTutorialOpen] = useState<boolean>(false)
  const [dialogExpiredQROpen, setDialogExpiredQROpen] = useState<boolean>(false)
  const [usersList, setUsersList] = useState<UserResponse[]>([])
  const [newlyAddedUser, setNewlyAddedUser] = useState<UserResponse | null>(null)
  const [showUserListAnimation, setShowUserListAnimation] = useState<boolean>(false)
  const [snapshotData, setSnapshotData] = useState<DiemDanhOut[] | null>(null)
  const [monHocDaDiemDanh, setMonHocDaDiemDanh] = useState<string | null>(null)
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

  const openReactNativeCamera = () => {
    if (!isReactNativeWebView) return;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "DASHBOARD_REQUEST_CAMERA_ACCESS",
        payload: "",
    })
    )
  }

  const getCamera = async () => {
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
        trackRef.current = stream.getVideoTracks()[0];
      } catch (err) {
        console.error("Lỗi khi truy cập camera:", err);
      }
  };

  const [zoomRange, setZoomRange] = useState<{min: number, max: number} | null>(null);

// Get capabilities when track is ready
  useEffect(() => {
    const track = trackRef.current;
    if (track) {
      const capabilities = track.getCapabilities?.();
     // @ts-expect-error Zoom can be unavailable on some devices
      if (capabilities?.zoom) {
        setZoomRange({
         // @ts-expect-error Zoom can be unavailable on some devices
          min: capabilities.zoom.min,
         // @ts-expect-error Zoom can be unavailable on some devices
          max: capabilities.zoom.max
        });
       // @ts-expect-error Zoom can be unavailable on some devices
        console.log('Camera zoom range:', capabilities.zoom);
      }
    }
  }, [trackRef.current]);

  const loadSnapshot = async () => {

      const access_token = localStorage.getItem("access_token")
      if (!access_token) return;
      try {
        const res = await ApiService.get_lms_diem_danh(access_token)

        if (res && res.data.length > 0) {
          setSnapshotData(res.data)
        }

      } catch (error) {
        console.error("Lỗi khi lấy snapshot điểm danh:", error);
      }
    }

  const filterData = useCallback((oldSnapshot: DiemDanhOut[], newSnapshot: DiemDanhOut[]) => {

    let changed = null;

    const getKey = (item: DiemDanhOut) =>
    `${item.TenMonHoc}|${item.NgayHoc}|${item.HoTenGV}`;

    const oldMap = new Map<string, DiemDanhOut>();
    oldSnapshot.filter(item => {(item.TrangThai === 2 || item.TrangThai === 1)}).forEach(item => oldMap.set(getKey(item), item));

    if (oldSnapshot.length < newSnapshot.length) {
      for (const item of newSnapshot) {
        if (!oldMap.has(getKey(item))) {
          changed = item;
          break;
        }
    }
    } else if (oldSnapshot.length === newSnapshot.length) {
        for (const item of newSnapshot) {
          const oldItem = oldMap.get(getKey(item));
          if (oldItem && oldItem.TrangThai !== item.TrangThai) {
            changed = item
          }
        }
    }

    return changed;
    
  }, []);

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
  }, []);

  useEffect(() => {
    const load = async () => {
        await loadSnapshot().catch(e =>  console.error("Lỗi khi tải snapshot điểm danh:", e)); // Catch immediately so it doesn't block main function (send_diem_danh)
    };

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
    load();

    return () => {
      window.removeEventListener("message", onMessage as EventListener);
      document.removeEventListener("message", onMessage as EventListener);
    };
  }, [extractQrFromMessage, isReactNativeWebView]);

  useEffect(() => {

    const useScanned = async () => {

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
        try {
          const res = await ApiService.send_diem_danh(scanned, access_token);
          if (!res) return;

          if (!res.success) {
            const errorMessage = String(res.error);
            setError(errorMessage);
            // Check if it's an expired QR code error
            if (
              errorMessage.includes("Mã QR điểm danh đã hết hạn") ||
              errorMessage.includes("hết hạn")
            ) {
              setIsExpiredQR(true);
              setDialogExpiredQROpen(true);
              toast.error("⚠️ Mã QR điểm danh đã hết hạn!", {
                duration: 5000,
                style: {
                  background: "#f38ba8",
                  color: "#1e1e2e",
                  fontWeight: "bold",
                },
              });
            } else {
              setIsExpiredQR(false);
              setDialogExpiredQROpen(false);
            }
          } else {
            setIsSuccess(true);
            setIsExpiredQR(false);
            const nowSnapShot = await ApiService.get_lms_diem_danh(access_token); // Fetch latest data for snapshot comparison
            const changedItem = filterData(snapshotData || [], nowSnapShot.data || []);
            try {
                if (changedItem) {
                toast.success(`Điểm danh thành công cho môn ${changedItem.TenMonHoc}}`);
                setMonHocDaDiemDanh(changedItem.TenMonHoc)
              } else {
                toast.success(
                  `Điểm danh thành công - ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`
                );
            }

            } catch (e) {
              toast.success(
                  `Điểm danh thành công - ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`
                );
                console.log("Lỗi khi hiển thị thông báo môn học đã điểm danh: ", e);
            }
            
          }
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.toLowerCase() === "failed to fetch") {
              toast.error("Lỗi mạng, vui lòng kiểm tra lại kết nối");
            } else {
              toast.error(
                "Đã xảy ra lỗi không mong muốn, hãy điểm danh lại bằng Quét QR trong ME"
              );
            }
          }
        }
      } else if (SUBSTR === "LGN") {
        // Fetch users before login
        multiSessionService.getAllUsers().then(async (existingUsers) => {
          setUsersList(existingUsers)
          
          // Perform login
          const newUser = await authService.send_login(scanned)
          
          if (newUser) {
            // Fetch updated users list after login
            const updatedUsers = await multiSessionService.getAllUsers()
            setUsersList(updatedUsers)
            setNewlyAddedUser(newUser)
            setShowUserListAnimation(true)
            setIsSuccess(true)
            setIsLoginQR(true)
            
            // Hide animation after 4 seconds
            setTimeout(() => {
              setShowUserListAnimation(false)
              setNewlyAddedUser(null)
            }, 4000)
            
            toast.success("Đăng nhập thành công")
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

    useScanned();

    return () => {
      setScanned("");
      setIsSuccess(false)
      setIsLoginQR(false)
      setError(null)
      setIsExpiredQR(false)
      setDialogExpiredQROpen(false)
      setSnapshotData(null)
    }

  }, [scanned])

  const handleReset = async () => {
    setScanned("");
    setIsSuccess(false)
    setIsLoginQR(false)
    setError(null)
    setMonHocDaDiemDanh(null)
    setIsExpiredQR(false)
    setDialogExpiredQROpen(false)
    setShowUserListAnimation(false)
    setNewlyAddedUser(null)
    setUsersList([])
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-foreground select-none p-4">
      {/* App Bar */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-gradient-to-r from-[#cba6f7] to-[#b4befe] text-[#1e1e2e] px-4 py-4 rounded-t-lg shadow-md">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" />
            <h1 className="text-xl font-medium">Quét mã điểm danh</h1>
            <FaRegQuestionCircle size={25} className="ml-auto text-[#1e1e2e]/70 hover:text-[#1e1e2e]" onClick={handleDialog} />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md bg-card border border-border shadow-lg rounded-lg overflow-hidden">
        <CardContent className="p-0">
          {/* Scanner Container */}
          <div className="relative w-full bg-black overflow-hidden">
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
                <div className="absolute top-4 right-4 bg-[#1e1e2e]/70 text-[#cdd6f4] px-3 py-1 rounded-full text-sm font-medium">
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
                  className="bg-[#a6e3a1]/15 border-l-4 border-[#a6e3a1] p-4 rounded"
                >
                  <div className="flex items-start">
                    <img className="w-8 h-8" src="/Success.gif" alt="Success"/>
                    <div className="flex-1">
                      <p className="text-[#40a02b] dark:text-[#a6e3a1] font-medium text-sm">
                        {
                        scanned.substring(0,3) === "STB" ? "Điểm danh thành công" : 
                        scanned.substring(0,3) === "LGN" ? "Đăng nhập thành công" :
                        scanned.substring(0,3) === "LIB" ? "Quét mã thư viện thành công" : "Thành công"
                        }
                      </p>
                      <p className="text-[#40a02b]/80 dark:text-[#a6e3a1]/80 text-xs mt-1 break-all">
                        {scanned.substring(0,3) === "STB" ? monHocDaDiemDanh ? `Môn học: ${monHocDaDiemDanh}` : scanned :
                        scanned.substring(0,3) === "LGN" ? "Đăng nhập thành công" : 
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
                      ? "bg-[#f38ba8]/20 border-l-4 border-[#f38ba8] shadow-lg ring-2 ring-[#f38ba8]/30" 
                      : "bg-[#f38ba8]/10 border-l-4 border-[#f38ba8]"
                  } p-4 rounded`}
                >
                  <div className="flex items-start gap-3">
                    {isExpiredQR ? (
                      <AlertTriangle className="w-6 h-6 text-[#f38ba8] flex-shrink-0 mt-0.5 animate-pulse" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#f38ba8] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`${isExpiredQR ? "text-[#d20f39] dark:text-[#f38ba8] font-bold text-base" : "text-[#d20f39] dark:text-[#f38ba8] font-medium text-sm"}`}>
                        {isExpiredQR ? "Cảnh báo: Mã QR đã hết hạn" : "Lỗi"}
                      </p>
                      <p className={`${isExpiredQR ? "text-[#d20f39] dark:text-[#f38ba8] font-semibold" : "text-[#d20f39] dark:text-[#f38ba8]"} text-xs mt-1 break-all`}>
                        {error}
                      </p>
                      {isExpiredQR && (
                        <p className="text-[#d20f39] dark:text-[#f38ba8] text-xs mt-2 italic">
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
                  className="bg-[#89b4fa]/15 border-l-4 border-[#89b4fa] p-4 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 border-4 border-[#45475a] border-t-[#89b4fa] rounded-full animate-spin"></div>
                    <p className="text-[#1e66f5] dark:text-[#89b4fa] text-sm">
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
              <ArrowLeft className="w-5 h-5 mr-2" />
              Trở về
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1 bg-[#8839ef] hover:bg-[#6a1fd4] text-white rounded shadow-md hover:shadow-lg transition-all duration-200 py-6 font-medium"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List Card - Shows when LGN QR is scanned */}
      {showUserListAnimation && newlyAddedUser && (
        <Card className="w-full max-w-md mt-4 border-2 border-[#a6e3a1] bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-5 h-5 text-[#40a02b] dark:text-[#a6e3a1]" />
              <h3 className="font-semibold text-foreground">Người dùng đã được thêm</h3>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {usersList.map((user) => {
                const isNewUser = user.UserID === newlyAddedUser.UserID;
                return (
                  <div
                    key={user.UserID}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isNewUser ? "bg-[#a6e3a1]/15 ring-2 ring-[#a6e3a1] shadow-md" : ""
                    }`}
                  >
                    <div className="relative">
                      {user.Avatar ? (
                        <img
                          src={user.Avatar}
                          alt={user.FullName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#8839ef] flex items-center justify-center text-white font-semibold">
                          {user.FullName?.charAt(0) || user.UserName?.charAt(0) || "?"}
                        </div>
                      )}
                      {isNewUser && (
                        <div className="absolute -top-1 -right-1 bg-[#a6e3a1] rounded-full p-0.5">
                          <CheckCircle2 className="w-4 h-4 text-[#1e1e2e]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${
                        isNewUser ? "text-[#40a02b] dark:text-[#a6e3a1] font-semibold" : "text-foreground"
                      }`}>
                        {user.FullName || user.UserName || "Người dùng"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.UserID} {user.Class ? `• ${user.Class}` : ""}
                      </p>
                    </div>
                    {isNewUser && (
                      <div className="text-[#40a02b] dark:text-[#a6e3a1] text-xs font-semibold">
                        Mới
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Tổng số: <span className="font-semibold text-[#40a02b] dark:text-[#a6e3a1]">{usersList.length}</span> người dùng
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAB-style zoom reset (optional) */}
      {scale > 1 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setScale(1)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#8839ef] hover:bg-[#6a1fd4] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
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
                        className="rounded-lg w-full max-h-[70vh] object-contain"
                    />
                </DialogDescription>
            </DialogContent>
        </Dialog>

        {/* Expired QR Code Warning Dialog */}
        <Dialog open={dialogExpiredQROpen} onOpenChange={setDialogExpiredQROpen}>
            <DialogContent className="max-w-md border-[#f38ba8] border-2 bg-card">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-8 h-8 text-[#f38ba8] animate-pulse" />
                        <DialogTitle className="text-foreground text-xl font-bold">
                            CẢNH BÁO: Mã QR đã hết hạn
                        </DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription className="text-foreground space-y-3">
                    <p className="font-semibold text-base">
                        Mã QR điểm danh bạn vừa quét đã hết hạn sử dụng.
                    </p>
                    <div className="bg-[#f38ba8]/10 p-3 rounded-lg border border-[#f38ba8]/30">
                        <p className="text-sm font-medium text-[#d20f39] dark:text-[#f38ba8] mb-1">
                            Chi tiết lỗi:
                        </p>
                        <p className="text-sm text-[#d20f39] dark:text-[#f38ba8] break-all">
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
                        className="bg-[#f38ba8] hover:bg-[#eba0ac] text-[#1e1e2e] font-semibold"
                    >
                        Đã hiểu
                    </Button>
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="border-[#f38ba8]/50 text-[#d20f39] dark:text-[#f38ba8] hover:bg-[#f38ba8]/10"
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