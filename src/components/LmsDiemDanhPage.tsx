import { ApiService } from "@/services/apiService";
import { AuthStorage } from "@/types/user";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface DiemDanhOut {
  TenMonHoc: string;
  TrangThai: number;
  ThoiGianDiemDanh: string | null;
  ThoiGianQuetQRCode: string;
  NgayHoc: string;
  HoTenGV: string;
}

interface DiemDanhData {
  data: DiemDanhOut[];
}

const DiemDanhCard: React.FC<{ item: DiemDanhOut }> = ({ item }) => {
  const getTrangThaiInfo = (trangThai: number) => {
    if (trangThai === 2) {
      return {
        text: 'Đã điểm danh',
        icon: <CheckCircle className="w-5 h-5" />,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-700 dark:text-green-400',
        iconColor: 'text-green-500 dark:text-green-400'
      };
    } else if (trangThai === 1) {
      return {
        text: 'Vắng có phép',
        icon: <AlertCircle className="w-5 h-5" />,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        iconColor: 'text-yellow-500 dark:text-yellow-400'
      };
    } else {
      return {
        text: 'Vắng không phép',
        icon: <XCircle className="w-5 h-5" />,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-700 dark:text-red-400',
        iconColor: 'text-red-500 dark:text-red-400'
      };
    }
  };

  const statusInfo = getTrangThaiInfo(item.TrangThai);

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`rounded-lg border-2 ${statusInfo.borderColor} ${statusInfo.bgColor} p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex-1 pr-2">
          {item.TenMonHoc}
        </h3>
        <div className={`flex items-center gap-1.5 ${statusInfo.iconColor} flex-shrink-0`}>
          {statusInfo.icon}
          <span className={`font-medium text-sm ${statusInfo.textColor} whitespace-nowrap`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Giảng viên:</span> {item.HoTenGV}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start justify-between">
          <span className="text-gray-600 dark:text-gray-400">Ngày học:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200 text-right">
            {formatDate(item.NgayHoc)}
          </span>
        </div>
        
        {item.ThoiGianQuetQRCode && (<div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Quét QR:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {formatDateTime(item.ThoiGianQuetQRCode)}
          </span>
        </div>)}

        {item.ThoiGianDiemDanh && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Điểm danh:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {formatDateTime(item.ThoiGianDiemDanh)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const LmsDiemDanhPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiemDanhData | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const user = AuthStorage.isLoggedIn();
      if (!user) {
        setError("Chưa đăng nhập");
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        setLoading(false);
        return;
      }
      const access_token = localStorage.getItem("access_token");
      if (!access_token) {
        setError("Chưa đăng nhập");
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        setLoading(false);
        return;
      }
      try {
        const res = await ApiService.get_lms_diem_danh(access_token);
        setData(res);
      } catch (err) {
        setError("Không thể tải dữ liệu điểm danh");
        toast.error("Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">Đang tải dữ liệu điểm danh...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500 dark:text-red-400" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Chưa có dữ liệu</h2>
          <p className="text-gray-600 dark:text-gray-300">Bạn chưa có buổi học nào được điểm danh</p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Lịch sử điểm danh</h1>
          <p className="text-gray-600 dark:text-gray-300">Tổng số: {data.data.length} buổi học</p>
        </div>
        
        {/* List */}
        <div className="space-y-4 overflow-y-scroll max-h-[75vh]">
          {data.data.map((item, index) => (
            <DiemDanhCard key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LmsDiemDanhPage;