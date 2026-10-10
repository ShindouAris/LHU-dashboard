import type { Mat } from '@techstark/opencv-js';
import QrScanner from 'qr-scanner';

export type ZoomRange = { min: number; max: number; step?: number };
type Detector = { detect(image: Mat, points: Mat): boolean; delete(): void };
export type Cv = typeof import('@techstark/opencv-js') & { QRCodeDetector: new () => Detector };
let loading: Promise<{ cv: Cv }> | undefined;

export function loadQrCv(): Promise<{ cv: Cv }> {
  if (!loading) loading = new Promise<{ cv: Cv }>((resolve, reject) => {
    let settled = false;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => finish(undefined, new Error('OpenCV load timeout')), 15000);
    function finish(cv?: Cv, error?: Error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      if (cv) resolve({ cv }); else reject(error);
    }
    import('@techstark/opencv-js/dist/opencv.js?url').then(({ default: url }) => {
      if (settled) return;
      script.src = url;
      script.onerror = () => finish(undefined, new Error('OpenCV unavailable'));
      script.onload = () => {
        const cv = (window as unknown as { cv?: Cv & { then?: (callback: () => void) => void } }).cv;
        if (!cv) { finish(undefined, new Error('OpenCV unavailable')); return; }
        // OpenCV is a self-resolving thenable: never assimilate it into a Promise.
        if (cv.Mat) finish(cv); else if (cv.then) cv.then(() => finish(cv));
        else finish(undefined, new Error('OpenCV initialization failed'));
      };
      document.head.appendChild(script);
    }, () => finish(undefined, new Error('OpenCV asset unavailable')));
  });
  return loading;
}

export function detectQrBounds(cv: Cv, detector: Detector, image: Mat) {
  const gray = new cv.Mat();
  const points = new cv.Mat();
  try {
    cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);
    if (!detector.detect(gray, points)) return null;
    const coordinates = Array.from(points.data32F).slice(0, 8);
    if (coordinates.length !== 8 || !coordinates.every(Number.isFinite)) return null;
    const xs = coordinates.filter((_, i) => i % 2 === 0);
    const ys = coordinates.filter((_, i) => i % 2 === 1);
    const left = Math.min(...xs), top = Math.min(...ys);
    const width = Math.max(...xs) - left, height = Math.max(...ys) - top;
    if (width < 8 || height < 8) return null;
    const padding = Math.max(width, height) * 0.2;
    const x = Math.max(0, Math.floor(left - padding)), y = Math.max(0, Math.floor(top - padding));
    return { x, y, width: Math.min(image.cols, Math.ceil(left + width + padding)) - x, height: Math.min(image.rows, Math.ceil(top + height + padding)) - y };
  } finally { gray.delete(); points.delete(); }
}

export function nextAutoZoom(current: number, range: ZoomRange | null, fraction: number) {
  if (!range || !Number.isFinite(fraction) || fraction <= 0 || fraction >= 0.35) return null;
  const step = range.step || 0.1;
  const zoom = Math.min(range.max, Math.max(range.min, range.min + Math.round((Math.min(current * 1.4, current * 0.35 / fraction) - range.min) / step) * step));
  return zoom > current + step / 2 ? Number(zoom.toFixed(6)) : null;
}

export function startQrAssist(video: HTMLVideoElement, accept: (code: string) => void, zoom: (fraction: number) => void, generation: () => number) {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let detector: Detector | undefined;
  const frame = document.createElement('canvas'), crop = document.createElement('canvas'), source = document.createElement('canvas');
  const context = frame.getContext('2d', { willReadFrequently: true });
  const cropContext = crop.getContext('2d');
  const sourceContext = source.getContext('2d');
  void loadQrCv().then(({ cv }) => {
    if (cancelled || !context || !cropContext || !sourceContext) return;
    detector = new cv.QRCodeDetector();
    const tick = async () => {
      const session = generation();
      try {
        if (!cancelled && !video.paused && video.videoWidth && video.videoHeight) {
          const ratio = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
          frame.width = Math.round(video.videoWidth * ratio); frame.height = Math.round(video.videoHeight * ratio);
          source.width = video.videoWidth; source.height = video.videoHeight;
          sourceContext.drawImage(video, 0, 0);
          context.drawImage(source, 0, 0, frame.width, frame.height);
          const image = cv.imread(frame);
          let bounds;
          try { bounds = detectQrBounds(cv, detector!, image); } finally { image.delete(); }
          if (bounds && !cancelled) {
            const cx = (bounds.x + bounds.width / 2) / frame.width, cy = (bounds.y + bounds.height / 2) / frame.height;
            // Only center-safe QR targets: hardware zoom crops around the sensor center.

            const x = bounds.x / ratio, y = bounds.y / ratio, w = bounds.width / ratio, h = bounds.height / ratio;
            const upscale = Math.min(4, 800 / Math.max(w, h));
            crop.width = Math.round(w * upscale); crop.height = Math.round(h * upscale);
            cropContext.imageSmoothingEnabled = false;
            cropContext.drawImage(source, x, y, w, h, 0, 0, crop.width, crop.height);
            if (cancelled) return;
            try {
              const result = await QrScanner.scanImage(crop, { returnDetailedScanResult: true });
              if (!cancelled && session === generation()) accept(result.data);
            } catch {
              if (!cancelled && session === generation() && Math.abs(cx - 0.5) < 0.1 && Math.abs(cy - 0.5) < 0.1) {
                zoom(Math.max(bounds.width / frame.width, bounds.height / frame.height));
              }
            }
          }
        }
      } catch { /* No detection/decode: normal qr-scanner remains active. */ }
      finally { if (!cancelled) timer = setTimeout(tick, 500); }
    };
    void tick();
  }).catch(() => { /* Offline/load failure: keep the standard scanner. */ });
  return () => { cancelled = true; clearTimeout(timer); detector?.delete(); detector = undefined; };
}
