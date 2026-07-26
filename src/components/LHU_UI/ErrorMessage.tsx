import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, Server, UserRoundX, type LucideIcon } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const m = message.toLowerCase();
  const isNetwork = m.includes('network') || m.includes('internet');
  const isServer = m.includes('server') || m.includes('api');
  const isNoStudent = m.includes('mã sinh viên không tồn tại');

  const Icon: LucideIcon = isNetwork
    ? Wifi
    : isServer
      ? Server
      : isNoStudent
        ? UserRoundX
        : AlertTriangle;

  const title = isNetwork
    ? 'Lỗi kết nối mạng'
    : isServer
      ? 'Lỗi máy chủ'
      : isNoStudent
        ? 'Không tìm thấy thông tin sinh viên'
        : 'Đã xảy ra lỗi';

  const description = isNetwork
    ? 'Vui lòng kiểm tra kết nối internet và thử lại.'
    : isServer
      ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
      : isNoStudent
        ? 'Không tìm thấy thông tin sinh viên. Vui lòng kiểm tra lại.'
        : 'Có vẻ như đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden">
      <CardContent className="relative text-center py-12">
        <div className="mb-6 w-fit mx-auto">
          <div className="w-24 h-24 bg-destructive text-destructive-foreground border-2 border-border rounded-md shadow-brutal flex items-center justify-center">
            <Icon className="h-12 w-12" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="font-display text-2xl font-black text-foreground mb-3">{title}</h2>

        <p className="text-muted-foreground text-base sm:text-lg mb-6 max-w-md mx-auto leading-relaxed font-medium">
          {description}
        </p>

        <div className="bg-destructive/10 border-2 border-border rounded-md p-4 mb-8 max-w-lg mx-auto">
          <p className="text-sm text-foreground font-mono break-all">{message}</p>
        </div>

        {!isNoStudent && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onRetry} size="lg">
              <RefreshCw className="h-5 w-5 mr-2" />
              Thử lại
            </Button>
          </div>
        )}

        {!isNoStudent && (
          <div className="mt-8 text-sm text-muted-foreground font-medium">
            <p>Nếu vấn đề vẫn tiếp tục, vui lòng:</p>
            <ul className="mt-2 space-y-1">
              <li>• Kiểm tra kết nối internet</li>
              <li>• Thử lại sau vài phút</li>
              <li>• Liên hệ hỗ trợ kỹ thuật</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
