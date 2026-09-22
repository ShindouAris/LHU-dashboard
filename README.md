# LHU Dashboard

Frontend tra cứu và quản lý tiện ích sinh viên LHU.

## Yêu cầu

- Node.js 20+
- npm

## Chạy local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

## Kiểm tra

```powershell
npm run lint
npm run build
npm run preview
```

## Biến môi trường

- `VITE_API_URL`: backend của dashboard.
- `VITE_SCHOOL_ENDPOINT`: endpoint lịch sinh viên.
- `VITE_LHU_TAPI`: base URL API LHU.

Biến `VITE_*` được đóng gói vào client. Không đặt secret trong các biến này.

## Deploy

Ứng dụng dùng `BrowserRouter`. Hosting phải rewrite các route về `/index.html`. Vercel đã được cấu hình trong `vercel.json`.
