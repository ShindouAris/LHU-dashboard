import React, { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, QrCode, RefreshCw } from "lucide-react";
import { ApiService } from "@/services/apiService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs"
import { FaRegQuestionCircle } from "react-icons/fa";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import { authService } from "@/services/authService";

export const QRScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isLoginQR, setIsLoginQR] = useState(false)
  const [scanned, setScanned] = useState<string>("");
  const [scale, setScale] = useState<number>(1);
  const [error, setError] = useState<null | string>(null)
  const [success, setIsSuccess] = useState<boolean>(false)
  const [dialogTutorialOpen, setDialogTutorialOpen] = useState<boolean>(false)
  const nav = useNavigate()

  const getCamera = async () => {
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
  
  handleZoom().then(() => {

  });
  
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
    };
  }, []);

  useEffect(() => {

    setError(null)

    if (scanned === "") return

    if (scanned.startsWith("http")) {
      window.open(scanned)
      return
    }

    const access_token = localStorage.getItem("access_token")

    if (!access_token) {setError("Đăng nhập để sử dụng"); return}
    // Nếu không phải là QR STB (điểm danh sổ đầu bài) hoặc LGN (đăng nhập) thì nổ lỗi
    const SUBSTR = scanned.substring(0,3)
    if (scanned !== "" && SUBSTR !== "STB" && SUBSTR !== "LGN") {
      setError("QR này không được hỗ trợ...")
      return
    }

    qrScanner?.pause()
    .then(() => {console.log("Tạm dừng camera vì đã tìm thấy QR phù hợp")})
    .catch((error) => {
      console.log("Thất bại trong việc nỗ lực dừng camera" + error)
    })

    if (SUBSTR === "STB") {
      ApiService.send_diem_danh(scanned, access_token).then((res) => {
        
        if (!res) return

        if (!res.success) {
          setError(String(res.error))
        }
        else { 
          setIsSuccess(true)
          toast.success(`Điểm danh thành công - ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`)
        }}) 
    } else if (SUBSTR === "LGN") {
      authService.send_login(scanned).then((res) => {
        if (res) {
          toast.success("Đăng nhập thành công")
          setIsSuccess(true)
          setIsLoginQR(true)
        }
      }).catch((error) => {
        if (error instanceof Error) {
          setError(error.message)
        }
      })
    }
  }, [scanned])

  const handleReset = async () => {
    setScanned("");
    setIsSuccess(false)
    setIsLoginQR(false)
    setError(null)
    await toast.promise(
      async () => {qrScanner?.start(); await getCamera()},
      {
        loading: "Đang khởi động camera",
        success: "Khởi động camera thành công",
        error: "Không thể khởi động camera"
      }
    )
  };

  const handleBack = () => {
    setScanned("")
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
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-900 select-none p-4">
      {/* App Bar */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-blue-600 text-white px-4 py-4 rounded-t-lg shadow-md">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" />
            <h1 className="text-xl font-medium">Quét mã điểm danh</h1>
            <FaRegQuestionCircle size={25} className="ml-auto" onClick={handleDialog} />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
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
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
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
                  className="bg-green-50 border-l-4 border-green-500 p-4 rounded"
                >
                  <div className="flex items-start">
                    {/* <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> */}
                    <img className="w-8 h-8" src="/Success.gif" alt="Success"/>
                    <div className="flex-1">
                      <p className="text-green-800 font-medium text-sm">
                        {scanned.substring(0,3) === "STB" ? "Điểm danh thành công" : scanned.substring(0,3) === "LGN" ? "Đăng nhập thành công" : ""}
                      </p>
                      <p className="text-green-700 text-xs mt-1 break-all">
                        {scanned.substring(0,3) === "STB" ? scanned : "Quét QR đăng nhập thành công"}
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
                  className="bg-red-50 border-l-4 border-red-500 p-4 rounded"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium text-sm">Lỗi</p>
                      <p className="text-red-700 text-xs mt-1 break-all">
                        {error}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-blue-800 text-sm">
                      Đang quét QR...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Helper Text */}
            <p className="text-gray-500 text-xs text-center mt-4">
              Sử dụng hai ngón tay để phóng to/thu nhỏ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-4 pt-0">
            <Button
              onClick={handleBack}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded shadow-md hover:shadow-lg transition-all duration-200 py-6 font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Trở về
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md hover:shadow-lg transition-all duration-200 py-6 font-medium"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAB-style zoom reset (optional) */}
      {scale > 1 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setScale(1)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
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
    </div>
  );
};
