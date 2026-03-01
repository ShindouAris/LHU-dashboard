import { FileResponseGeneralPublic, GeneralPublic_UserResponse, LinkResponseGeneralPublic, UserStatistics } from "@/types/drl";
import { AuthStorage } from "@/types/user";
import axios from "axios";

const TAPI = import.meta.env.VITE_LHU_TAPI

export const drlService = {
    getUserStatistics: async (): Promise<UserStatistics | null> => {
        try {
            const access_token = localStorage.getItem("access_token");
            if (!access_token) {
                throw new Error("Bạn chưa đăng nhập");
            }
            const res = await fetch(`${TAPI}/GeneralPublic/ThongKeCaNhan_SelectByID`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${localStorage.getItem("access_token")}`
                }
            })

            const data = await res.json();

            if (!res.ok) {
                if (data?.Message) {
                    // Handle lỗi từ api trường
                    throw new Error(data.Message);
                }
                return null;
            }
            return data || null;
            
        } catch (error) {
            console.error("Error fetching user statistics:", error);
            throw error; // Thăng gọi tự handle đi nhá ;)
        }
    },
    createNewActiviy: async (from_date: string, to_date: string, activity_name: string, to_chuc_ben_ngoai: string): Promise<boolean> => {
        if (!AuthStorage.isLoggedIn()) {
            throw new Error("Bạn cần đăng nhập để sử dụng tính năng này")
        }
        // const user = AuthStorage.getUser();
        const access_token = await AuthStorage.getTokenWithAuth()
        const user = await drlService.getGUser(access_token)
        if (!user || access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        const payload = {
            ClassID: user.ClassID,
            DenNgay: to_date,
            DoiTuongID: user.GroupID,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Phone: user.Phone,
            TenChuongTrinh: activity_name,
            ToChucBenNgoai: to_chuc_ben_ngoai,
            TuNgay: from_date
        }
        try {
            const response = await fetch(`${TAPI}/GeneralPublic/HoatDongBenNgoai_Upsert`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify(payload)
            })
            if (!response.ok) return false
            return true
        } catch (erro) {
            throw erro
        }
    },
    modifyActivity: async (activityID: number, from_date: string = "", to_date: string = "", activity_name: string = "", to_chuc_ben_ngoai: string = "", action: 1 | 0 = 1): Promise<boolean> => {
        if (!AuthStorage.isLoggedIn()) {
            throw new Error("Bạn cần đăng nhập để sử dụng tính năng này")
        }
        // const user = AuthStorage.getUser();
        const access_token = await AuthStorage.getTokenWithAuth()
        const user = await drlService.getGUser(access_token)
        if (!user || access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        let payload
        if (action === 1) {
            // Sửa
            payload = {
                ClassID: user.ClassID,
                DenNgay: to_date,
                DoiTuongID: user.GroupID,
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                Phone: user.Phone,
                TenChuongTrinh: activity_name,
                ToChucBenNgoai: to_chuc_ben_ngoai,
                TuNgay: from_date,
                HoatDongBenNgoaiID: activityID,
                IsExternal: 1,
                act: 1
            }
        } else if (action === 0) {
            // Xóa
            payload = {
                HoatDongBenNgoaiID: activityID,
                IsExternal: 1,
                act: 0
            }
        } else {
            throw new Error("Hành động không hợp lệ")
        }
        try {
            const response = await fetch(`${TAPI}/GeneralPublic/HoatDongBenNgoai_Upsert`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify(payload)
            })
            if (!response.ok) return false
            return true
        } catch (erro) {
            throw erro
        }
    },
    getGUser: async (access_token: string | null): Promise<GeneralPublic_UserResponse | null> => {
        if (access_token === null) return null
        try {
            const res = await fetch(`${TAPI}/acc/UserInfo/GeneralPublic`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "authorization": `Bearer ${access_token}`
                }
            })
            if (!res.ok) {
                return null;
            }
            return await res.json()
        } catch (err) {
            throw err
        }
    },
    getActivityProofUploadFiles: async (activityID: number): Promise<FileResponseGeneralPublic> => {
        const access_token = await AuthStorage.getTokenWithAuth()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        try {
            const res = await fetch(`${TAPI}/GeneralPublic/MinhChung_Select`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    FileType: 2,
                    HoatDongID: activityID
                })
            })
            if (!res.ok) {
                throw new Error("Lấy tập tin minh chứng thất bại")
            }
            return await res.json()
        } catch (error) {
            throw error
        }

    },
    getActivityProofText: async (activityID: number): Promise<LinkResponseGeneralPublic> => {
        const access_token = await AuthStorage.getTokenWithAuth()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        try {
            const res = await fetch(`${TAPI}/GeneralPublic/MinhChungText_Select`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    HoatDongID: activityID
                })
            })
            if (!res.ok) {
                throw new Error("Lấy liên kết minh chứng thất bại")
            }
            return await res.json()

        } catch (error) {
            throw error
        }
    },
    deleteFileProof: async (fileID: number): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        try {
            const res = await fetch(`${TAPI}/GeneralPublic/MinhChung_Delete`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    FileID: fileID
                })
            })
            if (!res.ok) {
                return false
            }
            return true
        } catch (error) {
            throw error
        }
    },
    uploadFile: async (file: File, activityId: number, onProgress?: (progress: number) => void) => {
        const access_token = AuthStorage.getUserToken()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }

        const formData = new FormData();
        const uploadMS = new Date().getTime()

        formData.append("file", file);
        formData.append('name', file.name);
        try {
            const response = await axios.post(
                `https://file.lhu.edu.vn/GeneralPublic/upload/MinhChung/2/${activityId}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Uploaddata': uploadMS.toString()
                    },
                    onUploadProgress: (progressEvent) => {
                        if (!onProgress || !progressEvent.total) return;
                        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        onProgress(progress);
                    }
                }
            )
            return response.data
        } catch (error) {
            throw error
        }
    },
    deleteFile: async (fileID: number): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        try {
            const res = await fetch(`${TAPI}/GeneralPublic/MinhChung_Delete`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    FileID: fileID
                })
            })
            if (!res.ok) {
                return false
            }
            return true
        } catch (error) {
            throw error
        }
    },
    uploadLink: async (activityId: number, link: string, note: string | null): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        try {
            const response = await fetch(`${TAPI}/GeneralPublic/MinhChungText_Update`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    HoatDongID: activityId,
                    Link: link,
                    Note: note,
                    act: 1
                })
            })

            if (!response.ok) return false

            return true

        } catch (error) {
            throw error
        }
    },
    updateLink: async (activityID: string, link: string, note: string | null, STT: number): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        try {
            const response = await fetch(`${TAPI}/GeneralPublic/MinhChungText_Update`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    HoatDongID: activityID,
                    Link: link,
                    Note: note || null,
                    STT: STT,
                    act: 1
                })
            })

            if (!response.ok) return false

            return true

        } catch (error) {
            throw error
        }
    },
    deleteLink: async (STT: number): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken()
        if (access_token === null) {
            throw new Error("Chứng thực của bạn đã hết hạn")
        }
        try {
            const response = await fetch(`${TAPI}/GeneralPublic/MinhChungText_Update`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    STT: STT,
                    act: 0
                })
            })

            if (!response.ok) return false

            return true

        } catch (error) {
            throw error
        }
    }
}