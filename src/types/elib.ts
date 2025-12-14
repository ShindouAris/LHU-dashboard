export interface ThongSo {
  MinimumMember: number;
  TimeToExpired: number;
  TimeoutAfterNoCheckIn: number;
  MaxRoomBookingLimit: number;
}

export interface RoomData {
  PhongID: number;
  TenPhong: string;
  SucChuaMin: number;
  SucChuaMax: number;
  TrangThai: boolean;
  GhiChu: string;
}

export interface DANGKY_PhongHocNhomSelect_Response {
  data: RoomData[];
}

export interface ThietBi {
  ThietBiID: number;
  TenThietBi: string;
  SoLuongDKMuon: number;
  SoLuongNhan?: number;
  SoLuongTra?: number;
}

export interface DangKy {
  DangKyID: string;
  DocGiaDangKy: string;
  FirstName: string;
  LastName: string;
  DocGiaNhanPhong: string | null;
  DocGiaTraPhong: string | null;
  GhiChu: string;
  NVTiepNhan_NhanPhong: string | null;
  NVTiepNhan_TraPhong: string | null;
  PhongID: number;
  ThoiGianBD: string; // ISO date string
  ThoiGianKT: string; // ISO date string
  ThoiGianDangKy: string; // ISO date string
  ThoiGianNhanPhong: string | null; // ISO date string or null
  ThoiGianTraPhong: string | null; // ISO date string or null
  TrangThai: number;
  SoLuongTV: number;
  TenPhong: string;
  ThietBi: ThietBi[];
}

export interface DANGKY_LichDangKyTheoNgay_Response {
  data: DangKy[];
}

export interface Reservation {
  DangKyID: string;
  TenPhong: string;
  ThoiGianBD: string; 
  ThoiGianKT: string; 
  ThoiGianDangKy: string; 
  SoLuongTV: number;
  DocGiaDangKy: string;
  TrangThai: 0 | 1 | 2 | 3; 
  ThietBi: ThietBi[]; 
  TimeLeftToExpire?: number; 
  TimeEndToEvent?: number;  
  TimeEndToFinish?: number; 
}

// Response API
export interface LichCaNhanAPIResponse {
  data: [
    Reservation[],
    { SoLuotDaDangKy: number }[]
  ];
}

