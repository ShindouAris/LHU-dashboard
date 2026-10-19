<p align="center">
  <a href="https://lhu-dashboard.chisadin.id.vn/">
    <img src="public/favicon.svg" alt="LHU Dashboard Logo" width="80" height="80" />
  </a>
</p>
<h1 align="center">LHU Dashboard
</h1>

### Lịch học hôm nay. Tiện ích cho cả học kỳ.

[![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Cài_trên_màn_hình_chính-5a0fc8)](#dùng-theo-cách-của-bạn)

LHU Dashboard giúp sinh viên Lạc Hồng tra cứu lịch học, theo dõi lịch thi và sử dụng các tiện ích thường ngày ngay trên trình duyệt. Nhập mã sinh viên để xem lịch; đăng nhập khi cần truy cập dữ liệu cá nhân.

**[Mở LHU Dashboard](https://lhu-dashboard.chisadin.id.vn/)** · [Khám phá tính năng](#có-gì-trong-lhu-dashboard) · [Chạy local](#chạy-local)

---

## ✨ Có gì trong LHU Dashboard

### Biết lớp tiếp theo, không bỏ sót lịch thi

Tra cứu lịch học, theo dõi lịch thi riêng biệt và xuất lịch sang ứng dụng khác nhanh chóng bằng mã sinh viên.

### Các việc thường ngày, không chỉ lịch học

Từ xem điểm đến đặt phòng học nhóm, các tiện ích được chia thành từng trang để bạn mở đúng thứ đang cần.

| Tiện ích | Bạn có thể làm gì? |
| --- | --- |
| Lịch học & lịch thi | Tra cứu theo mã sinh viên, xem lớp sắp tới và xuất lịch học. |
| Thời khóa biểu | Xem lịch học và lịch thi trên giao diện lịch. |
| Kết quả học tập | Xem điểm thi và chọn cách hiển thị hệ điểm. |
| Điểm danh QR | Quét mã điểm danh nhanh chóng bằng camera. |
| Điểm rèn luyện | Theo dõi thông tin rèn luyện và minh chứng. |
| Thư viện | Xem lịch phòng học nhóm, đăng ký phòng và quản lý thành viên. |
| Bãi xe | Xem số dư, biển số xe và lịch sử giao dịch. |
| Thời tiết | Xem thời tiết hiện tại và dự báo để chuẩn bị trước khi đến trường. |
| ChisaAI | Hỏi đáp, tra cứu thông tin qua các công cụ tích hợp và tiếp tục các cuộc trò chuyện đã lưu. |

### ChisaAI — hỏi ngay trong dashboard

Hỗ trợ hỏi đáp bằng tiếng Việt, tra cứu thông tin học tập và tiếp tục các đoạn chat đã lưu bất cứ lúc nào.

## 📱 Dùng theo cách của bạn

- Giao diện thích ứng với điện thoại, tablet và máy tính cùng chế độ sáng/tối.
- Hỗ trợ cài đặt lên màn hình chính dưới dạng PWA trên trình duyệt tương thích.
- Tùy chỉnh các mục hiển thị trên thanh điều hướng theo nhu cầu.

> **Lưu ý:** Dữ liệu trên ứng dụng và phản hồi từ ChisaAI chỉ mang tính tham khảo, vui lòng luôn đối chiếu với thông báo chính thức của nhà trường.

## 🚀 Bắt đầu sử dụng

1. Mở ứng dụng và nhập mã sinh viên gồm 9 chữ số để tra cứu lịch học.
2. Chuyển sang thời khóa biểu để xem lịch theo ngày, tuần hoặc tháng.
3. Đăng nhập để dùng các tiện ích cá nhân và ChisaAI.

---

## 🛠️ Dành cho người phát triển

Frontend sử dụng React, TypeScript, Vite, Tailwind CSS và các component Radix/shadcn.

### Yêu cầu

- Node.js 20+
- npm

### Chạy local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

### Kiểm tra

```powershell
npm run lint
npm run build
npm run preview
```

### Biến môi trường

- `VITE_API_URL`: Backend của dashboard.
- `VITE_SCHOOL_ENDPOINT`: Endpoint lịch sinh viên.
- `VITE_LHU_TAPI`: Base URL API LHU.

### Deploy

Dự án đã được cấu hình sẵn để triển khai trên Vercel qua file `vercel.json`.

## 💬 Góp ý và hỗ trợ

Nếu gặp lỗi hoặc có ý tưởng cải thiện, bạn có thể [tạo issue](https://github.com/ShindouAris/Calendar-LHU/issues) trên GitHub (vui lòng không đính kèm thông tin cá nhân).

[Mã nguồn](https://github.com/ShindouAris/Calendar-LHU) · [Ủng hộ phát triển](https://buymeacoffee.com/chisadinchan)

---

**Lớp tiếp theo ở đâu?** [Mở dashboard để tra cứu lịch học](https://lhu-dashboard.chisadin.id.vn/).
