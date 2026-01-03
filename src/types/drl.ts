export interface Activity {
    HoatDongID: number;
    TenChuongTrinh: string;
    Diem: number;
    TinhTrang: number;
    IsExternal: number;
    ToChucBenNgoai: string;
    TuNgay: string;
    DenNgay: string;
    ViTri: string;
    HoatDongBenNgoaiID: number;
}

export interface UserStatistics {
  data: [
    [{TongHoatDong: number}], 
  [{TotalPoints: number | null}], 
  Activity[]
];
}

export interface GeneralPublic_UserResponse {
  UserID: string;
  UserName: string;
  LastName: string;
  FirstName: string;
  Phone: string;
  Email: string;
  GroupID: number;
  DepartmentID: string;
  ClassID: string;
  SystemRight: any | null;
  LastLogin: string; // ISO datetime string
  FunctionRight: any[];
}

export interface FileItem {
  FileID: number;
  BinaryContent: string;
  FileName: string;
  ContentType: string;
  HoatDongID: number;
}

export interface FileResponseGeneralPublic {
  data: FileItem[];
}

export interface LinkItem {
  STT: number;
  Link: string;
  Note: string;
  TenLoaiHinh: string;
}

export interface LinkResponseGeneralPublic {
  data: LinkItem[];
}