import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';

export const HostnameBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === 'lhu-dashboard.chisadin.site') {
      const dismissed = localStorage.getItem('hostname-banner-dismissed');
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('hostname-banner-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <Alert className="mb-4 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/30 relative pr-10">
      <AlertTitle className="text-yellow-800 dark:text-yellow-200 font-bold flex items-center gap-2">
        <ExternalLink className="h-4 w-4" />
        Thông báo thay đổi domain
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300 space-y-1">
        <p>
          Ứng dụng sẽ ngừng hoạt động trên domain này vào ngày{' '}
          <strong className="text-red-600 dark:text-red-400">25/05/2026</strong>.
        </p>
        <p>
          Domain mới:{' '}
          <a
            href="https://lhu-dashboard.chisadin.id.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-100"
          >
            lhu-dashboard.chisadin.id.vn
          </a>
        </p>
        <p>Vui lòng cập nhật ứng dụng của bạn bằng cách truy cập vào domain mới và cài đặt lại, và gỡ đi phiên bản cũ. Bạn sẽ cần phải đăng nhập lại</p>
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};
