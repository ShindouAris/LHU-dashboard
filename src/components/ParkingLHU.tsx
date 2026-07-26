import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Car, Clock, ArrowDownRight, DollarSign, ArrowRight, AlertCircle, X, RefreshCw } from 'lucide-react';
import { AuthStorage, UserResponse } from '@/types/user';
import { parkingAPI } from '@/services/authService';
import { PaymentHistory, PlateData, DepositHistory } from '@/types/parking';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const ParkingLHUPage = () => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [credit, setCredit] = useState<number>(0)
  const [vehicle, setVehicle] = useState<PlateData[]>([])
  const [paymentOut, setPaymentOut] = useState<PaymentHistory[]>([])
  const [depositHistory, setDepositHistory] = useState<DepositHistory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = () => {
        const userdata = AuthStorage.getUser()
        if (!userdata) {
            return
        }
        setUser(userdata)
    }
    fetchUser()
  }, [])

  const fetchDataParking = useCallback(async () => {
    const api = parkingAPI
    setLoading(true)
    setError(null)
    try {
        const [balance, vehicleData, paymentData, depositData] = await Promise.all([
          api.getCredit(),
          api.getPlates(),
          api.getLogPay(),
          api.getDepositHistory()
        ])
        setCredit(balance)
        setVehicle(vehicleData)
        if (paymentData) {
          setPaymentOut(paymentData)
        }
        if (depositData) {
          setDepositHistory(depositData)
        }
    } catch (error) {
        console.error('Error fetching parking data:', error)
        const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
        setError(errorMessage)
    } finally {
        setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDataParking()
  }, [fetchDataParking])

  const VEHICLEMAP = {
    "BIKE": "Xe Máy",
    "CAR": "Xe Hơi"
  }

  const formatDay = (time: string) => {
    const date = new Date(time);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} • ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  const formatDate = (time: string) => {
    const date = new Date(time);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
    };
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>
              <div className="flex items-center justify-between gap-4">
                <span className="flex-1">{error}</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={fetchDataParking}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Thử lại
                  </Button>
                  <button
                    onClick={() => setError(null)}
                    className="hover:opacity-70 transition-opacity p-1"
                    aria-label="Đóng thông báo lỗi"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black text-foreground mb-2">Tài Khoản Của Tôi</h1>
          <p className="text-muted-foreground">Quản lý số dư và lịch sử giao dịch</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Balance Card */}
          <div className="bg-section text-section-foreground border-2 border-border rounded-md shadow-brutal p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-card text-foreground border-2 border-border p-3 rounded-md">
                <DollarSign className="w-6 h-6" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-sm font-semibold mb-1">Số dư tài khoản</p>
            <h2 className="text-3xl font-display font-black tabular-nums mb-2">
              {loading ? '...' : formatCurrency(credit)}
            </h2>
            <p className="text-xs font-medium">{user?.FullName || 'Đang tải...'}</p>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[hsl(142_71%_45%)] text-black border-2 border-border p-3 rounded-md">
                <CreditCard className="w-6 h-6" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Tổng giao dịch</p>
            <h3 className="text-3xl font-display font-black tabular-nums text-foreground mb-1">
              {loading ? '...' : paymentOut.length + depositHistory.length}
            </h3>
            <p className="text-sm font-semibold text-[hsl(142_71%_45%)]">↑ Hoạt động bình thường</p>
          </div>
        </div>

        {/* License Plates Section */}
        <div className="bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Car className="w-5 h-5" strokeWidth={2.5} />
              Danh Sách Biển Số Xe
            </h2>
            <Button
              size="sm"
              onClick={() => {toast.error("Dùng ME để thêm xe nhé, mình không làm cái tính năng này")}}>
              + Thêm xe
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 text-center text-muted-foreground py-8">Đang tải...</div>
            ) : vehicle.length === 0 ? (
              <div className="col-span-3 text-center text-muted-foreground py-8">Chưa có biển số xe nào</div>
            ) : (
              vehicle.map((plate) => (
                <div
                  key={plate.id}
                  className="relative bg-secondary text-secondary-foreground border-2 border-border rounded-md p-5 shadow-brutal-sm"
                >
                  <div>
                    <p className="text-xs font-semibold mb-2">{VEHICLEMAP[plate.type]}</p>
                    <h3 className="text-2xl font-display font-black tracking-wider text-center bg-card text-foreground border-2 border-border rounded-md py-3 px-2">
                      {plate.plate}
                    </h3>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5" strokeWidth={2.5} />
              Lịch Sử thanh toán đỗ xe
            </h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Đang tải...</div>
            ) : paymentOut.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Chưa có lịch sử thanh toán đỗ xe</div>
            ) : (
              paymentOut.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-muted border-2 border-border rounded-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-md border-2 border-border bg-destructive text-black">
                      <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {transaction.licensePlateIn}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDay(transaction.timeOut)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black tabular-nums text-lg text-destructive">
                      -{formatCurrency(Math.abs(transaction.price))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deposit History */}
        <div className="bg-card text-card-foreground border-2 border-border rounded-md shadow-brutal p-6 mt-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5" strokeWidth={2.5} />
              Lịch Sử Nạp tiền
            </h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Đang tải...</div>
            ) : depositHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Chưa có lịch sử nạp tiền</div>
            ) : (
              depositHistory.map((transaction) => {
                const { date, time } = formatDate(transaction.createdAt);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted border-2 border-border rounded-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-md border-2 border-border bg-[hsl(142_71%_45%)] text-black">
                        <ArrowDownRight className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Nạp tiền vào tài khoản
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {date} • {time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black tabular-nums text-lg text-[hsl(142_71%_45%)]">
                        +{formatCurrency(transaction.price)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingLHUPage;