import React, { useState, useEffect } from 'react';
import { Lock, Check, Calendar, Clock, ChevronDownIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Calendar as Calen } from '../ui/calendar';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import toast from 'react-hot-toast';
import { ELIB_SERVICE } from '@/services/elibService';
import { DANGKY_PhongHocNhomForRegSelectResponse, DANGKY_ThietBiForRegSelectResponse, ToolForReg, DangKiThietBi, DangKyPayload } from '@/types/elib';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription } from '../ui/dialog';
import { DialogHeader } from '../ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import PowerOffSlide from '../smoothui/power-off-slide';
import { MdClose } from "react-icons/md";



const get_time = () => {
    const now = dayjs()
    if (7 <= now.hour() && now.hour() < 20) {
        return now.format('HH:mm')
    }
    return dayjs(new Date().setHours(7, 0, 0, 0)).format('HH:mm')
}

const getDate = () => {
    const today = new Date();
    const nowTime = dayjs();
    if (nowTime.hour() < 20) {
        return today;
    }
    return new Date(new Date().setDate(today.getDate() + 1));
}
const RoomBookingForm: React.FC<{ onBookingSuccess: (madatcho: string) => void, onClose: () => void }> = (
    { onBookingSuccess, onClose }
) => {
    const [roomsState, setRoomsState] = useState<DANGKY_PhongHocNhomForRegSelectResponse | null>(null);
    const [thietBiAvailable, setThietBiAvailable] = useState<DANGKY_ThietBiForRegSelectResponse | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [thietBiMuonMuon, setThietBiMuonMuon] = useState<DangKiThietBi[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date>(getDate())
    const [startTime, setStartTime] = React.useState<string | null>(get_time())
    const [endTime, setEndTime] = React.useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false);
    const [acceptDialog, setAcceptDialog] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);

    useEffect(() => {
        setLoading(true)
        fetchRoomData();
        fetchEquipmentData();
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchRoomData();
        fetchEquipmentData();
    }, [date, startTime, endTime])

    const fetchRoomData = async () => {
        try {
            // if (!date || !startTime || !endTime) return;
            const start = `${dayjs(date).format('YYYY-MM-DD')} ${startTime || '07:00'}`;
            const end = `${dayjs(date).format('YYYY-MM-DD')} ${endTime || '11:00'}`;
            const roomData = await ELIB_SERVICE.get_phong_hoc_for_reg(start, end);
            setRoomsState(roomData ? roomData : null);
            
        } catch (error) {
            console.error('Error fetching room data:', error);
            toast.error('Lỗi khi tải dữ liệu phòng học.');
            window.location.reload();
        }
    }

    const isStartTimeInPast = () => {
        if (!startTime) return false

        const now = dayjs()
        const start = dayjs(startTime, "HH:mm")

        // gắn giờ start vào ngày hôm nay
        const startToday = now
            .hour(start.hour())
            .minute(start.minute())
            .second(0)

        return startToday.isBefore(now)
     }

    const fetchEquipmentData = async () => {
        try {
            // if (!date || !startTime || !endTime) return;
            const start = `${dayjs(date).format('YYYY-MM-DD')} ${startTime || '07:00'}`;
            const end = `${dayjs(date).format('YYYY-MM-DD')} ${endTime || '11:00'}`;
            const thietBiData = await ELIB_SERVICE.get_thiet_bi_for_reg(start, end);
            setThietBiAvailable(thietBiData ? thietBiData : null);
        } catch (error) {
            console.error('Error fetching equipment data:', error);
            toast.error('Lỗi khi tải dữ liệu thiết bị.');
            window.location.reload();
        }
    }

    const handleRoomSelect = (roomId: number, isBusy: number) => {
        if (isBusy === 1) return; // Không cho phép chọn phòng bận
        if (!endTime || !startTime) return; // Không cho phép chọn khi chưa chọn thời gian
        setSelectedRoomId(roomId);
    };

    const handleEquipmentChange = (thietbi: ToolForReg, soLuongMuon: number) => {
         setThietBiMuonMuon(prev => {
            const index = prev.findIndex(
            tb => tb.ThietBiID === thietbi.ThietBiID
            )

            // ❌ không mượn → xoá khỏi mảng
            if (soLuongMuon <= 0) {
            if (index === -1) return prev
            return prev.filter(tb => tb.ThietBiID !== thietbi.ThietBiID)
            }

            // 🔄 đã tồn tại → update
            if (index !== -1) {
            const next = [...prev]
            next[index] = {
                ...next[index],
                SoLuongDKMuon: soLuongMuon
            }
            return next
            }

            // ➕ chưa có → thêm mới
            return [
            ...prev,
            {
                ...thietbi,
                SoLuongDKMuon: soLuongMuon
            }
        ]
        })
        
    };

    const clampTime = (time: dayjs.Dayjs, min: dayjs.Dayjs, max: dayjs.Dayjs) => {
        if (time.isBefore(min)) return min
        if (time.isAfter(max)) return max
        return time
    }


    const DayPicker = () => {

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    id="date"
                    className="w-48 justify-between font-normal"
                >
                    {date ? dayjs(date).format('DD/MM/YYYY') : "Select date"}
                    <ChevronDownIcon />
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calen
                    mode="single"
                    selected={date}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                        setDate(date || new Date())
                        setOpen(false)
                    }}
                    fromDate={getDate()} // Lấy ngày hợp lệ gần nhất tính từ hôm nay
                />
                </PopoverContent>
            </Popover>
        </div>
    )
    }

    const StartTImePicker = () => {
        const min = dayjs('07:00', 'HH:mm')
        const max = endTime
            ? dayjs(endTime, 'HH:mm')
            : dayjs('19:30', 'HH:mm')


        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker 
                    value={startTime ? dayjs(startTime, 'HH:mm') : null}
                    ampm={false}
                    minTime={endTime
                    ? dayjs(endTime, 'HH:mm').subtract(4, 'hour')
                    : min}
                    maxTime={max}
                    onChange={(newValue) => {
                        if (newValue) {
                            const safe = clampTime(
                                newValue,
                                endTime
                                ? dayjs(endTime, 'HH:mm').subtract(4, 'hour')
                                : min,
                                max
                            )
                            setStartTime(safe.format('HH:mm'))
                        }
                    }}
                />

            </LocalizationProvider>
        )
    }

    const EndTimePicker = () => {
    const min = startTime
    ? dayjs(startTime, 'HH:mm')
    : dayjs('07:00', 'HH:mm')

    const max = startTime
        ? dayjs(startTime, 'HH:mm').add(4, 'hour').isAfter(dayjs('19:30', 'HH:mm'))
        ? dayjs('19:30', 'HH:mm')
        : dayjs(startTime, 'HH:mm').add(4, 'hour')
        : dayjs('19:30', 'HH:mm')

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker 
                value={endTime ? dayjs(endTime, 'HH:mm') : null}
                ampm={false}
                minTime={min}
                maxTime={max}
                onChange={(newValue) => {
                    if (!newValue) return
                    const safe = clampTime(newValue, min, max)
                    setEndTime(safe.format('HH:mm'))
                }}
            />

        </LocalizationProvider>
    )
    }

    const submit = () => {
        setAcceptDialog(true);
    }

    const handleSubmit = async () => {
        console.log('Submitting booking...');
        if (!selectedRoomId || !thietBiAvailable) return;

        const bookingPayload: DangKyPayload = {
            DangKyID: '',
            PhongID: selectedRoomId,
            ThoiGianBD: `${dayjs(date).format('YYYY-MM-DD')} ${startTime}`,
            ThoiGianKT: `${dayjs(date).format('YYYY-MM-DD')} ${endTime || startTime}`,
            jsonThietBi: thietBiMuonMuon,
            GhiChu: '',
        }

        try {

            if (!isAccepted) {
                toast.error('Vui lòng đồng ý với quy định trước khi đăng ký phòng học nhóm.');
                return
            }
            // Call API
            toast.success('Đăng ký phòng học nhóm thành công!');
            console.log('Booking payload:', JSON.stringify(bookingPayload, null, 2));
            const result = await ELIB_SERVICE.dang_ky_phong_hoc_nhom(bookingPayload);
            if (result.success) {
                toast.success(`Đăng ký phòng học nhóm thành công!`);
                // Gọi lên component cha để mở danh sách thêm sinh viên
                if (onBookingSuccess && result.madatcho) {
                    onBookingSuccess(result.madatcho);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            toast.error('Lỗi khi đăng ký phòng học nhóm.');
        } finally {
            setAcceptDialog(false);
            handleCancel(); // reset form
        }
    };

    const handleCancel = () => {
        setSelectedRoomId(null);
        setThietBiMuonMuon([]);
        onClose();
    };

    if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-muted-foreground">Đang tải dữ liệu...</div>
        </div>
    );
    }

    if (!roomsState || !thietBiAvailable) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-destructive font-bold">Không thể tải dữ liệu</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-4xl mx-auto">
            <div className="bg-card border-2 border-border rounded-md shadow-brutal overflow-hidden">
                {/* Header */}
                <div className="bg-section text-section-foreground border-b-2 border-border px-6 py-4">
                <h1 className="text-2xl font-display font-black">Đăng Ký Phòng Học Nhóm
                <Button className='inline items-end float-right p-1 rounded-md hover:bg-destructive hover:text-destructive-foreground' variant={'ghost'}>
                    <MdClose size={20} onClick={onClose} />
                </Button>
                </h1>

                </div>

                <div className="p-6 space-y-6">
                {/* Khu vực 1: Thông tin thời gian */}
                <div className="bg-muted border-2 border-border rounded-md p-4">
                    <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-foreground">
                    <Calendar className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                    Thông Tin Thời Gian
                    {(startTime !== get_time() || endTime !== null || date.getDay() !== getDate().getDay()) && (
                    <Button className='flex items-start' variant={'destructive'} onClick={() => {
                        setStartTime(get_time());
                        setEndTime(null);
                        setDate(getDate());
                    }}>
                        Reset
                    </Button>
                    )}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Ngày</label>
                        <div className="flex items-center gap-2 px-3 py-2 h-14 bg-card border-2 border-border rounded-md text-foreground">
                        <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                        <DayPicker />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Giờ bắt đầu</label>
                        <div className="flex items-center gap-2 px-3 py-2 h-14 bg-card border-2 border-border rounded-md text-foreground">
                        <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                        <StartTImePicker />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Giờ kết thúc</label>
                        <div className="flex items-center gap-2 px-3 py-2 h-14 bg-card border-2 border-border rounded-md text-foreground">
                        <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                        <EndTimePicker />
                        </div>
                    </div>
                    </div>
                </div>

                {/* Khu vực 2: Danh sách phòng */}
                <div>
                    <h2 className="text-lg font-display font-bold mb-4 text-foreground">Chọn Phòng
                        <span className='block text-destructive text-sm underline cursor-help hover:opacity-50' onClick={() => setDialogOpen(true)}>Phòng nào là phù hợp với bạn?</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roomsState?.data.map(room => {
                        const isBusy = room.isBusy === 1;
                        const isSelected = selectedRoomId === room.PhongID;

                        return (
                            <div
                                key={room.PhongID}
                                onClick={() => handleRoomSelect(room.PhongID, room.isBusy)}
                                className={`
                                border-2 border-border rounded-md p-4 transition-all
                                ${isBusy || !endTime || !startTime
                                    ? 'bg-muted opacity-60 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-secondary text-secondary-foreground shadow-brutal cursor-pointer'
                                    : 'hover:shadow-brutal-sm cursor-pointer bg-card'
                                }
                                `}
                            >
                                <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    {isBusy ? (
                                    <Lock className="w-5 h-5 text-destructive" strokeWidth={2.5} />
                                    ) : (
                                    <Check className={`w-5 h-5 ${isSelected ? 'text-foreground' : 'text-[hsl(142_71%_45%)]'}`} strokeWidth={2.5} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-display font-bold text-foreground">{room.TenPhong}</h3>
                                    <div className="grid items-left gap-1 text-sm text-muted-foreground mt-1">

                                        <span className='inline'>Sức chứa: {room.SucChuaMin} - {room.SucChuaMax} người</span>
                                    </div>
                                    {isBusy && (
                                    <div className="grid items-center gap-1 text-sm text-destructive mt-2">
                                        <span>Phòng đã được đặt trước trong khung giờ này</span>
                                    </div>
                                    )}
                                    {(!endTime || !startTime ) && (
                                    <div className="grid items-center gap-1 text-sm text-destructive mt-2">
                                        <span>Vui lòng chọn thời gian bắt đầu và kết thúc</span>
                                    </div>
                                    )}
                                </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>

                {/* Khu vực 3: Danh sách thiết bị */}
                <div>
                    <h2 className="text-lg font-display font-bold mb-4 text-foreground">Đăng Ký Thiết Bị</h2>
                    <div className="space-y-3">
                    {thietBiAvailable?.data.map(eq => {
                        // const isOverbooked = eq.SoLuong - eq.SoLuongDaMuon < 0;
                        const maxQuantity = eq.SoLuong - eq.SoLuongDaMuon;
                        const isOutOfStock = maxQuantity <= 0;
                        const canBook = maxQuantity > 0;
                        const current = thietBiMuonMuon.find(tb => tb.ThietBiID === eq.ThietBiID)?.SoLuongDKMuon ?? 0

                        return (
                            <div
                                key={eq.ThietBiID}
                                className={`
                                    border-2 border-border rounded-md p-4 transition-all
                                    ${isOutOfStock || !endTime || !startTime
                                        ? 'bg-muted opacity-60'
                                        : 'hover:shadow-brutal-sm bg-card'
                                    }
                                `}
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Header: Tên thiết bị */}
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-display font-bold text-foreground flex-1">
                                            {eq.TenThietBi}
                                        </h4>
                                        <div className={`
                                            text-xs font-bold px-2 py-1 border-2 border-border rounded-md whitespace-nowrap text-black
                                            ${isOutOfStock
                                                ? 'bg-[hsl(27_96%_61%)]'
                                                : 'bg-[hsl(142_71%_45%)]'
                                            }
                                        `}>
                                            {isOutOfStock ? 'Hết thiết bị' : `Còn ${maxQuantity}/${eq.SoLuong}`}
                                        </div>
                                    </div>

                                    {/* Controls: Số lượng */}
                                    {canBook ? (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-muted-foreground">
                                                Số lượng mượn:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleEquipmentChange(eq, Math.max(0, current - 1))}
                                                    disabled={current === 0}
                                                    variant={'outline'}
                                                    size="sm"
                                                    className="w-9 h-9 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    -
                                                </Button>
                                                <Input
                                                    type='number'
                                                    min="0"
                                                    max={maxQuantity}
                                                    value={current || 0}
                                                    disabled={isOutOfStock || !endTime || !startTime}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        handleEquipmentChange(eq, Math.min(maxQuantity, Math.max(0, value)));
                                                    }}
                                                    className="w-16 h-9 text-center border-2 border-border rounded-md"
                                                />
                                                <Button
                                                    onClick={() => handleEquipmentChange(eq, Math.min(maxQuantity, current + 1))}
                                                    disabled={current >= maxQuantity || isOutOfStock || !endTime || !startTime}
                                                    variant={'outline'}
                                                    size="sm"
                                                    className="w-9 h-9 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2 text-sm text-muted-foreground">
                                            Không thể mượn thiết bị này
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
                </div>

                {/* Footer */}
                <div className="bg-muted px-6 py-4 flex justify-end gap-3 border-t-2 border-border">
                    <Button
                        onClick={handleCancel}
                        className="px-6 py-2 rounded-md"
                        variant={'outline'}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={!selectedRoomId || !isStartTimeInPast()}
                        className={`
                        px-6 py-2 rounded-md font-bold transition-colors
                        ${selectedRoomId || !isStartTimeInPast()
                            ? 'bg-primary text-primary-foreground border-2 border-border shadow-brutal hover:bg-primary/90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }
                        `}
                    >
                        Đăng Ký
                    </Button>
                </div>
            </div>

            <Dialog open={acceptDialog} onOpenChange={setAcceptDialog}>
                <DialogContent className='max-w-lg w-[90vw]'>
                    <DialogHeader>
                        <DialogTitle>Xác Nhận Đăng Ký Phòng Học Nhóm</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Bạn có chắc chắn muốn đăng ký phòng học nhóm với các thông tin đã chọn không? Vui lòng kiểm tra kỹ trước khi xác nhận.<br/>
                        <span className='font-bold text-destructive'>Lưu ý: Đọc kỹ các quy định về việc sử dụng phòng học nhóm trong thư viện ở trang trước đó.</span>
                        <PowerOffSlide
                            label='Tôi dong tinh'
                            onPowerOff={() =>{ setIsAccepted(true); handleSubmit();}}
                        />
                    </DialogDescription>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className='max-w-6xl w-[95vw] max-h-[90vh] overflow-auto'>
                    <DialogHeader>
                        <DialogTitle>Bản đồ phòng thư viện</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Dưới đây là bản đồ các phòng học nhóm trong thư viện. Vui lòng tham khảo để chọn phòng phù hợp với nhu cầu của bạn.
                    </DialogDescription>
                    <img src="/ThuVienMap.png" alt="Bản đồ phòng thư viện" className="w-full h-auto" />
                </DialogContent>
            </Dialog>

            </div>
        </div>
    );
};

export default RoomBookingForm;