# LHU Dashboard

### Lịch học hôm nay. Tiện ích cho cả học kỳ.

[![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Cài_trên_màn_hình_chính-5a0fc8)](#dùng-theo-cách-của-bạn)

LHU Dashboard giúp sinh viên Lạc Hồng tra cứu lịch học, theo dõi lịch thi và sử dụng các tiện ích thường ngày ngay trên trình duyệt. Nhập mã sinh viên để xem lịch; đăng nhập khi cần truy cập dữ liệu cá nhân.

**[Mở LHU Dashboard](https://lhu-dashboard.chisadin.site/)** · [Khám phá tính năng](#có-gì-trong-lhu-dashboard) · [Chạy local](#chạy-local)

> Bắt đầu bằng mã sinh viên. Đăng nhập khi cần điểm số, thư viện và các tiện ích cá nhân.

---

## Có gì trong LHU Dashboard?

### Biết lớp tiếp theo, không bỏ sót lịch thi

Tra cứu lịch bằng mã sinh viên, xem lớp sắp tới hoặc chuyển sang thời khóa biểu. Lịch thi được hiển thị riêng để bạn vẫn theo dõi được khi không còn lịch học. Cần đưa lịch sang ứng dụng khác? Xuất lịch học ngay từ dashboard.

### Các việc thường ngày, không chỉ lịch học

Từ xem điểm đến đặt phòng học nhóm, các tiện ích được chia thành từng trang để bạn mở đúng thứ đang cần.

| Tiện ích | Bạn có thể làm gì? |
| --- | --- |
| Lịch học & lịch thi | Tra cứu theo mã sinh viên, xem lớp sắp tới và xuất lịch học. |
| Thời khóa biểu | Xem lịch học và lịch thi trên giao diện lịch. |
| Kết quả học tập | Xem điểm thi và chọn cách hiển thị hệ điểm. |
| Điểm danh QR | Quét mã bằng camera; hỗ trợ crop QR và tự zoom trên camera tương thích. |
| Điểm rèn luyện | Theo dõi thông tin rèn luyện và minh chứng. |
| Thư viện | Xem lịch phòng học nhóm, đăng ký phòng và quản lý thành viên. |
| Bãi xe | Xem số dư, biển số xe và lịch sử giao dịch. |
| Thời tiết | Xem thời tiết hiện tại và dự báo để chuẩn bị trước khi đến trường. |
| ChisaAI | Hỏi đáp, tra cứu thông tin qua các công cụ tích hợp và tiếp tục các cuộc trò chuyện đã lưu. |

### ChisaAI — hỏi ngay trong dashboard

Đặt câu hỏi bằng tiếng Việt, xem câu trả lời có định dạng code và công thức, hoặc mở lịch sử từ drawer để tiếp tục đoạn chat cũ. ChisaAI có các công cụ tra cứu lịch, thời tiết, điểm danh và thư viện; tính khả dụng phụ thuộc backend và quyền tài khoản.

**Không thay thế thông báo chính thức của trường.** Hãy kiểm chứng câu trả lời AI trước khi dùng cho việc học hoặc các quyết định quan trọng.

## Dùng theo cách của bạn

- Giao diện thích ứng với điện thoại, tablet và máy tính; có chế độ sáng và tối.
- Hỗ trợ cài lên màn hình chính dưới dạng PWA trên trình duyệt tương thích.
- Cache lịch học trong 30 phút; có thể dùng dữ liệu đã lưu khi không kết nối được máy chủ.
- Tùy chỉnh các mục hiển thị trên thanh điều hướng.

> Các chức năng cá nhân cần đăng nhập và phụ thuộc vào API trường, backend cùng quyền truy cập tài khoản. Cache không bảo đảm dữ liệu luôn mới; hãy đối chiếu thông báo chính thức khi có thay đổi lịch. Câu trả lời của AI cũng cần được kiểm chứng.

## Bắt đầu sử dụng

1. Mở ứng dụng và nhập mã sinh viên gồm 9 chữ số để tra cứu lịch học.
2. Chuyển sang thời khóa biểu để xem lịch theo ngày, tuần hoặc tháng.
3. Đăng nhập để dùng các tiện ích cá nhân và ChisaAI.

---

## Dành cho người phát triển

Frontend sử dụng React, TypeScript, Vite, Tailwind CSS và các component Radix/shadcn. Repository này chứa giao diện; các chức năng kết nối trường và AI cần backend được cấu hình riêng.

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

- `VITE_API_URL`: backend của dashboard.
- `VITE_SCHOOL_ENDPOINT`: endpoint lịch sinh viên.
- `VITE_LHU_TAPI`: base URL API LHU.

Biến `VITE_*` được đóng gói vào client. Không đặt secret trong các biến này.

### Deploy

Ứng dụng dùng `BrowserRouter`. Hosting phải rewrite các route về `/index.html`. Vercel đã được cấu hình trong `vercel.json`.

## Góp ý và hỗ trợ

Gặp lỗi hoặc có ý tưởng cải thiện? [Tạo issue](https://github.com/ShindouAris/Calendar-LHU/issues) kèm trang bị ảnh hưởng, bước tái hiện và phiên bản trình duyệt. Không đính kèm mật khẩu, session token hoặc dữ liệu cá nhân.

[Mã nguồn](https://github.com/ShindouAris/Calendar-LHU) · [Ủng hộ phát triển](https://buymeacoffee.com/chisadinchan)

---

**Lớp tiếp theo ở đâu?** [Mở dashboard để tra cứu lịch học](https://lhu-dashboard.chisadin.site/).
