export interface StudentInfo {
  HoTen: string;
}

export interface WeekInfo {
  TuanBD: string;
  TuanKT: string;
  TotalRecord: number;
}

export interface ScheduleItem {
  ID: number;
  NhomID: number;
  ThoiGianBD: string;
  ThoiGianKT: string;
  TenPhong: string;
  TenNhom: string;
  TenMonHoc: string;
  GiaoVien: string;
  Buoi: number;
  Thu: number;
  TinhTrang: number;
  Type: number;
  TenCoSo: string;
  GoogleMap: string;
  OnlineLink: string;
  CalenType: number;
  SoTietBuoi: number;
}

export interface ApiResponse {
  data: [
    [StudentInfo],
    [WeekInfo],
    ScheduleItem[]
  ];
}

export interface ApiRequest {
  Ngay: string;
  PageIndex: number;
  PageSize: number;
  StudentID: string;
}

export interface CachedData {
  studentId: string;
  data: ApiResponse;
  timestamp: number;
  expiry: number;
}

export interface ExamInfo {
  StudentID: string; 
  SoBaoDanh: string;
  HoTen: string;
  NgaySinh: string; 
  NoiSinh: string
  TenKT: string;   
  NgayThi: string
  GioThi: string
  CSS: string;         
  PhongThi: string;    
}

export interface ExamResponse {
  data: ExamInfo[]
}

export interface DiemDanhData {
  data: DiemDanhOut[] | [] ;
}

export interface DiemDanhOut {
  TenMonHoc: string;
  TrangThai: number;
  ThoiGianDiemDanh: string | null;
  ThoiGianQuetQRCode: string;
  NgayHoc: string;
  HoTenGV: string;
}
