import { useState, useEffect } from 'react';
import { Upload, Edit2, Trash2, Plus, ChevronDownIcon } from 'lucide-react';
import { Activity, UserStatistics } from '@/types/drl';
import { AuthStorage, UserResponse } from '@/types/user';
import { drlService } from '@/services/diemrenluyenService';
import {LoadingScreen} from './LHU_UI/LoadingScreen';
import { Badge } from './ui/badge';
import { Dialog, DialogDescription, DialogContent, DialogFooter } from './ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';
import dayjs from 'dayjs';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import toast from 'react-hot-toast';
import { FileManager } from './LHU_WINDOW/PROOF_DRL';

// Component hiển thị trạng thái
const StatusChip = ({ status }: { status: number }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 1:
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' };
      case 2:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ duyệt' };
      case 3:
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Không xác định' };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </Badge>
  );
};

// Component chính
const DiemRL: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const user: UserResponse | null = AuthStorage.getUser();

  const [activityManagerOpen, setActivityManagerOpen] = useState(false);
  const [activityEditOpen, setActivityEditOpen] = useState(false);
  const [activityDeleteOpen, setActivityDeleteOpen] = useState(false);

  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [activityName, setActivityName] = useState<string>('');
  const [tochucBenNgoai, setTochucBenNgoai] = useState<string>('');
  const [fromdatepickerOpen, setFromDatepickerOpen] = useState(false);
  const [toDatepickerOpen, setToDatepickerOpen] = useState(false);

  const [activityID, setActivityID] = useState<number | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const DayPicker = (
    {open, date, onSetDate, setOpen}: {open: boolean, date: Date | undefined, onSetDate: (date: Date) => void, setOpen: (open: boolean) => void}
  ) => {

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    id="date"
                    className="w-48 justify-between font-normal"
                >
                    {date ? dayjs(date.toLocaleDateString()).format('DD/MM/YYYY') : "Select date"}
                    <ChevronDownIcon />
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                    mode="single"
                    className='dark:bg-black bg-white'
                    selected={date}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                        onSetDate(date || new Date())
                        setOpen(false)
                    }}
                />
                </PopoverContent>
            </Popover>
        </div>
    )
}


  useEffect(() => {
    if (!user) {
        setError("Bạn chưa đăng nhập");
    }
  }, []);


  useEffect(() => {
    fetchUserStatistics();
  }, []);

  const fetchUserStatistics = async () => {
        try {
            setLoading(true);
            const userStatistics: UserStatistics | null = await drlService.getUserStatistics();
            if (!userStatistics) return;
            setTotalPoints(userStatistics.data[1][0].TotalPoints ? userStatistics.data[1][0].TotalPoints : 0);
            setTotalActivities(userStatistics.data[0][0].TongHoatDong);
            // if (userStatistics.data[0][0].TongHoatDong === 0) return; // không có hoạt động thì thôi, không tải gì nữa
            setActivities(userStatistics.data[2]);
        } catch (error) {
            console.error("Error loading user statistics:", error);
            if (error instanceof Error) {
                setError(error.message);
            }
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 300); // Giữ loading ít nhất 0.3s cho mượt
        }
    }

  const handleCreateNewActivity = async () => {

    if (!fromDate || !toDate) {
        toast.error("Vui lòng chọn đầy đủ ngày tháng");
        return;
    }
    // Just double check 
    if (dayjs(fromDate).isAfter(dayjs(toDate))) {
        toast.error("Ngày bắt đầu không được sau ngày kết thúc");
        return;
    }
    try {
        const is_upserted = await drlService.createNewActiviy(
            dayjs(fromDate).format('YYYY-MM-DD'),
            dayjs(toDate).format('YYYY-MM-DD'),
            activityName,
            tochucBenNgoai
        )
        if (!is_upserted) {
            toast.error("Tạo hoạt động thất bại, vui lòng thử lại sau");
            return;
        }

        toast.success("Tạo hoạt động thành công");
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message);
        }
    }
    // Reset and refresh
    setFromDate(undefined);
    setToDate(undefined);
    setActivityName('');
    setTochucBenNgoai('');
    setActivityManagerOpen(false);
    fetchUserStatistics();
  }

  const handleEditActivity = async () => {

    if (!fromDate || !toDate) {
        toast.error("Vui lòng chọn đầy đủ ngày tháng");
        return;
    }
    // Just double check 
    if (dayjs(fromDate).isAfter(dayjs(toDate))) {
        toast.error("Ngày bắt đầu không được sau ngày kết thúc");
        return;
    }
    try {
        const is_upserted = await drlService.modifyActivity(
            activityID!,
            dayjs(fromDate).format('YYYY-MM-DD'),
            dayjs(toDate).format('YYYY-MM-DD'),
            activityName,
            tochucBenNgoai,
            1
        )
        if (!is_upserted) {
            toast.error("Tạo hoạt động thất bại, vui lòng thử lại sau");
            return;
        }

        toast.success("Tạo hoạt động thành công");
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message);
        }
    }
    // Reset and refresh
    setFromDate(undefined);
    setToDate(undefined);
    setActivityName('');
    setTochucBenNgoai('');
    setActivityEditOpen(false);
    fetchUserStatistics();
  }


  // Xử lý upload file
  const handleUpload = (activity: Activity) => {
    setActivityID(activity.HoatDongID);
    setUploadModalOpen(true);
  };

  // Xử lý sửa
  const handleEdit = (activity: Activity) => {
    setTochucBenNgoai(activity.ToChucBenNgoai);
    setActivityName(activity.TenChuongTrinh);
    setFromDate(new Date(activity.TuNgay));
    setToDate(new Date(activity.DenNgay));
    setActivityID(activity.HoatDongBenNgoaiID);
    setActivityEditOpen(true);
  };

  // Xử lý xóa
  const handleDelete = async () => {
    try {
        const is_deleted = await drlService.modifyActivity(
            activityID!,
            "",
            "",
            "",
            "",
            0
        )
        if (!is_deleted) {
            toast.error("Xóa hoạt động thất bại, vui lòng thử lại sau");
            return;
        }
        toast.success("Xóa hoạt động thành công");
        fetchUserStatistics();
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message);
        }
    } finally {
        setActivityDeleteOpen(false);
        fetchUserStatistics();
    }
}

  // Kiểm tra quyền sửa
  const canUpdate = (activity: Activity) => {
    if (activity.IsExternal === 0) return false;
    if (activity.IsExternal === 1 && activity.TinhTrang === 2) return true;
    return false;
  };

  if (loading) {
    return (
    <div className="flex justify-center">
        <LoadingScreen loading={loading} />
    </div>
  )};

