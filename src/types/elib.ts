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

// Data for reg
enum BusyStatus {
  Free = 0,
  Busy = 1,
}

interface PhongHoc {
  PhongID: number;
  TenPhong: string;
  SucChuaMin: number;
  SucChuaMax: number;
  TrangThai: boolean;
  GhiChu: string;
  isBusy: BusyStatus;
}

export interface DANGKY_PhongHocNhomForRegSelectResponse {
  data: PhongHoc[];
}

export interface ToolForReg {
  ThietBiID: number;
  TenThietBi: string;
  GhiChu: string;
  SoLuong: number;
  SoLuongDaMuon: number;
}

export interface DANGKY_ThietBiForRegSelectResponse {
  data: ToolForReg[];
}


export interface DangKyPayload {
  DangKyID: string
  PhongID: number
  ThoiGianBD: string
  ThoiGianKT: string
  jsonThietBi: DangKiThietBi[] // rỗng cũng ok
  GhiChu: string
}


export interface DangKiThietBi {
  ThietBiID: number;
  TenThietBi: string;
  GhiChu: string;
  SoLuong: number;
  SoLuongDKMuon: number; 
  SoLuongDaMuon: number;
}

// Tuỳ chỉnh phòng

export interface UserSearch {
  ObjectID: string;
  ObjectName: string;
  ObjectNickName: string;
  Description: string;
  avatar: string; // Phải load cái này qua blob vì API buộc auth qua cookie mà ta ở trên different domain
}

export interface ShareSearchObject {
  data: UserSearch[];
}

export interface UserObjFromDK_DocGia_SelectByDangKyID {
  DangKyID: string;
  StudentID: string;
  FirstName: string;
  LastName: string;
  Email: string | null;
  ThoiGianXacNhan: string | null;
  ImageURL: string;
  DepartmentName: string;
}

export interface DANGKY_DocGiaSelectByDangKyID {
  data: UserObjFromDK_DocGia_SelectByDangKyID[];
}
