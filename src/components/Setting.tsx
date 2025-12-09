import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Moon, 
  Sun, 
  Trash2, 
  User, 
  Database,
  Info,
  RefreshCw,
  LogOut,
  Shield,
  Globe,
  Power,
  PowerOff,
  Home,
  Calendar,
  QrCode,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cacheService } from '@/services/cacheService';
import { examCacheService } from '@/services/examCacheService';
import { AuthStorage } from '@/types/user';
import { authService } from '@/services/authService';
import { GitHub } from './icons/github';
import { PiExamDuotone, PiTrayArrowDown, PiTrayArrowUpLight } from 'react-icons/pi';
import { MdUpdateDisabled, MdUpdate } from "react-icons/md";
import { getSettings, NavigationItem } from '@/types/settings';
import { FaParking, FaRegWindowClose, FaBomb } from 'react-icons/fa';
import { FiSidebar } from "react-icons/fi";
import { IoHardwareChipOutline } from "react-icons/io5";
import { BsWindowDesktop } from "react-icons/bs";
import { IoIosNotifications, IoIosNotificationsOff  } from "react-icons/io";

const SettingsPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>('0 KB');
  const [isClearingCache, setIsClearingCache] = useState(false);
  const user = AuthStorage.getUser();
  const isLoggedIn = AuthStorage.isLoggedIn();
  const isElectronApp = window?.electron?.isElectron || false;
  const [settings, setSettings] = useState<{ autoStart: boolean, minimizeToTray: boolean, checkForUpdatesOnStart: boolean, notifyNextClassStartedSoon: boolean, minimizeOnClose: boolean, hardwareAcceleration: boolean } | null>(null);
  const [appsettings, setAppsettings] = useState(() => {
    const saved = getSettings();
    return saved;
  });



  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');
    checkCacheSize();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isElectronApp) return
      const reactAppSettings = await window?.electron?.getSettings()
      setSettings(reactAppSettings)
    }
    load()
  }, [isElectronApp])

  const toggleAutoStart = () => {
    if (!settings || !isElectronApp) return;
    const newValue = !settings.autoStart;
    // @ts-expect-error
    window.electron.setAutoStart?.(newValue).then(() => {
        setSettings({ ...settings, autoStart: newValue });
    });
  };

  const toggleAutoMinimizeToTray = () => {
    if (!settings || !isElectronApp) return;
    const newValue = !settings.minimizeToTray;
    // @ts-expect-error
    window.electron.setMinimizeToTray?.(newValue).then(() => {
        setSettings({ ...settings, minimizeToTray: newValue });
    });
  };

  const toggleCheckForUpdatesOnStart = () => {
    if (!settings || !isElectronApp) return;
    const newValue = !settings.checkForUpdatesOnStart;
    // @ts-expect-error
    window.electron.setCheckForUpdatesOnStart?.(newValue).then(() => {
        setSettings({ ...settings, checkForUpdatesOnStart: newValue });
    });
  };

  const toggleNotifyNextClassStartedSoon = () => {
    if (!settings || !isElectronApp) return;
    const newValue = !settings.notifyNextClassStartedSoon;
    // @ts-expect-error
    window.electron.setNotifyNextClassStartedSoon?.(newValue).then(() => {
        setSettings({ ...settings, notifyNextClassStartedSoon: newValue });
    });
  };

  const toggleMinimizeOnClose = () => {
    if (!settings || !isElectronApp) return;
    const newValue = !settings.minimizeOnClose;
    // @ts-expect-error
    window.electron.setMinimizeOnClose?.(newValue).then(() => {
        setSettings({ ...settings, minimizeOnClose: newValue });
    });
  }

  const restartApp = (toastId: string) => {
    toast.loading('Đang khởi động lại ứng dụng...', { id: toastId });
    setTimeout(() => {
      toast.success('Ứng dụng đang được khởi động lại.', { id: toastId });
    }, 3000);
    window.electron.forceRestartApp?.();
  }

  const toggleHardwareAcceleration = () => {
    if (!settings || !isElectronApp) return;
    
    const newValue = !settings.hardwareAcceleration;
    // @ts-expect-error
    window.electron.setHardwareAcceleration?.(newValue).then(() => {
        setSettings({ ...settings, hardwareAcceleration: newValue });
    });
    toast((t) => {
      return (
        <div>
          <p>Bạn vừa thay đổi cài đặt tăng tốc phần cứng, bấm vào đây để khởi động lại ứng dụng.</p>
          <Button className='mt-3' onClick={() => restartApp(t.id)}>
            Khởi động lại ngay
          </Button>
          <Button variant="outline" className="ml-2 mt-3" onClick={() => toast.dismiss(t.id)}>
            Để sau
          </Button>
        </div>
      )
    }, {duration: Infinity})
  }

  const checkCacheSize = async () => {
    try {
      // Estimate cache size from localStorage and IndexedDB
      let size = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length;
        }
      }
      // Convert to readable format
      const sizeInKB = (size / 1024).toFixed(2);
      setCacheSize(`${sizeInKB} KB`);
    } catch (error) {
      setCacheSize('Không xác định');
    }
  };

  const navigationItems: NavigationItem[] = [
      {
        id: 'home',
        label: 'Trang chủ',
        icon: Home,
        description: 'Trang chính của ứng dụng',
        forceshow: true
      },
      {
        id: 'schedule',
        label: 'Lịch học',
        icon: Calendar,
        description: 'Xem lịch học chi tiết'
      },
      {
        id: 'timetable',
        label: 'Thời khóa biểu',
        icon: Calendar,
        description: 'Xem thời khóa biểu dạng lịch',
        forceshow: true
      },
      {
        id: 'weather',
        label: 'Thời tiết',
        icon: Sun,
        description: 'Thông tin thời tiết hiện tại'
      },
      {
        id: "diemdanh",
        label: "Điểm danh",
        icon: PiExamDuotone,
        description: "Xem thông tin điểm danh (cần đăng nhập)",
        authrequired: true,
        forceshow: true
      },
      {
        id: "mark",
        label: "Xem điểm thi", 
        icon: PiExamDuotone,
        description: "Xem điểm thi của bạn (cần đăng nhập)",
        authrequired: true,
      },
      {
        id: "qrscan",
        label: "Quét QR",
        icon: QrCode,
        description: "Quét QR điểm danh cho lớp của bạn (cần đăng nhập)",
        authrequired: false,
        forceshow: true
      },
      {
        id: "parkinglhu",
        label: "Quản lý đỗ xe LHU",
        icon: FaParking,
        description: "Quản lý xe của tôi",
        authrequired: true
      },
      {
        id: "settings",
        label: "Cài đặt",
        icon: Settings,
        description: "Cài đặt và tùy chọn ứng dụng",
        forceshow: true
      },
    ];
  const toggleSidebarItem = (id: string) => {
    setAppsettings((prev: any) => {
      const hidden = new Set(prev.hiddenSidebarItems);
      hidden.has(id) ? hidden.delete(id) : hidden.add(id);

      const newSettings = {
        ...prev,
        hiddenSidebarItems: [...hidden],
      };

      localStorage.setItem("userSettings", JSON.stringify(newSettings));
      // toast.success("Bạn vừa thay đổi cài đặt thanh bên, tải lại trang để áp dụng thay đổi.");
      return newSettings; 
    });
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast.success(newTheme ? 'Đã chuyển sang chế độ tối' : 'Đã chuyển sang chế độ sáng');
  };

  const handleClearCache = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ nhớ đệm? Dữ liệu đã lưu sẽ bị xóa.')) {
      return;
    }

    setIsClearingCache(true);
    try {
      // Clear IndexedDB cache
      if (user?.UserID) {
        await cacheService.delete(user.UserID);
        await examCacheService.clearCache();
      }
      
      // Clear localStorage (except theme and auth)
      const theme = localStorage.getItem('theme');
      const accessToken = localStorage.getItem('access_token');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
      if (accessToken) localStorage.setItem('access_token', accessToken);
      
      await checkCacheSize();
      toast.success('Đã xóa bộ nhớ đệm thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa bộ nhớ đệm');
      console.error(error);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      return;
    }

    try {
      const logoutmsg: string | null = await authService.logOut();
      if (logoutmsg) {
        toast.success(logoutmsg);
        window.location.reload();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const SettingItem: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    action: React.ReactNode;
  }> = ({ icon: Icon, title, description, action }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <Label className="text-base font-medium cursor-pointer">{title}</Label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      <div className="ml-4">
        {action}
      </div>
    </div>
  );

  return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
              <p className="text-gray-500 dark:text-gray-400">Quản lý tùy chọn và cấu hình ứng dụng</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Giao diện
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingItem
                icon={isDarkMode ? Moon : Sun}
                title="Chế độ tối"
                description="Chuyển đổi giữa chế độ sáng và tối"
                action={
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={toggleTheme}
                  />
                }
              />
            </CardContent>
          </Card>

          {isElectronApp && settings && (
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Cài đặt dành riêng cho Ứng dụng LHU Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.autoStart !== undefined && (
              <>
                <SettingItem
                icon={settings?.autoStart ? Power : PowerOff}
                title="Tự động khởi động"
                description="Tự động khởi động app khi mở máy"
                action={
                  <Switch
                  checked={settings?.autoStart}
                  onCheckedChange={toggleAutoStart}
                  />
                }
                />
                <Separator />
              </>
              )}
              {settings?.minimizeToTray !== undefined && (
              <>
                <SettingItem
                icon={settings?.minimizeToTray ? PiTrayArrowDown  : PiTrayArrowUpLight }
                title="Tự động ẩn vào khay"
                description="Tự động ẩn app sau khi autostart"
                action={
                  <Switch
                  checked={settings?.minimizeToTray}
                  onCheckedChange={toggleAutoMinimizeToTray}
                  />
                }
                />
                <Separator />
              </>
              )}
              {settings?.checkForUpdatesOnStart !== undefined && (
              <>
                <SettingItem
                icon={settings?.checkForUpdatesOnStart ? MdUpdate  : MdUpdateDisabled }
                title="Tự động kiểm tra cập nhật"
                description="Tự động kiểm tra cập nhật sau khi khởi động ứng dụng"
                action={
                  <Switch
                  checked={settings?.checkForUpdatesOnStart}
                  onCheckedChange={toggleCheckForUpdatesOnStart}
                  />
                }
                />
                <Separator />
              </>
              )}
              {settings?.notifyNextClassStartedSoon !== undefined && (
              <>
                <SettingItem
                icon={settings?.notifyNextClassStartedSoon ? IoIosNotifications  : IoIosNotificationsOff }
                title="Nhận thông báo khi lớp học tiếp theo sắp bắt đầu"
                description="Nhận thông báo nhắc nhở trước khi lớp học tiếp theo bắt đầu"
                action={
                  <Switch
                  checked={settings?.notifyNextClassStartedSoon}
                  onCheckedChange={toggleNotifyNextClassStartedSoon}
                  />
                }
                />
                <Separator />
              </>
              )}
              {settings?.minimizeOnClose !== undefined && (
              <>
                <SettingItem
                icon={settings?.minimizeOnClose ? BsWindowDesktop  : FaRegWindowClose }
                title="Tự động thu nhỏ khi đóng ứng dụng"
                description="Thu nhỏ ứng dụng vào khay hệ thống khi đóng cửa sổ chính"
                action={
                  <Switch
                  checked={settings?.minimizeOnClose}
                  onCheckedChange={toggleMinimizeOnClose}
                  />
                }
                />
                <Separator />
              </>
              )}
              {settings?.hardwareAcceleration !== undefined && (
              <>
                <SettingItem
                icon={IoHardwareChipOutline}
                title="Kích hoạt tăng tốc phần cứng"
                description="Sử dụng GPU để cải thiện hiệu suất ứng dụng, tắt nếu gặp sự cố hiển thị (Cần khởi động lại ứng dụng)"
                action={
                  <Switch
                  checked={settings?.hardwareAcceleration}
                  onCheckedChange={toggleHardwareAcceleration}
                  />
                }
                />
                <Separator />
              </>
              )}
              <SettingItem
              icon={FaBomb}
              title="🐧🐧"
              description=''
              action={
                <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  toast.error("Destructive mode activated!", { duration: 2000 });
                  setTimeout(() => {
                    window.electron.forceRestartApp?.();
                  }, 3000)
                }}
                >
                🐧
                </Button>
              }
              />
            </CardContent>
          </Card>

          )}
          {/* Sidebar Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiSidebar className="h-5 w-5" />
                Cài đặt thanh bên
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Toggle Items */}
              <div className="space-y-3">
                <Label className="font-medium text-base">Tùy chọn hiển thị mục trong Sidebar</Label>

                {navigationItems.map((item) => {
                  if (item.forceshow) return null

                  const enabled = !appsettings.hiddenSidebarItems.includes(item.id)

                  return (
                    <SettingItem
                      key={item.id}
                      icon={item.icon}
                      title={item.label}
                      description={item.description}
                      action={
                        <Switch checked={enabled} onCheckedChange={() => toggleSidebarItem(item.id)} />
                      }
                    />
                  )
                })}
              </div>

            </CardContent>
          </Card>


          {/* Data & Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Dữ liệu & Lưu trữ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-medium">Dung lượng bộ nhớ đệm</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cacheSize}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkCacheSize}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
              </div>
              <Separator />
              <SettingItem
                icon={Trash2}
                title="Xóa bộ nhớ đệm"
                description="Xóa tất cả dữ liệu đã lưu trong bộ nhớ đệm"
                action={
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearCache}
                    disabled={isClearingCache}
                  >
                    {isClearingCache ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </>
                    )}
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {/* Account Settings */}
          {isLoggedIn && user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-base font-medium">Mã sinh viên</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.UserID || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {user.FullName && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-base font-medium">Họ và tên</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.FullName}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                <SettingItem
                  icon={LogOut}
                  title="Đăng xuất"
                  description="Đăng xuất khỏi tài khoản của bạn"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Thông tin ứng dụng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-medium">Tên ứng dụng</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">LHU Calendar</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-medium">Phiên bản</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">1.0.0</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-medium">Ngôn ngữ</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tiếng Việt</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-4 overflow-hidden">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <GitHub />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-medium">Mã nguồn trang web</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 cursor-pointer overflow-hidden"
                    onClick={() => window.open('https://github.com/ShindouAris/Calendar-LHU.git', '_blank')}
                    >https://github.com/ShindouAris/Calendar-LHU.git</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default SettingsPage;

