import { DepositHistory, PaymentHistory, PlateData } from '@/types/parking';
import {AuthStorage, MarkApiResponse, UserResponse} from '@/types/user';

const API_URL = import.meta.env.VITE_API_URL;
const SCHOOL_TAPI = import.meta.env.VITE_LHU_TAPI;

export interface LoginRequestBody {
  DeviceInfo: string;
  UserID: string;
  Password: string;
  cf_verify_token: string;
}

const auth = AuthStorage

export const authService = {
  async login(body: LoginRequestBody, turnstile_instance: any): Promise<void> {
    if (body.cf_verify_token === "") {
      throw new Error("Vui lòng hoàn thành bài kiểm tra bảo mật")
    }
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      let msg = await response.text() || "Đăng nhập thất bại";
      if ("reset" in turnstile_instance) {
        turnstile_instance.reset()
      }
      throw new Error(msg);
    }
    const data = await response.json();
    localStorage.setItem("access_token", data.accessToken)
  },

  async getUserInfo(): Promise<UserResponse> {
    const access_token = auth.getUserToken();
    const response = await fetch(`${API_URL}/userinfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: access_token
      })
    });
    if (!response.ok) {
      if (response.status === 401 ) {
        throw new Error("Phiên đã hết hạn, vui lòng đăng nhập lại")
      }
      let msg = await response.text() || "Không lấy được thông tin người dùng";
      throw new Error(msg);
    }
    return (await response.json()) as UserResponse;
  },
  async logOut(): Promise<string | null> {
    const access_token = auth.getUserToken();
    const response = await fetch(
      `${API_URL}/logout`,
      {
        method: "POST", 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "accessToken": access_token
        })
      }
    )
    if (!response.ok) {
      localStorage.removeItem("access_token")
      throw new Error("Đăng xuất thất bại, hãy đăng xuất thủ công qua app ME")
    }
    AuthStorage.deleteUser()
    localStorage.removeItem("access_token")
    return "Đăng xuất thành công" 
  },
  async getMark(): Promise<MarkApiResponse | undefined> {
    const access_token = auth.getUserToken();
    try {
      const response = await fetch(`${SCHOOL_TAPI}/mark/MarkViewer_GetBangDiem`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${access_token}`
        },
      })
      const data: MarkApiResponse = await response.json()
      if (!response.ok) {
        if (response.status === 401 && response.statusText === "Token not found") {
          throw new Error("Phiên đã hết hạn, vui lòng đăng nhập lại")
        }
        if (response.status === 400 && data.Message === "Bạn chưa hoàn thành hết các đánh giá giáo viên và môn học") {
          throw new Error("Bạn chưa hoàn thành hết các đánh giá giáo viên và môn học")
        }
        if (response.status === 400 && data.Message === "Bạn không có quyền xem điểm") {
          throw new Error("Bạn không có quyền xem điểm")
        }
        throw new Error("Đã xảy ra lỗi, hãy xem trên app ME nhé bạn")
      }
      if (!data.data || Object.keys(data.data).length === 0) {
        throw new Error("Không tìm thấy điểm của mã sinh viên này")
      }
      return data
    } catch (error) {
      throw error;
    }
  }
};

export const parkingAPI = {

  async getCredit(): Promise<number> {
    const access_token = auth.getUserToken();
    const response = await fetch(`${SCHOOL_TAPI}/checkIn/Parking_GetCredit`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      }
    })
    if (!response.ok) {
      return 0;
    }
    const data = await response.json()
    return data.credit ?? 0;
  },


  async getPlates(): Promise<PlateData[]> {
    const access_token = auth.getUserToken();
    const response = await fetch(`${SCHOOL_TAPI}/checkIn/Parking_GetMyPlates`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      }
    })
    if (!response.ok) {
      return [];
    }
    const data = await response.json()
    return data.data ?? [];
  },
  async getLogPay(): Promise<PaymentHistory[] | null> {
    const access_token = auth.getUserToken();
    const response = await fetch(`${SCHOOL_TAPI}/checkIn/Parking_GetLogPay`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      }
    })
    if (!response.ok) {
      return null;
    }
    const data = await response.json()
    return data.data ?? [];
  },
  async getDepositHistory(): Promise<DepositHistory[] | null> {
    const access_token = auth.getUserToken();
    const response = await fetch(`${SCHOOL_TAPI}/checkIn/Parking_GetDeposit`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      }
    })
    if (!response.ok) {
      return null;
    }
    const data = await response.json()
    return data.data ?? [];
  }
}