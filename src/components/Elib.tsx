import React, { useState, useEffect, useRef, memo } from 'react';
import { Calendar as Calen, dateFnsLocalizer } from 'react-big-calendar';
import { DangKy, RoomData, ThongSo } from '@/types/elib';
import { AuthStorage } from '@/types/user';
import { Clock, Users, ChevronDown, ChevronUp, UserPlus, MoreVertical, QrCode, Copy, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { MdNoFood } from "react-icons/md";
import { LuClockAlert, LuPowerOff } from "react-icons/lu";
import { PiWarningDiamondFill } from "react-icons/pi";
import { ELIB_SERVICE } from '@/services/elibService';
import { vi } from 'date-fns/locale';
import { format, getDay, startOfWeek, parse } from 'date-fns';
import dayjs from 'dayjs';
import { ToolbarProps } from "react-big-calendar";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import toast from 'react-hot-toast';
// @ts-ignore
import RoomBookingForm from './LHU_UI/Elib_register';
import StudentManager from './LHU_UI/Elib_manage_room';
import "./Timetable.css";
// ============== TYPES ==============

interface NoiQuy {
  icon: React.ReactNode;
  text: string;
}

interface StatusColor {
  bg: string;
  text: string;
  label: string;
  style: string;
}

interface TimeLeft {
  minutes: number;
  seconds: number;
  total: number;
}

interface FormattedDateTime {
  date: string;
  time: string;
}

enum ActionType {
  Invite = 'invite',
  Qr = 'qr',
  Edit = 'edit',
  Cancel = 'cancel',
  Detail = 'detail',
  Expired = 'expired'
}

interface Action {
  id: ActionType;
  icon: React.ReactNode;
  label: string;
  show: boolean;
}

// // ============== MODEL ==============
const MODEL = {
  dataThongSo: {
    MinimumMember: 3,
    TimeToExpired: 30,
    TimeoutAfterNoCheckIn: 15,
    MaxRoomBookingLimit: 4
  } as ThongSo,
  
  dataNoiQuy: [
    { icon: <LuClockAlert className="w-5 h-5" />, text: `Phải check-in trong vòng 15 phút sau giờ đặt` },
    { icon: <LuClockAlert className="w-5 h-5" />, text: `Sau 30 phút từ lúc đăng kí nếu sinh viên không đủ thì hệ thống sẽ tự huỷ lịch` },
    { icon: <Users className="w-5 h-5" />, text: "Số lượng tối thiểu đăng kí một phòng 3 thành viên" },
    { icon: <PiWarningDiamondFill className="w-5 h-5" />, text: "Phòng chỉ dành cho học nhóm, không được sử dụng vào mục đích khác" },
    { icon: <LuPowerOff className="w-5 h-5" />, text: "Trước khi rời phòng phải tắt thiết bị điện" },
    { icon: <MdNoFood className="w-5 h-5" />, text: "Không được mang thức ăn (trừ nước uống) vào phòng học nhóm" },
  ] as NoiQuy[],

};

const getNoiQuy = async (systemThongSo: ThongSo | null): Promise<NoiQuy[]> => {
  if (systemThongSo === null) {
    return MODEL.dataNoiQuy;
  }

  const dataNoiQuy: NoiQuy[] = [
    { icon: <LuClockAlert className="w-5 h-5" />, text: `Phải check-in trong vòng ${systemThongSo.TimeoutAfterNoCheckIn} phút sau giờ đặt` },
    { icon: <LuClockAlert className="w-5 h-5" />, text: `Sau ${systemThongSo.TimeToExpired} phút từ lúc đăng kí nếu sinh viên không đủ thì hệ thống sẽ tự huỷ lịch` },
    { icon: <Users className="w-5 h-5" />, text: `Số lượng tối thiểu đăng kí một phòng ${systemThongSo.MinimumMember} thành viên` },
    { icon: <PiWarningDiamondFill className="w-5 h-5" />, text: "Phòng chỉ dành cho học nhóm, không được sử dụng vào mục đích khác" },
    { icon: <LuPowerOff className="w-5 h-5" />, text: "Trước khi rời phòng phải tắt thiết bị điện" },
    { icon: <MdNoFood className="w-5 h-5" />, text: "Không được mang thức ăn (trừ nước uống) vào phòng học nhóm" },
  ]

  return dataNoiQuy;

};

// ============== PRESENTER ==============
class Presenter {
  static getStatusColor(trangThai: number, TGKetThuc: string): StatusColor {

    if (new Date(TGKetThuc).getTime() < new Date().getTime()) {
      return { bg: '#57595B', text: '#E8D1C5', label: 'Đã kết thúc', style: ''}
    }
    
    const colors: Record<number, StatusColor> = {
      0: { bg: '#8CA9FF', text: '#FFF8DE', label: 'Chờ đủ người', style: '' },
      1: { bg: '#F39EB6', text: '#F7F6D3', label: 'Đã xác nhận', style: '' },
      2: { bg: '#360185', text: '#F4B342', label: 'Đang sử dụng', style: '' },
      3: { bg: '#57595B', text: '#E8D1C5', label: 'Phòng đã bị huỷ', style: 'hidden' }
    };
    return colors[trangThai];
  }

  static calculateTimeLeft(targetTime: Date): TimeLeft | null {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    if (diff <= 0) return null;
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds, total: diff };
  }

  static canPerformAction(
    currentUserId: string, 
    roomOwnerId: string, 
    trangThai: number, 
    actionType: ActionType
  ): boolean {
    const isOwner = currentUserId === roomOwnerId;
    
    const permissions: Record<ActionType, boolean> = {
      edit: isOwner && trangThai !== 2,
      cancel: isOwner && trangThai !== 2,
      invite: isOwner && trangThai === 0,
      qr: trangThai === 1 || trangThai === 2,
      detail: true,
      expired: true
    };
    
    return permissions[actionType];
  }

  static formatDateTime(date: Date): FormattedDateTime {
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  }

  static getProgressColor(current: number, max: number): string {
    const percentage = (current / max) * 100;
    if (percentage >= 75) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  }
}

