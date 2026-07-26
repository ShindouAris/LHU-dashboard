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
    <Alert className="mb-4 border-2 border-border bg-primary text-black shadow-brutal relative pr-10">
      <AlertTitle className="text-black font-display font-bold flex items-center gap-2">
        <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
        Thông báo thay đổi domain
      </AlertTitle>
      <AlertDescription className="text-black space-y-1">
        <p>
          Ứng dụng sẽ ngừng hoạt động trên domain này vào ngày{' '}
          <strong className="text-[hsl(0_84%_60%)]">25/05/2026</strong>.
        </p>
        <p>
          Domain mới:{' '}
          <a
            href="https://lhu-dashboard.chisadin.id.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline hover:opacity-80"
          >
            lhu-dashboard.chisadin.id.vn
          </a>
        </p>
        <p>Vui lòng cập nhật ứng dụng của bạn bằng cách truy cập vào domain mới và cài đặt lại, và gỡ đi phiên bản cũ. Bạn sẽ cần phải đăng nhập lại</p>
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-black hover:bg-black/10"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};
