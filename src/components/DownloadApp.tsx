import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Download,
  ExternalLink,
  Info,
  Laptop,
  Monitor,
  Share,
  Smartphone,
  TabletSmartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ANDROID_REPO,
  DESKTOP_REPO,
  buildDownloadLinks,
  getLatestRelease,
  type DownloadLink,
  type ReleaseInfo,
} from '@/services/appReleaseService';
import {
  detectArch,
  detectPlatform,
  type DeviceArch,
  type DevicePlatform,
} from '@/utils/deviceUtils';

// Giữ nguyên từng ký tự theo yêu cầu sản phẩm (kể cả lỗi chính tả và dấu **).
const IMAGE_DISCLAIMER =
  'Ảnh minh hoạ, thông tin cá nhân bị che mờ bằng **AI** Vì tôi lười setup mork environemt =)))';

type KnownPlatform = Exclude<DevicePlatform, 'unknown'>;

const PLATFORM_TABS: { value: KnownPlatform; label: string; icon: LucideIcon }[] = [
  { value: 'android', label: 'Android', icon: Smartphone },
  { value: 'windows', label: 'Windows', icon: Monitor },
  { value: 'macos', label: 'macOS', icon: Apple },
  { value: 'linux', label: 'Linux', icon: Laptop },
  { value: 'ios', label: 'iOS / iPadOS', icon: TabletSmartphone },
];

const PLATFORM_LABEL: Record<DevicePlatform, string> = {
  android: 'Android',
  ios: 'iPhone / iPad',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  unknown: 'thiết bị chưa xác định',
};

const PLATFORM_ICON: Record<KnownPlatform, LucideIcon> = {
  android: Smartphone,
  windows: Monitor,
  macos: Apple,
  linux: Laptop,
  ios: TabletSmartphone,
};

const PHONE_ART = {
  src: '/app/phone_app.png',
  width: 842,
  height: 1869,
  alt: 'Ảnh minh hoạ ứng dụng LHU Dashboard trên điện thoại: trang tổng quan với thẻ buổi học kế tiếp và thanh điều hướng dưới cùng.',
};

const DESKTOP_ART = {
  src: '/app/desktop_app.png',
  width: 1024,
  height: 615,
  alt: 'Ảnh minh hoạ ứng dụng LHU Dashboard trên máy tính: cửa sổ dashboard với thanh điều hướng bên trái và lịch học 7 ngày tới.',
};

const IOS_STEPS = [
  'Mở trang này bằng Safari trên iPhone hoặc iPad.',
  'Nhấn nút Chia sẻ trên thanh công cụ (biểu tượng ô vuông có mũi tên chỉ lên).',
  'Chọn “Thêm vào Màn hình chính”.',
  'Đặt tên (hoặc giữ “LHU Dashboard”) rồi nhấn “Thêm”.',
  'Mở biểu tượng vừa tạo trên Màn hình chính để dùng như ứng dụng.',
];