// ============== VIEW COMPONENTS ==============

interface CountdownTimerProps {
  targetTime: Date;
  onExpired?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetTime, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(Presenter.calculateTimeLeft(targetTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Presenter.calculateTimeLeft(targetTime);
      setTimeLeft(remaining);
      
      if (!remaining && onExpired) {
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onExpired]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-semibold">
      <Clock className="w-4 h-4" />
      <span>{timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}</span>
    </div>
  );
};

interface ExpansionPanelProps {
  title: string;
  items: NoiQuy[];
  defaultOpen?: boolean;
}

const ExpansionPanel: React.FC<ExpansionPanelProps> = ({ title, items, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        {isOpen ? <ChevronUp className="w-5 h-5 dark:text-gray-300" /> : <ChevronDown className="w-5 h-5 dark:text-gray-300" />}
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-900 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">{item.icon}</div>
              <p className="text-gray-700 dark:text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface BookingCardProps {
  booking: DangKy;
  currentUserId: string;
  onAction: (actionType: ActionType, bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, currentUserId, onAction }) => {
  const status = Presenter.getStatusColor(booking.TrangThai, booking.ThoiGianKT);
  const startTime = Presenter.formatDateTime(new Date(booking.ThoiGianBD));
  const endTime = Presenter.formatDateTime(new Date(booking.ThoiGianKT));
  const isOwner = currentUserId === booking.DocGiaDangKy;

  const [showMenu, setShowMenu] = useState<boolean>(false);

  const actions: Action[] = [
    { id: ActionType.Invite, icon: <UserPlus className="w-4 h-4" />, label: 'Mời thành viên', show: Presenter.canPerformAction(currentUserId, booking.DocGiaDangKy, booking.TrangThai, ActionType.Invite) },
    { id: ActionType.Qr, icon: <QrCode className="w-4 h-4" />, label: 'QR Check-in', show: Presenter.canPerformAction(currentUserId, booking.DocGiaDangKy, booking.TrangThai, ActionType.Qr) },
    { id: ActionType.Edit, icon: <Edit className="w-4 h-4" />, label: 'Chỉnh sửa', show: Presenter.canPerformAction(currentUserId, booking.DocGiaDangKy, booking.TrangThai, ActionType.Edit) },
    { id: ActionType.Cancel, icon: <Trash2 className="w-4 h-4" />, label: 'Hủy đăng ký', show: Presenter.canPerformAction(currentUserId, booking.DocGiaDangKy, booking.TrangThai, ActionType.Cancel) },
    { id: ActionType.Detail, icon: <Eye className="w-4 h-4" />, label: 'Chi tiết', show: Presenter.canPerformAction(currentUserId, booking.DocGiaDangKy, booking.TrangThai, ActionType.Detail) }
  ].filter(a => a.show);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        <div className="p-4 text-white text-center md:w-32" style={{ backgroundColor: status.text }}>
          <div className="text-2xl font-bold">{startTime.date}</div>
          <div className="text-sm mt-1">{startTime.time}</div>
          <div className="text-xs opacity-80">đến</div>
          <div className="text-sm">{endTime.time}</div>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{booking.TenPhong}</h3>
            </div>
            
            <span 
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: status.bg, color: status.text }}
            >
              {status.label}
            </span>
          </div>

