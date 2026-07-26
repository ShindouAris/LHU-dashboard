import { ApiService } from "@/services/apiService";
import { AuthStorage } from "@/types/user";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
        icon: <CheckCircle className="w-4 h-4" strokeWidth={2.5} />,
        badgeBg: 'bg-[hsl(142_71%_45%)] text-black',
      };
    } else if (trangThai === 1) {
      return {
        text: 'Vắng có phép',
        icon: <AlertCircle className="w-4 h-4" strokeWidth={2.5} />,
        badgeBg: 'bg-[hsl(27_96%_61%)] text-black',
      };
    } else {
      return {
        text: 'Vắng không phép',
        icon: <XCircle className="w-4 h-4" strokeWidth={2.5} />,
        badgeBg: 'bg-destructive text-destructive-foreground',
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
    <div className="rounded-md border-2 border-border bg-card text-card-foreground p-4 shadow-brutal">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-lg font-display font-bold text-foreground flex-1 pr-2">
          {item.TenMonHoc}
        </h3>
        <Badge className={`gap-1.5 flex-shrink-0 whitespace-nowrap ${statusInfo.badgeBg}`}>
          {statusInfo.icon}
          {statusInfo.text}
        </Badge>
      </div>

      <div className="mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">Giảng viên:</span> {item.HoTenGV}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start justify-between">
          <span className="text-muted-foreground">Ngày học:</span>
          <span className="font-bold text-foreground text-right">
            {formatDate(item.NgayHoc)}
          </span>
        </div>

        {item.ThoiGianQuetQRCode && (<div className="flex items-center justify-between">
          <span className="text-muted-foreground">Quét QR:</span>
          <span className="font-bold text-foreground tabular-nums">
            {formatDateTime(item.ThoiGianQuetQRCode)}
          </span>
        </div>)}

        {item.ThoiGianDiemDanh && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Điểm danh:</span>
            <span className="font-bold text-foreground tabular-nums">
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

  const [selectedMonHoc, setSelectedMonHoc] = useState<string>("all");
  const [selectedTrangThai, setSelectedTrangThai] = useState<string>("all");

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

  const monHocOptions = useMemo(() => {
    const list = data?.data ?? [];
    const unique = Array.from(
      new Set(list.map((x) => x.TenMonHoc).filter((x): x is string => Boolean(x)))
    );
    unique.sort((a, b) => a.localeCompare(b, "vi"));
    return unique;
  }, [data]);

  const filteredData = useMemo(() => {
    const list = data?.data ?? [];
    return list.filter((item) => {
      if (selectedMonHoc !== "all" && item.TenMonHoc !== selectedMonHoc) return false;
      if (selectedTrangThai !== "all" && String(item.TrangThai) !== selectedTrangThai) {
        return false;
      }
      return true;
    });
  }, [data, selectedMonHoc, selectedTrangThai]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-foreground animate-spin" strokeWidth={2.5} />
          <p className="text-muted-foreground text-lg font-bold">Đang tải dữ liệu điểm danh...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-8 max-w-md">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" strokeWidth={2.5} />
          <h2 className="text-2xl font-display font-black text-foreground mb-2">Có lỗi xảy ra</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" strokeWidth={2.5} />
          <h2 className="text-2xl font-display font-black text-foreground mb-2">Chưa có dữ liệu</h2>
          <p className="text-muted-foreground">Bạn chưa có buổi học nào được điểm danh</p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-6 mb-6">
          <div className="bg-secondary text-secondary-foreground border-2 border-border rounded-md shadow-brutal-sm px-4 py-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-display font-black">Lịch sử điểm danh</h1>
            <p className="font-bold">
              Kết quả: <span className="tabular-nums">{filteredData.length}/{data.data.length}</span> buổi học
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Môn học</p>
              <Select value={selectedMonHoc} onValueChange={setSelectedMonHoc}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn</SelectItem>
                  {monHocOptions.map((tenMonHoc) => (
                    <SelectItem key={tenMonHoc} value={tenMonHoc}>
                      <div className="overflow-hidden">
                        {tenMonHoc}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Trạng thái</p>
              <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="2">Đã điểm danh</SelectItem>
                  <SelectItem value="1">Vắng có phép</SelectItem>
                  <SelectItem value="0">Vắng không phép</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* List */}
        <div className="space-y-4 overflow-y-scroll max-h-[75vh]">
          {filteredData.length === 0 ? (
            <div className="text-center bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" strokeWidth={2.5} />
              <h2 className="text-xl font-display font-black text-foreground mb-2">Không có kết quả</h2>
              <p className="text-muted-foreground">Không tìm thấy buổi học phù hợp với bộ lọc</p>
            </div>
          ) : (
            filteredData.map((item, index) => <DiemDanhCard key={index} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default LmsDiemDanhPage;