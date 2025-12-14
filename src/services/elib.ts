import { DANGKY_LichDangKyTheoNgay_Response, DANGKY_PhongHocNhomSelect_Response, LichCaNhanAPIResponse, ThongSo } from "@/types/elib"
import { AuthStorage } from "@/types/user"

const TAPI = import.meta.env.VITE_LHU_TAPI

export const ELIB_SERVICE = {
    get_thong_so: async (): Promise<ThongSo | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null
        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_ThongSoSelect`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                }
            })
            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                else {
                    throw new Error(`Lỗi khi lấy Thông Số: ${res.status} ${res.statusText}`)
                }
            }
            const data: ThongSo = await res.json()

            return data
        
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching Thong So:", e.message);
                return null;
            }
            return null;
        }

    },
    get_room_configuation: async (): Promise<DANGKY_PhongHocNhomSelect_Response | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null
        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_PhongHocNhomSelect`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            })
            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi lấy Cấu Hình Phòng Học Nhóm: ${res.status} ${res.statusText}`)
            }

            const data: DANGKY_PhongHocNhomSelect_Response = await res.json()

            return data

        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching Room Configuration:", e.message);
                return null;
            }
            return null;
        }
    },
    get_user_booking_list: async (): Promise<LichCaNhanAPIResponse | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_LichDangKyCaNhan`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                }
            })
            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi lấy Lịch Cá Nhân: ${res.status} ${res.statusText}`)
            }

            const data: LichCaNhanAPIResponse = await res.json()
            return data

        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching User Booking List:", e.message);
                return null;
            }
            return null;
        }
    },
    get_reservation_by_day: async (date: string): Promise<DANGKY_LichDangKyTheoNgay_Response | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null
        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_LichDangKyTheoNgay`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    TuNgay: date, // Same date, why they need two fields?
                    DenNgay: date
                })
            })
            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi lấy Lịch Cá Nhân: ${res.status} ${res.statusText}`)
            }

            const data: DANGKY_LichDangKyTheoNgay_Response = await res.json()
            return data

        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching Reservation By Day:", e.message);
                return null;
            }
            return null;
        }
    }
}
