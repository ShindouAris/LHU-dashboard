export interface Activity {
    HoatDongID: number;
    TenChuongTrinh: string;
    Diem: number;
    TinhTrang: number;
    IsExternal: number;
    ToChucBenNgoai: string | null;
    TuNgay: string;
    DenNgay: string;
    ViTri: string;
}

export interface UserStatistics {
  data: [
    [{TongHoatDong: number}], 
  [{TotalPoints: number | null}], 
  Activity[]
];
}