const formatSize = (bytes: number | null): string | null => {
  if (!bytes) return null;
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

function fileNote(link: DownloadLink): string {
  if (!link.fileName) {
    return 'Chưa lấy được thông tin bản mới nhất — nút tải sẽ mở trang GitHub Releases.';
  }
  const size = formatSize(link.size);
  return size ? `${link.fileName} · ${size}` : link.fileName;
}

function Illustration({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <figure className={className}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-md border-2 border-border bg-muted"
      />
      <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {IMAGE_DISCLAIMER}
      </figcaption>
    </figure>
  );
}

function DownloadAction({
  link,
  label,
  icon: Icon,
  variant = 'default',
}: {
  link: DownloadLink;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'outline' | 'secondary' | 'section';
}) {
  return (
    <Button asChild size="lg" variant={variant} className="w-full sm:w-auto">
      <a href={link.url} target="_blank" rel="noopener noreferrer">
        <Icon aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}

function ReleasePageAction({ href }: { href: string }) {
  return (
    <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden="true" />
        Trang phát hành
      </a>
    </Button>
  );
}

function FileNote({ link }: { link: DownloadLink }) {
  return <p className="break-all text-xs text-muted-foreground">{fileNote(link)}</p>;
}

function IosInstallGuide() {
  return (
    <ol className="space-y-2.5">
      {IOS_STEPS.map((step, index) => (
        <li key={step} className="flex gap-3 text-sm">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-2 border-border bg-secondary text-xs font-black text-black">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function DownloadApp() {
  const [platform] = useState<DevicePlatform>(() => detectPlatform());
  const [arch, setArch] = useState<DeviceArch>(null);
  const [manualTab, setManualTab] = useState<string>(() => {
    const detected = detectPlatform();
    return detected === 'unknown' ? 'android' : detected;
  });
  const [androidRelease, setAndroidRelease] = useState<ReleaseInfo | null>(null);
  const [desktopRelease, setDesktopRelease] = useState<ReleaseInfo | null>(null);
  const [releaseLoaded, setReleaseLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void detectArch().then(value => {
      if (!cancelled) setArch(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      getLatestRelease(ANDROID_REPO),
      getLatestRelease(DESKTOP_REPO),
    ]).then(([android, desktop]) => {
      if (cancelled) return;
      setAndroidRelease(android.status === 'fulfilled' ? android.value : null);
      setDesktopRelease(desktop.status === 'fulfilled' ? desktop.value : null);
      setReleaseLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const links = useMemo(
    () => buildDownloadLinks(androidRelease, desktopRelease),
    [androidRelease, desktopRelease]
  );

  const choosePlatform = (value: string) => {
    setManualTab(value);
    document
      .getElementById('platform-options')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderPlatform = (key: KnownPlatform) => {
    if (key === 'android') {
      return (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
          <div className="min-w-0 space-y-5">
            <div>
              <h2 className="font-display text-2xl font-black">LHU Dashboard cho Android</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ứng dụng Flutter, tải trực tiếp file APK từ GitHub Releases. Bản phát hành
                hiện tại dành cho thiết bị <strong>arm64-v8a</strong> (gần như mọi điện thoại
                Android đời mới).
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <DownloadAction link={links.android} label="Tải APK" icon={Download} />
                <ReleasePageAction href={links.releasePages.android} />
              </div>
              <FileNote link={links.android} />
            </div>
            <p className="text-xs text-muted-foreground">
              Khi cài, Android có thể hỏi quyền “Cài đặt ứng dụng không rõ nguồn gốc” — hãy cho
              phép trình duyệt bạn đang dùng. Nếu đã cài bản cũ, hãy gỡ bản cũ trước khi cài đè.
            </p>
          </div>
          <Illustration {...PHONE_ART} className="mx-auto w-full max-w-[220px]" />
        </div>
      );
    }

    if (key === 'ios') {
      return (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
          <div className="min-w-0 space-y-5">
            <div>
              <h2 className="font-display text-2xl font-black">iPhone / iPad: cài bằng PWA</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Apple không cho tải ứng dụng trực tiếp ngoài App Store, nên hãy thêm LHU
                Dashboard vào Màn hình chính. Cách này dùng đúng bản web mới nhất, không cần
                qua kho ứng dụng.
              </p>
            </div>
            <IosInstallGuide />
            <div className="flex items-center gap-2 rounded-md border-2 border-border bg-muted p-3 text-sm">
              <Share className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Biểu tượng Chia sẻ nằm trên thanh công cụ của Safari.</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Nếu đang mở bằng trình duyệt khác trên iOS, hãy chuyển sang Safari để thêm vào
              Màn hình chính.
            </p>
          </div>
          <Illustration {...PHONE_ART} className="mx-auto w-full max-w-[220px]" />
        </div>
      );
    }

    if (key === 'windows') {
      const armWindows = arch === 'arm64';
      const primary = armWindows ? links.windowsArm64 : links.windows;
      const secondary = armWindows ? links.windows : links.windowsMsi;
      return (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black">LHU Dashboard cho Windows</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bản desktop (Electron) có tự cập nhật, dành cho Windows 10/11 64-bit. Chọn file
              cài <strong>.exe</strong> nếu bạn muốn trình cài đặt thông thường, hoặc
              <strong> .msi</strong> nếu quản trị máy bằng Group Policy.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <DownloadAction link={primary} label={armWindows ? 'Tải .msi (ARM64)' : 'Tải bản cài (.exe)'} icon={Download} />
              <DownloadAction
                link={secondary}
                label={armWindows ? 'Bản .exe (x64)' : 'Tải .msi (64-bit)'}
                icon={Download}
                variant="outline"
              />
              <ReleasePageAction href={links.releasePages.desktop} />
            </div>
            <FileNote link={primary} />
          </div>
          <p className="text-xs text-muted-foreground">
            Windows SmartScreen có thể cảnh báo vì ứng dụng chưa ký số — chọn “More info” rồi
            “Run anyway” nếu bạn tin nguồn phát hành.
          </p>
          <Illustration {...DESKTOP_ART} />
        </div>
      );
    }

    if (key === 'macos') {
      const appleSilicon = arch === 'arm64';
      const primary = appleSilicon ? links.macosArm64 : links.macos;
      const secondary = appleSilicon ? links.macos : links.macosArm64;
      return (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black">LHU Dashboard cho macOS</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bản desktop (Electron) đóng gói dạng <strong>.dmg</strong>. Mở file, kéo ứng dụng
              vào thư mục Applications rồi chạy từ Launchpad.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <DownloadAction
                link={primary}
                label={appleSilicon ? 'Tải cho Apple Silicon' : 'Tải cho macOS (Intel)'}
                icon={Download}
              />
              <DownloadAction
                link={secondary}
                label={appleSilicon ? 'Bản Intel' : 'Bản Apple Silicon'}
                icon={Download}
                variant="outline"
              />
              <ReleasePageAction href={links.releasePages.desktop} />
            </div>
            <FileNote link={primary} />
          </div>
          <p className="text-xs text-muted-foreground">
            Bản Intel chạy được trên Apple Silicon qua Rosetta 2; bản Apple Silicon chỉ chạy
            trên Mac M1 trở lên. Nếu chưa rõ máy mình dùng chip gì, hãy thử bản Intel trước.
          </p>
          <Illustration {...DESKTOP_ART} />
        </div>
      );
    }

    const armLinux = arch === 'arm64';
    const primary = armLinux ? links.linuxArm64 : links.linux;
    const secondary = armLinux ? links.linux : links.linuxArm64;
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-black">LHU Dashboard cho Linux</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bản desktop (Electron) đóng gói dạng <strong>AppImage</strong> — không cần cài đặt,
            chỉ cần cấp quyền thực thi cho file.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadAction
              link={primary}
              label={armLinux ? 'Tải AppImage (ARM64)' : 'Tải AppImage (64-bit)'}
              icon={Download}
            />
            <DownloadAction
              link={secondary}
              label={armLinux ? 'Bản 64-bit' : 'Bản ARM64'}
              icon={Download}
              variant="outline"
            />
            <ReleasePageAction href={links.releasePages.desktop} />
          </div>
          <FileNote link={primary} />
        </div>
        <div className="rounded-md border-2 border-border bg-muted p-3">
          <p className="text-xs text-muted-foreground">Sau khi tải, cấp quyền thực thi:</p>
          <code className="mt-1 block break-all font-mono text-xs text-foreground">
            chmod +x ./LHU-Dashboard-*.AppImage
          </code>
        </div>
        <Illustration {...DESKTOP_ART} />
      </div>
    );
  };

  const renderRecommended = () => {
    if (platform === 'unknown') {
      return (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black">Chưa nhận diện được thiết bị</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Trình duyệt không cung cấp đủ thông tin về hệ điều hành. Chọn bản phù hợp với
              máy bạn đang dùng:
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DownloadAction link={links.android} label="Tải cho Android (APK)" icon={Smartphone} />
            <DownloadAction link={links.windows} label="Tải cho Windows (.exe)" icon={Monitor} />
            <DownloadAction link={links.macos} label="Tải cho macOS (.dmg)" icon={Apple} />
            <DownloadAction link={links.linux} label="Tải cho Linux (AppImage)" icon={Laptop} />
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="justify-start"
              onClick={() => choosePlatform('ios')}
            >
              <TabletSmartphone aria-hidden="true" />
              Hướng dẫn cài trên iPhone / iPad
            </Button>
          </div>
        </div>
      );
    }

    return renderPlatform(platform);
  };

  const RecommendedIcon = platform === 'unknown' ? Info : PLATFORM_ICON[platform];
  const latestTag =
    platform === 'android'
      ? androidRelease?.tag
      : platform === 'ios' || platform === 'unknown'
        ? null
        : desktopRelease?.tag;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md border-2 border-border bg-section text-section-foreground shadow-brutal">
          <Download className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
          Tải ứng dụng
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          LHU Dashboard có bản web, bản Android và bản desktop. Trang này chọn sẵn bản phù hợp
          với thiết bị bạn đang dùng.
        </p>
      </header>

      <Card className="mb-10 overflow-hidden">
        <CardHeader className="border-b-2 border-border bg-section text-section-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-border bg-background text-foreground shadow-brutal-sm">
              <RecommendedIcon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl">Tải cho thiết bị của bạn</CardTitle>
              <CardDescription className="text-section-foreground/80">
                {platform === 'unknown'
                  ? 'Thiết bị chưa xác định — mọi lựa chọn vẫn ở bên dưới.'
                  : `Nhận diện: ${PLATFORM_LABEL[platform]}.`}
              </CardDescription>
            </div>
            {latestTag && (
              <Badge variant="outline" className="shrink-0">
                Bản mới nhất: {latestTag}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 sm:p-6">
          {renderRecommended()}
          <p className="min-h-4 text-xs text-muted-foreground" role="status">
            {releaseLoaded
              ? 'Liên kết tải trỏ tới GitHub Releases; bản mới nhất được lấy tự động.'
              : 'Đang kiểm tra bản phát hành mới nhất trên GitHub…'}
          </p>
        </CardContent>
      </Card>

      <section id="platform-options" className="scroll-mt-24">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-black">Chọn nền tảng khác</h2>
          <p className="text-sm text-muted-foreground">
            Không đúng thiết bị đang dùng? Chọn thủ công bên dưới — tất cả bản phát hành đều
            nằm trong GitHub Releases.
          </p>
        </div>

        <Tabs value={manualTab} onValueChange={setManualTab}>
          <TabsList className="mb-2 flex h-auto w-full flex-wrap justify-start gap-1">
            {PLATFORM_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PLATFORM_TABS.map(({ value }) => (
            <TabsContent key={value} value={value}>
              <Card>
                <CardContent className="p-5 sm:p-6">{renderPlatform(value)}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" aria-hidden="true" />
            Lưu ý khi tải
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Bản Android và desktop là dự án riêng, phát hành qua GitHub Releases. Bản web vẫn
            là bản mới nhất và có thể cài như PWA trên mọi nền tảng.
          </p>
          <p>
            Nếu nút tải mở trang GitHub Releases thay vì tải ngay, nghĩa là chưa lấy được thông
            tin bản mới nhất (mất mạng hoặc GitHub giới hạn lượt gọi) — chọn đúng file trong
            danh sách trên trang đó.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a
              className="font-bold text-foreground underline underline-offset-4 hover:opacity-70"
              href={`https://github.com/${ANDROID_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mã nguồn Android
            </a>
            <a
              className="font-bold text-foreground underline underline-offset-4 hover:opacity-70"
              href={`https://github.com/${DESKTOP_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mã nguồn desktop
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
