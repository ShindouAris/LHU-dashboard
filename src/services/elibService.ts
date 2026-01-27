import { DANGKY_LichDangKyTheoNgay_Response, DANGKY_PhongHocNhomForRegSelectResponse, 
    DANGKY_PhongHocNhomSelect_Response, DANGKY_ThietBiForRegSelectResponse, 
    LichCaNhanAPIResponse, ThongSo, DangKyPayload, ShareSearchObject, 
    DANGKY_DocGiaSelectByDangKyID, DangKy } from "@/types/elib"
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
    },
    // REG area
    get_phong_hoc_for_reg: async (startTime: string, endTime: string): Promise<DANGKY_PhongHocNhomForRegSelectResponse | null> => {
        if (!startTime || !endTime) return null
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_PhongHocNhomForRegSelect`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ThoiGianBD: startTime,
                    ThoiGianKT: endTime
                })
            })
            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi lấy Phòng Học Cho Đăng Ký: ${res.status} ${res.statusText}`)
            }
            const data: DANGKY_PhongHocNhomForRegSelectResponse = await res.json()
            return data
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching Phong Hoc For Reg:", e.message);
                return null;
            }
            return null;
        }
    },
    get_thiet_bi_for_reg: async (ThoiGianBD: string, ThoiGianKT: string): Promise<DANGKY_ThietBiForRegSelectResponse | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null
        if (!ThoiGianBD || !ThoiGianKT) return null
        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_ThietBiForRegSelect`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ThoiGianBD: ThoiGianBD,
                    ThoiGianKT: ThoiGianKT
                })
            })
            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi lấy Thiết Bị Cho Đăng Ký: ${res.status} ${res.statusText}`)
            }
            const data: DANGKY_ThietBiForRegSelectResponse = await res.json()
            return data

        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching Thiet Bi For Reg:", e.message);
                return null;
            } 
            return null;
        }
    },
    dang_ky_phong_hoc_nhom: async (
        payload: DangKyPayload
    ) => {

        const access_token = AuthStorage.getUserToken()
        if (!access_token) return { success: false, message: "No access token" }

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_PhongHocNhom`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi đăng ký Phòng Học Nhóm: ${res.status} ${res.statusText}`)
            }

            return { success: true, message: "Đăng ký phòng học nhóm thành công", madatcho: (await res.json()).data[0].DangKyID }
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error in dang_ky_phong_hoc_nhom:", e.message);
                return { success: false, message: e.message }
            }
            return { success: false, message: "Unknown error" }
        }
    },

    // Search user (External - ME API)
    search_user: async (findString: string): Promise<ShareSearchObject | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null
        if (!findString.trim()) return null

        try {
            const res = await fetch(`${TAPI}/me/ShareSearchObject`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ findString })
            })

            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi tìm kiếm user: ${res.status} ${res.statusText}`)
            }

            const data: ShareSearchObject = await res.json()
            return data
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error searching user:", e.message);
                return null;
            }
            return null;
        }
    },

    // Add member to room
    add_member_to_room: async (DangKyID: string, StudentID: string) => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return { success: false, message: "No access token" }

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_DocGiaAddToRoom`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ DangKyID, StudentID })
            })

            if (!res.ok) {
                const errorData = await res.json();
                if (errorData?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(errorData?.Message || `Lỗi khi thêm thành viên: ${res.status}`)
            }

            return { success: true, message: "Thêm thành viên thành công" }
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error adding member:", e.message);
                return { success: false, message: e.message }
            }
            return { success: false, message: "Unknown error" }
        }
    },

    // Get members by DangKyID
    get_members_by_dangky_id: async (DangKyID: string): Promise<DANGKY_DocGiaSelectByDangKyID | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_DocGiaSelectByDangKyID`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ DangKyID })
            })

            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi lấy danh sách thành viên: ${res.status} ${res.statusText}`)
            }

            const data: DANGKY_DocGiaSelectByDangKyID = await res.json()
            return data
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching members:", e.message);
                return null;
            }
            return null;
        }
    },

    // Remove member from room
    remove_member_from_room: async (DangKyID: string, StudentID: string) => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return { success: false, message: "No access token" }

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_DocGiaDelete`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ DangKyID, StudentID })
            })

            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi xóa thành viên: ${res.status} ${res.statusText}`)
            }

            return { success: true, message: "Xóa thành viên thành công" }
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error removing member:", e.message);
                return { success: false, message: e.message }
            }
            return { success: false, message: "Unknown error" }
        }
    },

    // Get booking by ID (for edit mode)
    get_booking_by_id: async (DangKyID: string): Promise<DangKy | null> => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return null

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_LichDangKyByID`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ DangKyID })
            })

            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi lấy chi tiết đăng ký: ${res.status} ${res.statusText}`)
            }

            const data = await res.json()
            return data.data?.[0] || null
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error fetching booking details:", e.message);
                return null;
            }
            return null;
        }
    },

    // Cancel booking
    cancel_booking: async (DangKyID: string) => {
        const access_token = AuthStorage.getUserToken()
        if (!access_token) return { success: false, message: "No access token" }

        try {
            const res = await fetch(`${TAPI}/elib/DANGKY_HuyDangKy`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ DangKyID })
            })

            if (!res.ok) {
                if ((await res.json())?.Message === "Chứng thực của bạn không hợp lệ") {
                    AuthStorage.deleteUser()
                    throw new Error("Token hết hạn, vui lòng đăng nhập lại")
                }
                throw new Error(`Lỗi khi hủy đăng ký: ${res.status} ${res.statusText}`)
            }

            return { success: true, message: "Hủy đăng ký thành công" }
        } catch (e) {
            if (e instanceof Error) {
                console.error("Error canceling booking:", e.message);
                return { success: false, message: e.message }
            }
            return { success: false, message: "Unknown error" }
        }
    }
}
