export interface UserResponse {
  UserID: string;
  UserName: string;
  LastName: string;
  FirstName: string;
  DepartmentID: string;
  Email: string;
  EmailReceived: boolean;
  MessagePermission: number;
  FriendPermission: number;
  GroupID: number;
  Avatar: string;
  isAuth: boolean;
  FullName: string;
  GroupName: string;
  Class: string;
  DepartmentName: string;
}

export interface AuthState {
  user: UserResponse | null;
}

// New API response
export interface DiemThanhPhanItem {
    STT: number;
    HinhThuc: string;
    ptDiem: number;
    Diem: number;
}

export interface MonHocAPI {
    HocKy: number;
    KyThiID: number;
    MonHocID: number;
    TenMH: string;
    HeSo: number; // Tín chỉ
    DiemTBMon: number;
    SoLanThi: number;
    Dau: boolean;
    KyThiThayThe: number;
    DangKyThiLai: number;
    UpdateTime: string;
    DiemThanhPhan: string | null;
}

export interface MarkApiResponse {
    StudentID: string;
    HoTen: string;
    LopID: string;
    NgaySinh: string;
    TinhTrangID: number;
    TinhTrang: string;
    StudentImage: string;
    DiemTB: number;
    data: MonHocAPI[];
    Message?: string;
}

export const AUTH_STORAGE_KEY = 'auth_user';

export const AuthStorage = {
  getUser(): UserResponse | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserResponse) : null;
    } catch {
      return null;
    }
  },
  setUser(user: UserResponse | null) {
    try {
      if (user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
  isLoggedIn(): boolean {
    const user = this.getUser();
    const auth_token = localStorage.getItem("access_token");
    if (user && auth_token) return true;
    else return false;
  },
  deleteUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem("access_token")
  },
  getUserToken(): string | null {
    const access_token = localStorage.getItem("access_token")
    if (!access_token) {
      return null;
    }
    return access_token
  },
  async getTokenWithAuth(): Promise<string | null> {
    const userToken = this.getUserToken();
    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/userinfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: userToken })
      })
      if (!response.ok) {
        throw new Error("Phiên đã hết hạn, vui lòng đăng nhập lại")
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes("Phiên đã hết hạn")) {
        // this.deleteUser()
        return null
      }
    }
    return userToken
  }
};


