import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { AuthStorage } from '@/types/user';
import { toast } from 'react-hot-toast';
import { ClientJS } from 'clientjs';
import { Loader2, LogIn } from 'lucide-react';
// import TurnStile, {useTurnstile} from 'react-turnstile';

// const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY 

function buildDeviceInfo(): string {
  try {
    const client = new ClientJS();
    let str = '{' + client.getFingerprint() + '}{WebAuth}{';
    if (client.getDevice() !== undefined)
      str += client.getDeviceVendor() + ' ' + client.getDevice() + ' · ';
    if (client.getOS() !== undefined)
      str += client.getOS() + ' ' + client.getOSVersion() + ' · ';
    if (client.getBrowser() !== undefined)
      str += client.getBrowser() + ' ' + client.getBrowserMajorVersion();
    return str + '}';
  } catch {
    return '{unknown}{WebAuth}{Windows 10 · Chrome 136}';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // const turnstile = useTurnstile();
  // const [cf_token, setCf_token] = useState<string | null>(null);

  const deviceInfo = useMemo(() => {
    try {
      return buildDeviceInfo();
    } catch {
      return '{unknown}{WebAuth}{Windows 10 · Chrome 136}';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) return;
    setLoading(true);
    try {
      await authService.login({ DeviceInfo: deviceInfo, UserID: userId, Password: password || "" });
      try {
        const user = await authService.getUserInfo();
        AuthStorage.setUser(user);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("Phiên đã hết hạn")) {
            throw new Error("Phiên đăng nhập không hợp lệ, vui lòng thử lại")
          }
        }
      }
      toast.success('Đăng nhập thành công');
      navigate('/');
    } catch (err) {
      (err instanceof Error && localStorage.removeItem("access_token"))
      toast.error(err instanceof Error ? err.message : 'Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Chào mừng trở lại 👋</CardTitle>
            <p className="text-sm text-muted-foreground">Đăng nhập để tiếp tục</p>
          </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="userid">Mã sinh viên</Label>
                  <Input
                    id="userid"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Mã sinh viên của bạn"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                {/* <TurnStile
                sitekey={sitekey}
                theme={localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'}
                onVerify={(token) => setCf_token(token)}
                onExpire={() => setCf_token(null)}
                /> */}
                <Button
                  type="submit"
                  disabled={loading || !userId || !password}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" /> Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" /> Đăng nhập
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                  Quay lại <a onClick={() => navigate('/')} className="text-indigo-600 hover:underline">Trang chủ</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