if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra sự cố!</h2>
                <p className="text-lg text-gray-700 mb-4">{error}</p>
                <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    Thử lại
                </button>
            </div>
        </div>
    );
}

if (uploadModalOpen && activityID !== null) {
    return (
        <FileManager hoatdongID={activityID} onClose={() => {setUploadModalOpen(false); setActivityID(null);}} />
    )
}

return (
    <div className="min-h-screen p-6">
        <Dialog open={activityManagerOpen} onOpenChange={setActivityManagerOpen}>
            <DialogContent className="max-w-lg">
                <DialogDescription className="text-lg font-medium mb-4">
                    Khai báo hoạt động phục vụ cộng đồng
                </DialogDescription>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên hoạt động</label>
                        <Input
                            type="text"
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            placeholder="Nhập tên hoạt động"
                         />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tổ chức bên ngoài</label>
                        <Input
                            type="text"
                            placeholder="Nhập tên tổ chức bên ngoài"
                            value={tochucBenNgoai}
                            onChange={(e) => setTochucBenNgoai(e.target.value)}
                         />
                    </div>

                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-1">Từ ngày</label>
                            <DayPicker
                                open={fromdatepickerOpen}
                                date={fromDate}
                                onSetDate={setFromDate}
                                setOpen={setFromDatepickerOpen}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-1">Đến ngày</label>
                            <DayPicker
                                open={toDatepickerOpen}
                                date={toDate}
                                onSetDate={setToDate}
                                setOpen={setToDatepickerOpen}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" variant={'outline'} disabled={!activityName || !tochucBenNgoai || !fromDate || !toDate || (dayjs(fromDate).isAfter(dayjs(toDate)))} 
                    onClick={handleCreateNewActivity}>Tạo hoạt động</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={activityEditOpen} onOpenChange={setActivityEditOpen}>
            <DialogContent className="max-w-lg">
                <DialogDescription className="text-lg font-medium mb-4">
                    Sửa khai báo hoạt động phục vụ cộng đồng
                </DialogDescription>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên hoạt động</label>
                        <Input
                            type="text"
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            placeholder="Nhập tên hoạt động"
                         />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tổ chức bên ngoài</label>
                        <Input
                            type="text"
                            placeholder="Nhập tên tổ chức bên ngoài"
                            value={tochucBenNgoai}
                            onChange={(e) => setTochucBenNgoai(e.target.value)}
                         />
                    </div>

                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-1">Từ ngày</label>
                            <DayPicker
                                open={fromdatepickerOpen}
                                date={fromDate}
                                onSetDate={setFromDate}
                                setOpen={setFromDatepickerOpen}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-1">Đến ngày</label>
                            <DayPicker
                                open={toDatepickerOpen}
                                date={toDate}
                                onSetDate={setToDate}
                                setOpen={setToDatepickerOpen}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" variant={'outline'} disabled={!activityName || !tochucBenNgoai || !fromDate || !toDate || (dayjs(fromDate).isAfter(dayjs(toDate)))} 
                    onClick={handleEditActivity}>Lưu</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={activityDeleteOpen} onOpenChange={setActivityDeleteOpen}>
            <DialogContent>
                <DialogDescription className="text-lg font-medium mb-4">
                    Xác nhận xóa hoạt động
                </DialogDescription>
                <p className="mb-6">Bạn có chắc chắn muốn xóa hoạt động này không? Hành động này không thể hoàn tác.</p>
                <DialogFooter>
                    <Button type="button" variant={'outline'} onClick={() => setActivityDeleteOpen(false)}>Hủy</Button>
                    <Button type="submit" variant={'destructive'} onClick={handleDelete}>Xóa hoạt động</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Nội dung chính */}

        <div className="max-w-7xl mx-auto">
            {/* Dòng 1: Thông tin cá nhân & Nút chức năng */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">PHỤC VỤ CỘNG ĐỒNG</h1>
                        <p className="text-lg text-gray-700 dark:text-gray-200">
                            <span className="font-semibold">Họ tên:</span> {user?.FullName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">User ID:</span> {user?.UserID}
                        </p>
                    </div>
                    <button
                        onClick={() => setActivityManagerOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={20} />
                        <span className='hidden sm:block'>Khai báo hoạt động</span>
                    </button>
                </div>
            </div>

            {/* Dòng 2: Bảng dữ liệu */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                {/* Tổng hợp */}
                <div className="bg-blue-50 dark:bg-slate-700 p-4 border-b dark:border-slate-700">
                    <div className="flex gap-8">
                        <div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">Tổng điểm:</span>
                            <span className="ml-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPoints} / 45</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">Số hoạt động đã duyệt:</span>
                            <span className="ml-2 text-2xl font-bold text-green-600 dark:text-green-400">{totalActivities}</span>
                        </div>
                    </div>
                </div>

                {/* Bảng */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-slate-700 border-b dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">STT</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Tên sự kiện</th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Điểm</th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Minh chứng</th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Tình trạng</th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((activity, index) => {
                                const rowClass = activity.TinhTrang === 1
                                    ? 'bg-green-50 dark:bg-green-900'
                                    : 'bg-white dark:bg-slate-800';
                                return (
                                    <tr
                                        key={activity.TenChuongTrinh + index}
                                        className={`${rowClass} border-b hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors`}
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{activity.TenChuongTrinh}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                                                {activity.Diem}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {activity.IsExternal === 1 && activity.TinhTrang !== 1 && (
                                                <button
                                                    onClick={() => handleUpload(activity)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-100 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Upload size={16} />
                                                    Upload
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusChip status={activity.TinhTrang} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {canUpdate(activity) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(activity)}
                                                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-200 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setActivityID(activity.HoatDongBenNgoaiID);
                                                                setActivityDeleteOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-200 rounded-lg transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);
};

export default DiemRL;