export type DevicePlatform = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';
export type DeviceArch = 'arm64' | 'x64' | null;

interface UserAgentDataLike {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
  }>;
}

// lib.dom cũng khai báo navigator.userAgentData với kiểu riêng, nên ép qua unknown
// để dùng đúng interface tối thiểu ở trên thay vì giao hai kiểu không tương thích.
const getUserAgentData = (): UserAgentDataLike | undefined => {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as unknown as { userAgentData?: UserAgentDataLike }).userAgentData;
};

/**
 * Nhận diện nền tảng ở mức "đủ tốt" cho trang tải ứng dụng.
 *
 * Lưu ý: iPadOS 13+ cố tình gửi user agent giống Safari trên máy Mac
 * ("Macintosh; Intel Mac OS X"), nên chỉ có khả năng cảm ứng mới phân biệt
 * được iPad với Mac thật.
 */
export function detectPlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent || '';
  const uaData = getUserAgentData();
  const platform = uaData?.platform || navigator.platform || '';

  // ChromeOS không chạy được bản Electron Linux; để người dùng tự chọn.
  if (/cros/i.test(ua)) return 'unknown';

  if (/iphone|ipod|ipad/i.test(ua)) return 'ios';
  if (/macintosh|mac os x/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';

  if (/android/i.test(ua)) return 'android';
  if (/windows|win32|win64|wow64/i.test(ua) || /^win/i.test(platform)) return 'windows';
  if (/macintosh|mac os x/i.test(ua) || /^mac/i.test(platform)) return 'macos';
  if (/linux|x11/i.test(ua) || /^linux/i.test(platform)) return 'linux';

  return 'unknown';
}

/**
 * Kiến trúc CPU, dùng để chọn asset arm64 hay x64 khi bản phát hành có cả hai.
 * Client Hints chỉ có trên trình duyệt Chromium; nơi khác trả về null và UI
 * sẽ hiển thị cả hai lựa chọn.
 */
export async function detectArch(): Promise<DeviceArch> {
  if (typeof navigator === 'undefined') return null;

  const uaData = getUserAgentData();
  if (uaData?.getHighEntropyValues) {
    try {
      const { architecture, bitness } = await uaData.getHighEntropyValues([
        'architecture',
        'bitness',
      ]);
      if (architecture === 'arm') return 'arm64';
      if (architecture === 'x86') return bitness === '64' ? 'x64' : null;
    } catch {
      // Client Hints là tùy chọn và có thể bị permissions policy chặn.
    }
  }

  const ua = navigator.userAgent || '';
  if (/arm64|aarch64/i.test(ua)) return 'arm64';
  if (/win64|x64|x86_64|wow64/i.test(ua)) return 'x64';
  return null;
}
