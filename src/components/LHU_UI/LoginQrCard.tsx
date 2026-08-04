import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  ExclamationTriangleIcon,
  Link2Icon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { authService } from '@/services/authService';
import type { LoginQrResponse } from '@/types/session';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function LoginQrCard() {
  const [loginQr, setLoginQr] = useState<LoginQrResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const remainingSeconds = useMemo(() => {
    if (!loginQr) return 0;
    return Math.max(0, Math.ceil((loginQr.expired_at - now) / 1000));
  }, [loginQr, now]);

  useEffect(() => {
    if (!loginQr || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [loginQr, remainingSeconds]);

  const createQr = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.createLoginQr();
      setLoginQr(response);
      setNow(Date.now());
    } catch (cause) {
      setLoginQr(null);
      setError(cause instanceof Error ? cause.message : 'Không thể tạo mã liên kết');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = Boolean(loginQr && remainingSeconds === 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>Liên kết tài khoản</CardTitle>
            <CardDescription>
              Tạo mã trên tài khoản muốn thêm, rồi quét mã bằng thiết bị chính.
            </CardDescription>
          </div>
          {loginQr && !isExpired && (
            <Badge variant="secondary">Còn {remainingSeconds} giây</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon />
            <AlertTitle>Không tạo được mã</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loginQr && !isExpired ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-md border-2 border-border bg-white p-3 shadow-brutal-sm">
              <QRCode
                value={loginQr.data}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#000000"
                aria-label="Mã QR liên kết tài khoản"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Mã chỉ dùng một lần và tự hết hạn sau 60 giây.
            </p>
          </div>
        ) : isExpired ? (
          <Alert>
            <ExclamationTriangleIcon />
            <AlertTitle>Mã liên kết đã hết hạn</AlertTitle>
            <AlertDescription>
              Tạo mã mới trước khi quét trên thiết bị còn lại.
            </AlertDescription>
          </Alert>
        ) : !error ? (
          <Alert>
            <Link2Icon />
            <AlertTitle>Chưa có mã liên kết</AlertTitle>
            <AlertDescription>
              Chỉ chia sẻ mã với thiết bị và người bạn tin cậy.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={createQr} disabled={loading}>
          {loginQr ? <ReloadIcon data-icon="inline-start" /> : <Link2Icon data-icon="inline-start" />}
          {loading ? 'Đang tạo mã...' : loginQr ? 'Tạo mã mới' : 'Tạo mã liên kết'}
        </Button>
      </CardFooter>
    </Card>
  );
}
