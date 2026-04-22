// ===== Legacy types (kept for PROOF_DRL compatibility) =====
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
        [{ TongHoatDong: number }],
        [{ TotalPoints: number | null }],
        Activity[]
    ];
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
    LastLogin: string;
    FunctionRight: any[];
}

// ===== New DRL types (v2 API) =====

// Trạng thái kỳ hoạt động
// ErrCode === 1 => chưa đến kỳ khai báo
export interface HocKyInfo {
    ErrCode?: number;
    HocKy?: number;
    Nam?: number;
    KyID?: number;
    TuNgay?: string;
    DenNgay?: string;
    TrangThai?: number;
    [key: string]: any;
}

// Một bản ghi minh chứng đính kèm hoạt động
export interface MinhChungItem {
    FileID: number;
    FileName: string;
}

// Hoạt động trong trường
export interface HoatDongTrongTruong {
    HoatDongID: number;
    TenChuongTrinh: string;
    TenToChuc?: string;
    ViTri?: string;
    TuNgay: string;
    DenNgay: string;
    Diem: number;
    TinhTrang: number;
    TenTinhTrang?: string;
    HocKy?: number;
    Nam?: number;
    CheckinAt?: string;
    [key: string]: any;
}

// Hoạt động SV tự khai báo (ngoài trường)
// TinhTrang: 2 = chờ duyệt, 3/5 = đã duyệt, 4 = từ chối
export interface HoatDongNgoaiTruong {
    HoatDongID: number;
    TenChuongTrinh: string;
    TenToChuc: string;
    TuNgay: string;
    DenNgay: string;
    Diem: number;
    TinhTrang: number;
    TenTinhTrang?: string;
    DanhSachMinhChung: MinhChungItem[]; // đã parse JSON
    HocKy?: number;
    Nam?: number;
    [key: string]: any;
}

export interface ThongKeDiem {
    TongDiem: number;
    TrongTruong: number;
    NgoaiTruong: number;
}

export interface DanhSachHoatDongResponse {
    hocKyInfo: HocKyInfo | null;
    trongTruong: HoatDongTrongTruong[];
    ngoaiTruong: HoatDongNgoaiTruong[];
    thongKe: ThongKeDiem;
}

// Payload submit
export interface UpsertHoatDongPayload {
    HoatDongID?: number;
    TenChuongTrinh: string;
    TenToChuc: string;
    TuNgay: string;
    DenNgay: string;
    FileMinhChung: number[]; // FileID[]
}