          {booking.TrangThai === 0 && (
            <CountdownTimer 
              targetTime={new Date(booking.ThoiGianBD)} 
              onExpired={() => onAction(ActionType.Expired, booking.DangKyID)}
            />
          )}

          {(() => {
            const thietBiList: Array<{ TenThietBi: string }> = (() => {
              if (!booking.ThietBi) return [];
              if (Array.isArray(booking.ThietBi)) return booking.ThietBi as any;
              try {
                const parsed = JSON.parse(booking.ThietBi as unknown as string);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })();

            if (thietBiList.length === 0) return null;

            return (
              <div className="mt-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Thiết bị mượn:</div>
                <div className="flex flex-wrap gap-2">
                  {thietBiList.map((tb, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                      {tb.TenThietBi}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="p-4 flex md:flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
          {isOwner && booking.TrangThai === 0 && (
            <button
              onClick={() => onAction(ActionType.Invite, booking.DangKyID)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden md:inline">Mời</span>
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {actions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      onAction(action.id, booking.DangKyID);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm text-gray-700 dark:text-gray-200"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// ============== MAIN APP ==============
const Elib: React.FC = () => {
  const [dataLichCaNhan, setDataLichCaNhan] = useState<DangKy[]>([]);
  const [dataLuotDaDangKy, setDataLuotDaDangKy] = useState<number>(0);
  const [chkAgree, setChkAgree] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [MaxRoomBookingLimit, setMaxRoomBookingLimit] = useState<number>(0);
  const [noiQuyItems, setNoiQuyItems] = useState<NoiQuy[]>([]);
  const [roomConfiguration, setRoomConfiguration] = useState<RoomData[]>([]);
  const [event, setEvent] = useState<any[]>([]); // Tao đầu hàng, any[] cứu tao pha này
  const [currentViewedEvent, setCurrentViewedEvent] = useState<any>(null)
  const [showDetailFocusedEvent, setShowFocusedEvent] = useState(false)
  const eventCache = useRef<Record<string, any[]>>({})
  const user = AuthStorage.getUser();
  const [is_booking_open, setIsBookingOpen] = useState<boolean>(false);
  const [is_modification_room_dialog_open, setIsModificationRoomDialogOpen] = useState<boolean>(false);
  const [selectedBookingNumber, setSelectedBookingNumber] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const thongSo = await ELIB_SERVICE.get_thong_so();
      setNoiQuyItems(await getNoiQuy(thongSo));
      
      const roomConfiguration = await ELIB_SERVICE.get_room_configuation();
      setRoomConfiguration(roomConfiguration?.data || []);
      setMaxRoomBookingLimit(thongSo?.MaxRoomBookingLimit || 0)

      // Load user's personal bookings
      const lichCaNhanResponse = await ELIB_SERVICE.get_user_booking_list();
      if (lichCaNhanResponse) {
        setDataLuotDaDangKy(lichCaNhanResponse.data[1][0]?.SoLuotDaDangKy || 0);
        // data[0] is the list of the current user's reservations returned by the API
        setDataLichCaNhan((lichCaNhanResponse.data[0] as DangKy[]) || []);
      }

      const init_date = dayjs().format("YYYY-MM-DD")

      if (eventCache.current[init_date]) {
        setEvent(
          eventCache.current[init_date].filter(e => 
            Presenter.getStatusColor(e.TrangThai, e.ThoiGianKT).style !== 'hidden'
          )
        );
        return;
      }
      
      const booked_list = await ELIB_SERVICE.get_reservation_by_day(init_date)

      const events = booked_list?.data.map(e => ({
        ...e,
        title: `${e.FirstName} ${e.LastName}`,
        start: new Date(e.ThoiGianBD),
        end: new Date(e.ThoiGianKT),
        resourceId: e.TenPhong,
      })).filter(e => Presenter.getStatusColor(e.TrangThai, e.ThoiGianKT).style !== 'hidden') || []

      eventCache.current[init_date] = events;

      setEvent(events || [])

    }
    load();
  }, []);

  
  const handleNavigate = async (date: Date) => {
    const dayKey = dayjs(date).format("YYYY-MM-DD");

    // 🔥 cache hit
    if (eventCache.current[dayKey]) {
      setEvent(
        eventCache.current[dayKey].filter(e => 
          Presenter.getStatusColor(e.TrangThai, e.ThoiGianKT).style !== 'hidden'
        )
      );
      return;
    }

    // ❄ cache miss → gọi API
    const booked_list = await ELIB_SERVICE.get_reservation_by_day(dayKey);

    const events =
      booked_list?.data
        .map(e => ({
          ...e,
          title: `${e.FirstName} ${e.LastName}`,
          start: new Date(e.ThoiGianBD),
          end: new Date(e.ThoiGianKT),
          resourceId: e.TenPhong,
        }))
        .filter(e => Presenter.getStatusColor(e.TrangThai, e.ThoiGianKT).style !== 'hidden') // 🔥 lọc luôn
      || [];

    // 🧠 lưu cache
    eventCache.current[dayKey] = events;

    setEvent(events);
  };

  const CustomToolbar = ({
    label,
    onNavigate,
  }: ToolbarProps) => {
    return (
      <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
        {/* LEFT */}
        <div className='flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3'>
          <div className="toolbar-left">
            <div className="flex gap-2">
              <button 
                onClick={() => onNavigate("TODAY")}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold text-sm"
              >
                Hôm nay
              </button>
              <button 
                onClick={() => onNavigate("PREV")}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                <FaArrowLeft />
              </button>
              <button 
                onClick={() => onNavigate("NEXT")}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                <FaArrowRight />
              </button>
            </div>
          </div>

          {/* CENTER */}
          <div className="toolbar-center">
            <strong>{label}</strong>
          </div>
        </div>
      </div>
    );
  };

  const EventComponent = memo(({ event }: {event: any}) => {
    const status = Presenter.getStatusColor(event.TrangThai, event.ThoiGianKT)

    return (
      <div className="p-1">
        <div className="text-sm font-semibold line-clamp-2">
          {event.title}
        </div>

        <Badge
          variant="secondary"
          className="mt-1 text-xs px-1.5 py-0 bg-indigo-600 text-white border-0"
        >
          {status.label}
        </Badge>
      </div>
    );
  });

  const eventStyleGetter = (event: any) => {
    const status = Presenter.getStatusColor(event.TrangThai, event.ThoiGianKT)

    return {
      style: {
        backgroundColor: status.bg,
        borderRadius: "6px",
        color: status.text,
        border: "",
      },
    };
  };


  const handleAction = async (actionType: ActionType, bookingId: string): Promise<void> => {
    switch(actionType) {
      case 'invite':
        setSelectedBookingNumber(bookingId);
        setIsModificationRoomDialogOpen(true);
        break;
        
      case 'qr':
        setSelectedBookingId(bookingId);
        setShowQRModal(true);
        break;
        
      case 'edit':
        setSelectedBookingNumber(bookingId);
        setIsModificationRoomDialogOpen(true);
        break;
        
      case 'cancel':
        if (confirm('Bạn có chắc muốn hủy đăng ký này?')) {
          const result = await ELIB_SERVICE.cancel_booking(bookingId);
          if (result.success) {
            toast.success('Đã hủy đăng ký thành công');

            // Refresh personal bookings + count from the dedicated endpoint
            const lichCaNhan = await ELIB_SERVICE.get_user_booking_list();
            if (lichCaNhan) {
              setDataLichCaNhan((lichCaNhan.data[0] as DangKy[]) || []);
              setDataLuotDaDangKy(lichCaNhan.data[1][0]?.SoLuotDaDangKy || 0);
            }

            // Refresh calendar for today
            const init_date = dayjs().format("YYYY-MM-DD");
            const booked_list = await ELIB_SERVICE.get_reservation_by_day(init_date);
            if (booked_list) {
              const events = booked_list.data.map(e => ({
                ...e,
                title: `${e.FirstName} ${e.LastName}`,
                start: new Date(e.ThoiGianBD),
                end: new Date(e.ThoiGianKT),
                resourceId: e.TenPhong,
              })).filter(e => Presenter.getStatusColor(e.TrangThai, e.ThoiGianKT).style !== 'hidden');

              eventCache.current[init_date] = events;
              setEvent(events);
            }
          } else {
            toast.error(result.message);
          }
        }
        break;
        
      case 'detail':
        const detailBooking = dataLichCaNhan.find(b => b.DangKyID === bookingId);
        if (detailBooking) {
          setCurrentViewedEvent(detailBooking);
          setShowFocusedEvent(true);
        }
        break;
        
      case 'expired':
        setDataLichCaNhan(prev => prev.map(b => 
          b.DangKyID === bookingId ? { ...b, TrangThai: 3 as const } : b
        ));
        toast('Đăng ký đã hết hạn', { icon: 'ℹ️' });
        break;
    }
  };

  useEffect(() => {
    setIsModificationRoomDialogOpen(selectedBookingNumber !== null);
  }, [selectedBookingNumber]);

  const handleRegister = (): void => {
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (madatcho: string) => {
    setIsBookingOpen(false);
    setSelectedBookingNumber(madatcho);
  }

  if (is_booking_open) {
    return (
      <RoomBookingForm onBookingSuccess={handleBookingSuccess} onClose={() => setIsBookingOpen(false)} />
    )
  }

  if (is_modification_room_dialog_open && selectedBookingNumber) {
    return (
      <StudentManager 
        dangKyID={selectedBookingNumber} 
        onClose={() => {
          setSelectedBookingNumber(null);
          setIsModificationRoomDialogOpen(false);
        }} 
      />
    )
  }

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép mã QR vào clipboard")
  };

  const progressPercentage: number = (dataLuotDaDangKy / MaxRoomBookingLimit) * 100;
  const progressColor: string = Presenter.getProgressColor(dataLuotDaDangKy, MaxRoomBookingLimit);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto space-y-6">

        <ExpansionPanel 
          title="📋 Nội quy đăng ký phòng học nhóm"
          items={noiQuyItems}
          defaultOpen={true}
        />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <span className='mt-0 '>
            <span className='inline font-bold'>Lưu ý:</span> Mỗi lượt max 4 giờ, mỗi bạn được đăng kí phòng học nhóm tối đa <span className='font-bold inline'>2 lượt</span> (dự trữ hoặc đang dùng),
            sau khi trả phòng sẽ được đăng kí lượt mới
          </span>
          <div className="border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4 mb-4 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Số lượt đã đăng ký: {dataLuotDaDangKy}/{MaxRoomBookingLimit}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Còn lại: {MaxRoomBookingLimit - dataLuotDaDangKy} lượt
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chkAgree}
                onChange={(e) => setChkAgree(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300 font-loveHouse">OK to the rule ?</span>
            </label>

            <button
              onClick={handleRegister}
              disabled={!chkAgree}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                chkAgree 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer' 
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Đăng ký phòng
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📅 Lịch đăng ký của bạn</h2>
          
          {dataLichCaNhan.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 rounded-lg p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto text-red-400 dark:text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 font-semibold">Bạn chưa đăng ký lịch nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dataLichCaNhan.filter(b => b.TrangThai !== 3).map(booking => (
                <BookingCard
                  key={booking.DangKyID}
                  booking={booking}
                  currentUserId={user?.UserID.toString() || ''}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📆 Lịch tổng quát</h2>
            <Calen
              localizer={dateFnsLocalizer({
                format,
                parse,
                startOfWeek,
                getDay,
                locales: {
                  'vi': vi,
                }
              })}
              view='day'
              views={["day"]}
              min={new Date(2023, 0, 1, 7, 0)} // 7:00 AM
              max={new Date(2023, 0, 1, 20, 0)} // 19:00 PM
              step={30}
              timeslots={2}
              culture='vi'
              resourceIdAccessor={"TenPhong"}
              resourceTitleAccessor={"TenPhong"}
              resources={roomConfiguration}
              onSelectEvent={(event) => {
                setCurrentViewedEvent(event)
                setShowFocusedEvent(true)
                console.log(JSON.stringify(currentViewedEvent))
                console.log(showDetailFocusedEvent)
              }}
              events={event}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
                event: EventComponent
              }}
              onNavigate={handleNavigate}
            />
        </div>

        <Dialog open={showDetailFocusedEvent && currentViewedEvent !== null} onOpenChange={setShowFocusedEvent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Xem lịch {currentViewedEvent?.resourceId} 
              </DialogTitle>
              <DialogDescription>
                Phòng thuê bởi {currentViewedEvent?.FirstName} {currentViewedEvent?.LastName}
              </DialogDescription>
            </DialogHeader>
            {currentViewedEvent && (
              <div className="space-y-4 text-sm">
                {/* Thời gian */}
                <div className="border rounded-lg p-3">
                  <p className="font-semibold mb-1">⏰ Thời gian sử dụng</p>
                  <p>
                    <span className="font-medium">Bắt đầu:</span>{" "}
                    {new Date(currentViewedEvent.ThoiGianBD).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Kết thúc:</span>{" "}
                    {new Date(currentViewedEvent.ThoiGianKT).toLocaleString()}
                  </p>
                </div>

                {/* Người đăng ký */}
                <div className="border rounded-lg p-3">
                  <p className="font-semibold mb-1">👤 Người đăng ký</p>
                  <p>
                    {currentViewedEvent.FirstName} {currentViewedEvent.LastName}
                  </p>
                  <p className="text-gray-500">
                    Mã độc giả: {currentViewedEvent.DocGiaDangKy}
                  </p>
                </div>

                {/* Phòng + trạng thái */}
                <div className="border rounded-lg p-3">
                  <p className="font-semibold mb-1">🏫 Thông tin phòng</p>
                  <p>Tên phòng: {currentViewedEvent.TenPhong}</p>
                  <p>
                    Trạng thái:{" "}
                    <span className="font-medium">
                      {currentViewedEvent.TrangThai === 1 && "Đã đăng ký"}
                      {currentViewedEvent.TrangThai === 2 && "Đang sử dụng"}
                      {currentViewedEvent.TrangThai === 3 && "Đã trả phòng"}
                    </span>
                  </p>
                </div>

                {/* Số người */}
                <div className="border rounded-lg p-3">
                  <p className="font-semibold mb-1">👥 Số lượng thành viên</p>
                  <p>{currentViewedEvent.SoLuongTV} người</p>
                </div>

                {/* Thiết bị */}
                <div className="border rounded-lg p-3">
                  <p className="font-semibold mb-2">🔌 Thiết bị mượn</p>

                  {JSON.parse(currentViewedEvent.ThietBi || "[]").length === 0 ? (
                    <p className="text-gray-500 italic">Không mượn thiết bị</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      {JSON.parse(currentViewedEvent.ThietBi).map((tb: any) => (
                        <li key={tb.ThietBiID}>
                          {tb.TenThietBi} — ĐK mượn: {tb.SoLuongDKMuon}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Ghi chú */}
                {currentViewedEvent.GhiChu && (
                  <div className="border rounded-lg p-3">
                    <p className="font-semibold mb-1">📝 Ghi chú</p>
                    <p>{currentViewedEvent.GhiChu}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold dark:text-gray-100">QR Check-in</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <div className="bg-white dark:bg-gray-600 p-4 rounded-lg">
                  <QrCode className="w-48 h-48 mx-auto text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Mã: LIB-{selectedBookingId}
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(`LIB-${selectedBookingId}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Copy className="w-4 h-4" />
                Sao chép mã
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Elib;