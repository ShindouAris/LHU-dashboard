export interface SurveyListItem {
    KhaoSatID: string;
    TenKhaoSat: string;
    MoTa: string;
    templateID: string;
}


export interface PayloadAnswer {
    QID: number;
    GID: number;
    Type: string;
    Text: string;
    Value: any;
    ValueText: string;
}

export interface SurveyAnswerPayload {
    data: SurveyAnswerData | null;
}

export interface SurveyAnswerData {
    KhaoSatID: string; // Dùng ID chuẩn từ response đề bài
    TemplateID: string;
    CauTraLoi: PayloadAnswer[];
    DeviceInfo: string | null;
}