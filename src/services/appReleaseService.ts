export interface ReleaseAsset {
  name: string;
  url: string;
  size: number;
}

export interface ReleaseInfo {
  tag: string | null;
  assets: ReleaseAsset[];
}

export interface DownloadLink {
  url: string;
  fileName: string | null;
  size: number | null;
}

export interface DownloadLinks {
  releasePages: { android: string; desktop: string };
  android: DownloadLink;
  windows: DownloadLink;
  windowsArm64: DownloadLink;
  windowsMsi: DownloadLink;
  macos: DownloadLink;
  macosArm64: DownloadLink;
  linux: DownloadLink;
  linuxArm64: DownloadLink;
}

export const ANDROID_REPO = 'ShindouAris/Lhu-dashboard-android-release';
export const DESKTOP_REPO = 'ShindouAris/LHU-dashboard-electron';

const API_BASE = 'https://api.github.com/repos';
const CACHE_PREFIX = 'app-release:';
const CACHE_TTL = 30 * 60 * 1000;
const REQUEST_TIMEOUT = 6000;

/** Trang phát hành luôn tồn tại, dùng làm fallback khi API không trả về asset. */
const releasePageUrl = (repo: string) => `https://github.com/${repo}/releases/latest`;

export const RELEASE_PAGES = {
  android: releasePageUrl(ANDROID_REPO),
  desktop: releasePageUrl(DESKTOP_REPO),
};

// Gộp các lần gọi trùng nhau (React StrictMode mount 2 lần, nhiều component).
const inFlight = new Map<string, Promise<ReleaseInfo | null>>();

function readCache(repo: string): ReleaseInfo | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + repo);
    if (!raw) return null;

    const cached = JSON.parse(raw) as { storedAt?: unknown; release?: unknown };
    if (typeof cached.storedAt !== 'number' || Date.now() - cached.storedAt > CACHE_TTL) {
      return null;
    }

    const release = cached.release as ReleaseInfo | undefined;
    if (!release || !Array.isArray(release.assets)) return null;
    return release;
  } catch {
    // sessionStorage có thể bị chặn ở chế độ riêng tư.
    return null;
  }
}

function writeCache(repo: string, release: ReleaseInfo) {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + repo,
      JSON.stringify({ storedAt: Date.now(), release })
    );
  } catch {
    // Không cache được thì lần sau gọi lại API, không ảnh hưởng UI.
  }
}

async function fetchLatestRelease(repo: string): Promise<ReleaseInfo | null> {
  const cached = readCache(repo);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      tag_name?: unknown;
      assets?: unknown;
    };

    const assets: ReleaseAsset[] = [];
    if (Array.isArray(payload.assets)) {
      for (const entry of payload.assets) {
        const asset = entry as {
          name?: unknown;
          browser_download_url?: unknown;
          size?: unknown;
        };
        if (typeof asset.name !== 'string' || typeof asset.browser_download_url !== 'string') {
          continue;
        }
        assets.push({
          name: asset.name,
          url: asset.browser_download_url,
          size: typeof asset.size === 'number' ? asset.size : 0,
        });
      }
    }

    const release: ReleaseInfo = {
      tag: typeof payload.tag_name === 'string' ? payload.tag_name : null,
      assets,
    };
    writeCache(repo, release);
    return release;
  } catch {
    // Offline, rate limit 60 req/h hoặc bị chặn: caller dùng /releases/latest.
    return null;
  }
}

/** Lấy bản phát hành mới nhất; luôn resolve (null nếu không lấy được). */
export function getLatestRelease(repo: string): Promise<ReleaseInfo | null> {
  const pending = inFlight.get(repo);
  if (pending) return pending;

  const request = fetchLatestRelease(repo).finally(() => inFlight.delete(repo));
  inFlight.set(repo, request);
  return request;
}

const isArm = (name: string) => /arm64|aarch64/i.test(name);
const isDmg = (name: string) => name.toLowerCase().endsWith('.dmg');
const isAppImage = (name: string) => name.toLowerCase().endsWith('.appimage');
const isApk = (name: string) => name.toLowerCase().endsWith('.apk');
const isMsi = (name: string) => name.toLowerCase().endsWith('.msi');

function toLink(
  release: ReleaseInfo | null,
  repo: string,
  predicate: (name: string) => boolean
): DownloadLink {
  const asset = release?.assets.find(item => predicate(item.name));
  if (!asset) {
    return { url: releasePageUrl(repo), fileName: null, size: null };
  }
  return { url: asset.url, fileName: asset.name, size: asset.size };
}

/**
 * Ánh xạ asset GitHub Releases sang từng nền tảng. Tên file do electron-builder /
 * Gradle sinh ra kèm số phiên bản, nên phải lọc theo hậu tố chứ không hard-code
 * URL đầy đủ (bản mới sẽ đổi tên).
 */
export function buildDownloadLinks(
  android: ReleaseInfo | null,
  desktop: ReleaseInfo | null
): DownloadLinks {
  return {
    releasePages: { ...RELEASE_PAGES },
    android: toLink(android, ANDROID_REPO, isApk),
    windows: toLink(
      desktop,
      DESKTOP_REPO,
      name => /setup.*\.exe$/i.test(name) || /^lhu-dashboard-[\d.]+\.exe$/i.test(name)
    ),
    windowsArm64: toLink(desktop, DESKTOP_REPO, name => isMsi(name) && isArm(name)),
    windowsMsi: toLink(desktop, DESKTOP_REPO, name => isMsi(name) && !isArm(name)),
    macos: toLink(desktop, DESKTOP_REPO, name => isDmg(name) && !isArm(name)),
    macosArm64: toLink(desktop, DESKTOP_REPO, name => isDmg(name) && isArm(name)),
    linux: toLink(desktop, DESKTOP_REPO, name => isAppImage(name) && !isArm(name)),
    linuxArm64: toLink(desktop, DESKTOP_REPO, name => isAppImage(name) && isArm(name)),
  };
}
