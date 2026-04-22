import {
    DanhSachHoatDongResponse,
    FileResponseGeneralPublic,
    GeneralPublic_UserResponse,
    HocKyInfo,
    HoatDongNgoaiTruong,
    HoatDongTrongTruong,
    LinkResponseGeneralPublic,
    MinhChungItem,
    ThongKeDiem,
    UpsertHoatDongPayload,
    UserStatistics,
} from "@/types/drl";
import { AuthStorage } from "@/types/user";
import axios from "axios";

const TAPI = import.meta.env.VITE_LHU_TAPI;
const GP_BASE = `${TAPI}/GeneralPublic`;

async function requireToken(): Promise<string> {
    if (!AuthStorage.isLoggedIn()) {
        throw new Error("Bạn cần đăng nhập để sử dụng tính năng này");
    }
    const access_token = await AuthStorage.getTokenWithAuth();
    if (!access_token) {
        throw new Error("Chứng thực của bạn đã hết hạn");
    }
    return access_token;
}

async function postJson<T = any>(url: string, body: any, token: string): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = (data && (data.Message || data.message)) || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data as T;
}

function parseDanhSachMinhChung(raw: any): MinhChungItem[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as MinhChungItem[];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export const drlService = {
    // ===== NEW v2 API =====

    /**
     * Kiểm tra kỳ hoạt động hiện tại. ErrCode === 1 => chưa đến kỳ khai báo.
     */
    checkTaoKy: async (): Promise<HocKyInfo | null> => {
        const token = await requireToken();
        try {
            const res = await postJson<{ data: HocKyInfo[] }>(
                `${GP_BASE}/v2_KiemTraTaoKy`,
                {},
                token
            );
            return res?.data?.[0] ?? null;
        } catch (err) {
            console.error("checkTaoKy error:", err);
            throw err;
        }
    },

    /**
     * Lấy danh sách hoạt động của cá nhân (trong trường + ngoài trường + thống kê).
     */
    getDanhSachHoatDong: async (
        studentID: string | null = null
    ): Promise<DanhSachHoatDongResponse> => {
        const token = await requireToken();
        try {
            const res = await postJson<{ data: any[] }>(
                `${GP_BASE}/v2_CaNhan_SelectHoatDong`,
                { StudentID: studentID },
                token
            );

            const raw = res?.data ?? [];
            const trongTruong: HoatDongTrongTruong[] = raw[0] ?? [];
            const ngoaiTruongRaw: any[] = raw[1] ?? [];
            const thongKeRaw: any = raw[2]?.[0] ?? {};

            const ngoaiTruong: HoatDongNgoaiTruong[] = ngoaiTruongRaw.map((item) => ({
                ...item,
                DanhSachMinhChung: parseDanhSachMinhChung(item?.DanhSachMinhChung),
            }));

            const thongKe: ThongKeDiem = {
                TongDiem: thongKeRaw?.TongDiem ?? 0,
                TrongTruong: thongKeRaw?.TrongTruong ?? 0,
                NgoaiTruong: thongKeRaw?.NgoaiTruong ?? 0,
            };

            // Kỳ đang áp dụng (nếu có)
            let hocKyInfo: HocKyInfo | null = null;
            try {
                hocKyInfo = await drlService.checkTaoKy();
            } catch {
                hocKyInfo = null;
            }

            return { hocKyInfo, trongTruong, ngoaiTruong, thongKe };
        } catch (err) {
            console.error("getDanhSachHoatDong error:", err);
            throw err;
        }
    },

    /**
     * Khai báo hoạt động ngoài trường mới (act=1).
     */
    khaiBaoHoatDong: async (payload: UpsertHoatDongPayload): Promise<boolean> => {
        const token = await requireToken();
        const user = AuthStorage.getUser();
        try {
            await postJson(
                `${GP_BASE}/v2_CaNhan_UpdateHoatDong`,
                {
                    act: 1,
                    TenChuongTrinh: payload.TenChuongTrinh,
                    TenToChuc: payload.TenToChuc,
                    TuNgay: payload.TuNgay,
                    DenNgay: payload.DenNgay,
                    FileMinhChung: payload.FileMinhChung ?? [],
                    jsonUser: user,
                },
                token
            );
            return true;
        } catch (err) {
            throw err;
        }
    },

    /**
     * Cập nhật hoạt động ngoài trường (act=2). Chỉ cho phép khi đang chờ duyệt.
     */
    capNhatHoatDong: async (payload: UpsertHoatDongPayload): Promise<boolean> => {
        if (!payload.HoatDongID) throw new Error("Thiếu HoatDongID");
        const token = await requireToken();
        const user = AuthStorage.getUser();
        try {
            await postJson(
                `${GP_BASE}/v2_CaNhan_UpdateHoatDong`,
                {
                    act: 2,
                    HoatDongID: payload.HoatDongID,
                    TenChuongTrinh: payload.TenChuongTrinh,
                    TenToChuc: payload.TenToChuc,
                    TuNgay: payload.TuNgay,
                    DenNgay: payload.DenNgay,
                    FileMinhChung: payload.FileMinhChung ?? [],
                    jsonUser: user,
                },
                token
            );
            return true;
        } catch (err) {
            throw err;
        }
    },

    /**
     * Xoá hoạt động ngoài trường (act=3).
     */
    xoaHoatDong: async (hoatDongID: number): Promise<boolean> => {
        const token = await requireToken();
        try {
            await postJson(
                `${GP_BASE}/v2_CaNhan_UpdateHoatDong`,
                {
                    act: 3,
                    HoatDongID: hoatDongID,
                },
                token
            );
            return true;
        } catch (err) {
            throw err;
        }
    },

    /**
     * Upload một file minh chứng cho hoạt động ngoài trường và nhận về FileID.
     * Endpoint mới trả về dạng { Files: [{ FileID, FileName }] }.
     */
    uploadMinhChungInline: async (
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<MinhChungItem | null> => {
        const token = await requireToken();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);

        try {
            const response = await axios.post(
                `https://file.lhu.edu.vn/GeneralPublic/upload/MinhChung/2/0`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Uploaddata: Date.now().toString(),
                    },
                    onUploadProgress: (progressEvent) => {
                        if (!onProgress || !progressEvent.total) return;
                        const progress = Math.round(
                            (progressEvent.loaded / progressEvent.total) * 100
                        );
                        onProgress(progress);
                    },
                }
            );
            const data = response.data;
            const f = data?.Files?.[0];
            if (f?.FileID) {
                return { FileID: f.FileID, FileName: f.FileName ?? file.name };
            }
            return null;
        } catch (err) {
            throw err;
        }
    },

    getMinhChungPreviewUrl: (fileID: number): string =>
        `https://file.lhu.edu.vn/GeneralPublic/v2_SelectFileMinhChung/${fileID}`,

    // ===== LEGACY API (kept for backward compatibility with PROOF_DRL.tsx) =====

    getUserStatistics: async (): Promise<UserStatistics | null> => {
        try {
            const access_token = localStorage.getItem("access_token");
            if (!access_token) throw new Error("Bạn chưa đăng nhập");
            const res = await fetch(`${GP_BASE}/ThongKeCaNhan_SelectByID`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${access_token}`,
                },
            });
            const data = await res.json();
            if (!res.ok) {
                if (data?.Message) throw new Error(data.Message);
                return null;
            }
            return data || null;
        } catch (error) {
            console.error("Error fetching user statistics:", error);
            throw error;
        }
    },

    getGUser: async (access_token: string | null): Promise<GeneralPublic_UserResponse | null> => {
        if (access_token === null) return null;
        try {
            const res = await fetch(`${TAPI}/acc/UserInfo/GeneralPublic`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    authorization: `Bearer ${access_token}`,
                },
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            throw err;
        }
    },

    getActivityProofUploadFiles: async (activityID: number): Promise<FileResponseGeneralPublic> => {
        const access_token = await AuthStorage.getTokenWithAuth();
        if (access_token === null) throw new Error("Chứng thực của bạn đã hết hạn");
        const res = await fetch(`${GP_BASE}/MinhChung_Select`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ FileType: 2, HoatDongID: activityID }),
        });
        if (!res.ok) throw new Error("Lấy tập tin minh chứng thất bại");
        return await res.json();
    },

    getActivityProofText: async (activityID: number): Promise<LinkResponseGeneralPublic> => {
        const access_token = await AuthStorage.getTokenWithAuth();
        if (access_token === null) throw new Error("Chứng thực của bạn đã hết hạn");
        const res = await fetch(`${GP_BASE}/MinhChungText_Select`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ HoatDongID: activityID }),
        });
        if (!res.ok) throw new Error("Lấy liên kết minh chứng thất bại");
        return await res.json();
    },

    uploadFile: async (
        file: File,
        activityId: number,
        onProgress?: (progress: number) => void
    ) => {
        const access_token = AuthStorage.getUserToken();
        if (access_token === null) throw new Error("Chứng thực của bạn đã hết hạn");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        const response = await axios.post(
            `https://file.lhu.edu.vn/GeneralPublic/upload/MinhChung/2/${activityId}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Uploaddata: Date.now().toString(),
                },
                onUploadProgress: (progressEvent) => {
                    if (!onProgress || !progressEvent.total) return;
                    const progress = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100
                    );
                    onProgress(progress);
                },
            }
        );
        return response.data;
    },

    deleteFile: async (fileID: number): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken();
        if (access_token === null) throw new Error("Chứng thực của bạn đã hết hạn");
        const res = await fetch(`${GP_BASE}/MinhChung_Delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ FileID: fileID }),
        });
        return res.ok;
    },

    uploadLink: async (
        activityId: number,
        link: string,
        note: string | null
    ): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken();
        if (access_token === null) throw new Error("Chứng thực của bạn đã hết hạn");
        const response = await fetch(`${GP_BASE}/MinhChungText_Update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({
                HoatDongID: activityId,
                Link: link,
                Note: note,
                act: 1,
            }),
        });
        return response.ok;
    },

    updateLink: async (
        activityID: string,
        link: string,
        note: string | null,
        STT: number
    ): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken();
        if (access_token === null) throw new Error("Chứng thực của bạn đã hết hạn");
        const response = await fetch(`${GP_BASE}/MinhChungText_Update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({
                HoatDongID: activityID,
                Link: link,
                Note: note || null,
                STT: STT,
                act: 1,
            }),
        });
        return response.ok;
    },

    deleteLink: async (STT: number): Promise<boolean> => {
        const access_token = AuthStorage.getUserToken();
        if (access_token === null) throw new Error("Chứng thực của bạn đã hết hạn");
        const response = await fetch(`${GP_BASE}/MinhChungText_Update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ STT: STT, act: 0 }),
        });
        return response.ok;
    },
};
