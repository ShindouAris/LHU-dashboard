import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, Server, UserRoundX } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const getErrorIcon = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('internet')) {
      return <Wifi className="h-12 w-12 text-orange-500" />;
    }
    if (errorMessage.toLowerCase().includes('server') || errorMessage.toLowerCase().includes('api')) {
      return <Server className="h-12 w-12 text-red-500" />;
    }
    if (errorMessage.toLowerCase().includes('mã sinh viên không tồn tại')) {
      return <UserRoundX className="h-12 w-12 text-red-500" />;
    }
    return <AlertTriangle className="h-12 w-12 text-red-500" />;
  };

  const getErrorTitle = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('internet')) {
      return 'Lỗi kết nối mạng';
    }
    if (errorMessage.toLowerCase().includes('server') || errorMessage.toLowerCase().includes('api')) {
      return 'Lỗi máy chủ';
    }
    if (errorMessage.toLowerCase().includes('mã sinh viên không tồn tại')) {
      return "Không tìm thấy thông tin sinh viên";
    }
    return 'Đã xảy ra lỗi';
  };

  const getErrorDescription = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('internet')) {
      return 'Vui lòng kiểm tra kết nối internet và thử lại.';
    }
    if (errorMessage.toLowerCase().includes('server') || errorMessage.toLowerCase().includes('api')) {
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    }
    if (errorMessage.toLowerCase().includes('mã sinh viên không tồn tại')) {
      return "Không tìm thấy thông tin sinh viên. Vui lòng kiểm tra lại.";
    }
    return 'Có vẻ như đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
  };

  return (
    <Card className="max-w-2xl mx-auto border-0 shadow-2xl bg-gradient-to-br from-white/90 to-red-50/90 dark:from-gray-800/90 dark:to-red-950/90 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5"></div>
      <CardContent className="relative text-center py-12">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
            {getErrorIcon(message)}
          </div>
        </div>

        {/* Error Content */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {getErrorTitle(message)}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 max-w-md mx-auto leading-relaxed">
          {getErrorDescription(message)}
        </p>

        {/* Error Details */}
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 max-w-lg mx-auto">
          <p className="text-sm text-red-700 dark:text-red-300 font-mono break-all">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onRetry}
            size="lg"
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${getErrorDescription(message) !== "Không tìm thấy thông tin sinh viên. Vui lòng kiểm tra lại." ? "opacity-100" : "opacity-50 cursor-not-allowed"}`}
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Thử lại
          </Button>
        </div>

        {/* Help Text */}
        {getErrorDescription(message) !== "Không tìm thấy thông tin sinh viên. Vui lòng kiểm tra lại." && (
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
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