import { useEffect, useRef, useState } from 'react';
import {
    Upload,
    Edit2,
    Trash2,
    Plus,
    ChevronDownIcon,
    FileText,
    ExternalLink,
    Calendar as CalendarIcon,
    AlertTriangle,
    X,
} from 'lucide-react';
import {
    DanhSachHoatDongResponse,
    HoatDongNgoaiTruong,
    HoatDongTrongTruong,
    HocKyInfo,
    MinhChungItem,
} from '@/types/drl';
import { AuthStorage, UserResponse } from '@/types/user';
import { drlService } from '@/services/diemrenluyenService';
import { LoadingScreen } from './LHU_UI/LoadingScreen';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogDescription,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import dayjs from 'dayjs';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import toast from 'react-hot-toast';

// ===== Helpers =====

// TinhTrang ngoài trường: 2 = chờ duyệt, 3/5 = đã duyệt, 4 = từ chối
const ngoaiTruongStatusConfig = (status: number) => {
    switch (status) {
        case 3:
        case 5:
            return { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', label: 'Đã duyệt' };
        case 4:
            return { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', label: 'Từ chối' };
        case 2:
        default:
            return { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', label: 'Chờ duyệt' };
    }
};

const NgoaiTruongStatusChip = ({ status, label }: { status: number; label?: string }) => {
    const cfg = ngoaiTruongStatusConfig(status);
    return (
        <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {label || cfg.label}
        </Badge>
    );
};

const fmt = (d: string | undefined | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '');

// ===== DayPicker =====
function DayPicker({
    open,
    date,
    onSetDate,
    setOpen,
    minDate,
    maxDate,
    disabled,
}: {
    open: boolean;
    date: Date | undefined;
    onSetDate: (date: Date) => void;
    setOpen: (open: boolean) => void;
    minDate?: Date;
    maxDate?: Date;
    disabled?: boolean;
}) {
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    type="button"
                    disabled={disabled}
                    className="w-full justify-between font-normal"
                >
                    {date ? dayjs(date).format('DD/MM/YYYY') : 'Chọn ngày'}
                    <ChevronDownIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0 z-50" align="start">
                <Calendar
                    mode="single"
                    className="dark:bg-black bg-white border rounded-md"
                    selected={date}
                    captionLayout="dropdown"
                    disabled={(d) => {
                        if (minDate && dayjs(d).isBefore(dayjs(minDate), 'day')) return true;
                        if (maxDate && dayjs(d).isAfter(dayjs(maxDate), 'day')) return true;
                        return false;
                    }}
                    onSelect={(d) => {
                        if (d) onSetDate(d);
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}

// ===== File uploader (inline, returns FileID) =====
function MinhChungUploader({
    files,
    onChange,
}: {
    files: MinhChungItem[];
    onChange: (files: MinhChungItem[]) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentName, setCurrentName] = useState('');

    const handleFiles = async (selected: FileList | null) => {
        if (!selected || selected.length === 0) return;
        const arr = Array.from(selected);
        setIsUploading(true);
        const uploaded: MinhChungItem[] = [];
        try {
            for (let i = 0; i < arr.length; i++) {
                const f = arr[i];
                setCurrentName(f.name);
                try {
                    const item = await drlService.uploadMinhChungInline(f, (p) => {
                        const total = Math.round(((i + p / 100) / arr.length) * 100);
                        setProgress(total);
                    });
                    if (item) uploaded.push(item);
                } catch (e) {
                    toast.error(`Tải lên ${f.name} thất bại`);
                }
            }
            if (uploaded.length) onChange([...files, ...uploaded]);
        } finally {
            setIsUploading(false);
            setProgress(0);
            setCurrentName('');
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const removeFile = (fileID: number) => {
        onChange(files.filter((f) => f.FileID !== fileID));
    };

    return (
        <div className="space-y-2">
            <div
                onClick={() => !isUploading && inputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
                <Upload className="mx-auto h-6 w-6 text-slate-500 mb-1" />
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Tải tài liệu minh chứng
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    Hỗ trợ: jpg, jpeg, png, webp, pdf
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {isUploading && (
                <div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                        <span className="truncate mr-2">Đang tải: {currentName}</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}

            {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {files.map((f) => (
                        <div
                            key={f.FileID}
                            className="flex items-center justify-between gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-w-0"
                        >
                            <a
                                href={drlService.getMinhChungPreviewUrl(f.FileID)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 min-w-0 flex-1 text-blue-600 dark:text-blue-300 hover:underline"
                                title={f.FileName}
                            >
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate text-sm">{f.FileName}</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => removeFile(f.FileID)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-300 rounded transition-colors shrink-0"
                                title="Xoá"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ===== Main =====
const DiemRL: React.FC = () => {
    const user: UserResponse | null = AuthStorage.getUser();

    const [hocKyInfo, setHocKyInfo] = useState<HocKyInfo | null>(null);
    const [trongTruong, setTrongTruong] = useState<HoatDongTrongTruong[]>([]);
    const [ngoaiTruong, setNgoaiTruong] = useState<HoatDongNgoaiTruong[]>([]);
    const [tongDiem, setTongDiem] = useState(0);
    const [diemTrongTruong, setDiemTrongTruong] = useState(0);
    const [diemNgoaiTruong, setDiemNgoaiTruong] = useState(0);

    const [tab, setTab] = useState<'trong' | 'ngoai'>('trong');
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialogs
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Form
    const [editingID, setEditingID] = useState<number | null>(null);
    const [tenChuongTrinh, setTenChuongTrinh] = useState('');
    const [tenToChuc, setTenToChuc] = useState('');
    const [tuNgay, setTuNgay] = useState<Date | undefined>(undefined);
    const [denNgay, setDenNgay] = useState<Date | undefined>(undefined);
    const [minhChung, setMinhChung] = useState<MinhChungItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [fromOpen, setFromOpen] = useState(false);
    const [toOpen, setToOpen] = useState(false);

    const periodMin = hocKyInfo?.TuNgay ? new Date(hocKyInfo.TuNgay) : undefined;
    const periodMax = hocKyInfo?.DenNgay ? new Date(hocKyInfo.DenNgay) : undefined;

    useEffect(() => {
        if (!user) {
            setError('Bạn chưa đăng nhập');
            setLoading(false);
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data: DanhSachHoatDongResponse = await drlService.getDanhSachHoatDong();
            setHocKyInfo(data.hocKyInfo);
            setTrongTruong(data.trongTruong);
            setNgoaiTruong(data.ngoaiTruong);
            setTongDiem(data.thongKe.TongDiem);
            setDiemTrongTruong(data.thongKe.TrongTruong);
            setDiemNgoaiTruong(data.thongKe.NgoaiTruong);
        } catch (e) {
            console.error('fetchData error:', e);
            if (e instanceof Error) setError(e.message);
        } finally {
            setTimeout(() => setLoading(false), 200);
        }
    };

    const resetForm = () => {
        setEditingID(null);
        setTenChuongTrinh('');
        setTenToChuc('');
        setTuNgay(periodMin);
        setDenNgay(undefined);
        setMinhChung([]);
    };

    const openCreate = () => {
        resetForm();
        setCreateOpen(true);
    };

    const openEdit = (item: HoatDongNgoaiTruong) => {
        setEditingID(item.HoatDongID);
        setTenChuongTrinh(item.TenChuongTrinh || '');
        setTenToChuc(item.TenToChuc || '');
        setTuNgay(item.TuNgay ? new Date(item.TuNgay) : undefined);
        setDenNgay(item.DenNgay ? new Date(item.DenNgay) : undefined);
        setMinhChung(item.DanhSachMinhChung || []);
        setEditOpen(true);
    };

    const openDelete = (id: number) => {
        setEditingID(id);
        setDeleteOpen(true);
    };

    const validateForm = () => {
        if (!tenChuongTrinh.trim() || !tenToChuc.trim()) {
            toast.error('Vui lòng nhập tên hoạt động và tên tổ chức');
            return false;
        }
        if (!tuNgay || !denNgay) {
            toast.error('Vui lòng chọn đầy đủ ngày tháng');
            return false;
        }
        if (dayjs(tuNgay).isAfter(dayjs(denNgay))) {
            toast.error('Ngày bắt đầu không được sau ngày kết thúc');
            return false;
        }
        if (minhChung.length === 0) {
            toast.error('Vui lòng tải lên ít nhất một tập tin minh chứng');
            return false;
        }
        return true;
    };

    const buildPayload = () => ({
        TenChuongTrinh: tenChuongTrinh.trim(),
        TenToChuc: tenToChuc.trim(),
        TuNgay: dayjs(tuNgay).format('YYYY-MM-DD'),
        DenNgay: dayjs(denNgay).format('YYYY-MM-DD'),
        FileMinhChung: minhChung.map((m) => m.FileID),
    });

    const handleCreate = async () => {
        if (!validateForm()) return;
        try {
            setSubmitting(true);
            await drlService.khaiBaoHoatDong(buildPayload());
            toast.success('Khai báo hoạt động thành công');
            setCreateOpen(false);
            resetForm();
            await fetchData();
        } catch (e) {
            if (e instanceof Error) toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!validateForm() || editingID == null) return;
        try {
            setSubmitting(true);
            await drlService.capNhatHoatDong({
                HoatDongID: editingID,
                ...buildPayload(),
            });
            toast.success('Cập nhật hoạt động thành công');
            setEditOpen(false);
            resetForm();
            await fetchData();
        } catch (e) {
            if (e instanceof Error) toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (editingID == null) {
            toast.error('Không tìm thấy hoạt động để xoá');
            return;
        }
        try {
            await drlService.xoaHoatDong(editingID);
            toast.success('Xoá hoạt động thành công');
        } catch (e) {
            if (e instanceof Error) toast.error(e.message);
        } finally {
            setDeleteOpen(false);
            setEditingID(null);
            await fetchData();
        }
    };

    // canUpdate: chỉ khi đang chờ duyệt (TinhTrang === 2)
    const canUpdate = (item: HoatDongNgoaiTruong) => item.TinhTrang === 2;

    // Filter ngoài trường theo status
    const filteredNgoai = ngoaiTruong.filter((i) => {
        if (statusFilter === 'approved') return i.TinhTrang === 3 || i.TinhTrang === 5;
        if (statusFilter === 'rejected') return i.TinhTrang === 4;
        return i.TinhTrang === 2;
    });

    const countPending = ngoaiTruong.filter((i) => i.TinhTrang === 2).length;
    const countApproved = ngoaiTruong.filter((i) => i.TinhTrang === 3 || i.TinhTrang === 5).length;
    const countRejected = ngoaiTruong.filter((i) => i.TinhTrang === 4).length;

    const isPeriodOpen = hocKyInfo?.ErrCode !== 1;

    if (loading) {
        return (
            <div className="flex justify-center">
                <LoadingScreen loading={loading} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra sự cố!</h2>
                    <p className="text-lg text-gray-700 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            fetchData();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // ====== Activity Form (shared between create + edit) ======
    const ActivityForm = (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Tên chương trình hoạt động</label>
                <Input
                    type="text"
                    value={tenChuongTrinh}
                    onChange={(e) => setTenChuongTrinh(e.target.value)}
                    placeholder="Nhập tên chương trình"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Tên tổ chức</label>
                <Input
                    type="text"
                    value={tenToChuc}
                    onChange={(e) => setTenToChuc(e.target.value)}
                    placeholder="Nhập tên tổ chức"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                    <label className="block text-sm font-medium mb-1">Từ ngày</label>
                    <DayPicker
                        open={fromOpen}
                        date={tuNgay}
                        onSetDate={(d) => {
                            setTuNgay(d);
                            if (denNgay && dayjs(denNgay).isBefore(dayjs(d))) setDenNgay(undefined);
                        }}
                        setOpen={setFromOpen}
                        minDate={periodMin}
                        maxDate={periodMax}
                    />
                </div>
                <div className="min-w-0">
                    <label className="block text-sm font-medium mb-1">Đến ngày</label>
                    <DayPicker
                        open={toOpen}
                        date={denNgay}
                        onSetDate={setDenNgay}
                        setOpen={setToOpen}
                        minDate={tuNgay || periodMin}
                        maxDate={periodMax}
                        disabled={!tuNgay}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Minh chứng</label>
                <MinhChungUploader files={minhChung} onChange={setMinhChung} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-3 sm:p-4 md:p-6">
            {/* ===== Create Dialog ===== */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Khai báo hoạt động ngoài trường</DialogTitle>
                        <DialogDescription>
                            Khai báo hoạt động phục vụ cộng đồng do sinh viên tự tham gia
                        </DialogDescription>
                    </DialogHeader>
                    {ActivityForm}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCreateOpen(false);
                                resetForm();
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            disabled={submitting}
                            onClick={handleCreate}
                        >
                            {submitting ? 'Đang gửi...' : 'Khai báo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Edit Dialog ===== */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Cập nhật hoạt động</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin hoạt động đang chờ duyệt
                        </DialogDescription>
                    </DialogHeader>
                    {ActivityForm}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditOpen(false);
                                resetForm();
                            }}
                        >
                            Hủy
                        </Button>
                        <Button type="button" disabled={submitting} onClick={handleEdit}>
                            {submitting ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Delete Dialog ===== */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xoá hoạt động</DialogTitle>
                    </DialogHeader>
                    <p className="mb-4">
                        Bạn có chắc chắn muốn xoá hoạt động này không? Hành động này không thể hoàn tác.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Xoá hoạt động
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Main content ===== */}
            <div className="max-w-7xl mx-auto">
                {/* Header card */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                PHỤC VỤ CỘNG ĐỒNG
                            </h1>
                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 break-words">
                                <span className="font-semibold">Họ tên:</span> {user?.FullName}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">
                                <span className="font-semibold">Mã:</span> {user?.UserID}
                            </p>
                            {hocKyInfo?.HocKy && hocKyInfo?.Nam && (
                                <div className="mt-2 text-xs sm:text-sm text-blue-600 dark:text-blue-300 flex items-center flex-wrap gap-x-2 gap-y-1">
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarIcon className="h-4 w-4" />
                                        Học kỳ {hocKyInfo.HocKy} | {hocKyInfo.Nam}
                                    </span>
                                    {periodMin && periodMax && (
                                        <span className="text-gray-500">
                                            ({fmt(hocKyInfo.TuNgay)} - {fmt(hocKyInfo.DenNgay)})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={openCreate}
                            disabled={!isPeriodOpen}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-400 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors w-full sm:w-auto shrink-0"
                        >
                            <Plus size={20} />
                            <span>Khai báo hoạt động</span>
                        </button>
                    </div>
                </div>

                {/* Period closed warning */}
                {!isPeriodOpen && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                        <span className="text-red-700 dark:text-red-200 font-medium">
                            Chưa đến kỳ / đã kết thúc khai báo hoạt động
                        </span>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Tổng điểm</div>
                        <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                            <span className={tongDiem >= 40 ? 'text-green-500' : 'text-red-500'}>
                                {tongDiem}
                            </span> / 45
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Trong trường</div>
                        <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                            {diemTrongTruong}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Tự khai báo</div>
                        <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {diemNgoaiTruong}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={tab} onValueChange={(v) => setTab(v as 'trong' | 'ngoai')}>
                    <TabsList className="grid w-full grid-cols-2 mb-4 h-auto">
                        <TabsTrigger value="trong" className="flex flex-col sm:flex-row sm:gap-1 py-2 text-xs sm:text-sm whitespace-normal">
                            <span className="font-medium">Trong trường</span>
                            <span className="text-[10px] sm:text-xs opacity-80">
                                ({trongTruong.length} HĐ - {diemTrongTruong}đ)
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="ngoai" className="flex flex-col sm:flex-row sm:gap-1 py-2 text-xs sm:text-sm whitespace-normal">
                            <span className="font-medium">SV tự khai báo</span>
                            <span className="text-[10px] sm:text-xs opacity-80">
                                ({ngoaiTruong.length} HĐ - {diemNgoaiTruong}đ)
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ===== Trong trường ===== */}
                    <TabsContent value="trong">
                        {trongTruong.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <CalendarIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                                <div>Chưa có hoạt động nào</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {trongTruong.map((item) => (
                                    <div
                                        key={item.HoatDongID}
                                        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 sm:p-4 border border-slate-200 dark:border-slate-700 flex flex-col"
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0 break-words text-sm sm:text-base">
                                                {item.TenChuongTrinh}
                                            </div>
                                            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap">
                                                {item.Diem} điểm
                                            </Badge>
                                        </div>
                                        {item.TenToChuc && (
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">
                                                🏢 {item.TenToChuc}
                                            </div>
                                        )}
                                        {item.ViTri && (
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">
                                                📍 {item.ViTri}
                                            </div>
                                        )}
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            📅 {fmt(item.TuNgay)} - {fmt(item.DenNgay)}
                                        </div>
                                        {item.HocKy && item.Nam && (
                                            <div className="text-[11px] sm:text-xs text-gray-500 mt-1">
                                                🎓 HK{item.HocKy} - {item.Nam}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ===== Ngoài trường ===== */}
                    <TabsContent value="ngoai">
                        {/* Status filter */}
                        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors text-center ${
                                    statusFilter === 'pending'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}
                            >
                                Chờ duyệt ({countPending})
                            </button>
                            <button
                                onClick={() => setStatusFilter('approved')}
                                className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors text-center ${
                                    statusFilter === 'approved'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                                }`}
                            >
                                Đã duyệt ({countApproved})
                            </button>
                            <button
                                onClick={() => setStatusFilter('rejected')}
                                className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors text-center ${
                                    statusFilter === 'rejected'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                                }`}
                            >
                                Từ chối ({countRejected})
                            </button>
                        </div>

                        {filteredNgoai.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <CalendarIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                                <div>Không có hoạt động nào</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {filteredNgoai.map((item) => (
                                    <div
                                        key={item.HoatDongID}
                                        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 sm:p-4 border border-slate-200 dark:border-slate-700 flex flex-col"
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0 break-words text-sm sm:text-base">
                                                {item.TenChuongTrinh}
                                            </div>
                                            <div className="shrink-0">
                                                <NgoaiTruongStatusChip
                                                    status={item.TinhTrang}
                                                    label={item.TenTinhTrang}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">
                                            🏢 {item.TenToChuc}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            📅 {fmt(item.TuNgay)} - {fmt(item.DenNgay)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-semibold">
                                                {item.Diem || 0} điểm
                                            </Badge>
                                        </div>

                                        {/* Minh chứng */}
                                        {item.DanhSachMinhChung &&
                                            item.DanhSachMinhChung.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                                        📎 Minh chứng:
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.DanhSachMinhChung.map((mc) => (
                                                            <a
                                                                key={mc.FileID}
                                                                href={drlService.getMinhChungPreviewUrl(
                                                                    mc.FileID
                                                                )}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-xs text-blue-600 dark:text-blue-300 max-w-full"
                                                                title={mc.FileName}
                                                            >
                                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                                                <span className="truncate max-w-[140px] sm:max-w-[160px]">
                                                                    {mc.FileName}
                                                                </span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        {/* Actions */}
                                        {canUpdate(item) && (
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-lg text-sm font-medium transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={14} />
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => openDelete(item.HoatDongID)}
                                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm font-medium transition-colors"
                                                    title="Xoá"
                                                >
                                                    <Trash2 size={14} />
                                                    Xoá
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default DiemRL;
