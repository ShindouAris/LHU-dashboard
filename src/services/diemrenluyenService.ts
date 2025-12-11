import { UserStatistics } from "@/types/drl";


const SCHOOL_ENDPOINT = import.meta.env.VITE_LHU_TAPI

export const drlService = {
    getUserStatistics: async (): Promise<UserStatistics | null> => {
        try {
            const access_token = localStorage.getItem("access_token");
            if (!access_token) {
                throw new Error("Bạn chưa đăng nhập");
            }
            const res = await fetch(`${SCHOOL_ENDPOINT}/GeneralPublic/ThongKeCaNhan_SelectByID`, {
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
    }
}