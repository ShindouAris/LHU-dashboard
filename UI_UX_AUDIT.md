# UI/UX audit — LHU Dashboard

## Phạm vi và phương pháp
- Đọc source routing/layout/design tokens/shared UI, các trang nghiệp vụ: lịch học, thời khóa biểu, thời tiết, điểm, điểm danh, QR, bãi xe, cài đặt, điểm rèn luyện, thư viện/đặt phòng/quản lý phòng, tools/khảo sát, ChisaAI/privacy; component legacy PROOF_DRL.
- Chromium qua Browser Use/CDP: DOM, geometry, accessibility tree, kiểm tra control. Trạng thái khách, không đăng nhập, không gửi booking/khảo sát/check-in thật.
- 19 URL: `/`, `/home`, `/schedule`, `/timetable`, `/weather`, `/mark`, `/diemdanh`, `/qrscan`, `/parking`, `/settings`, `/diemrenluyen`, `/thuvien`, `/toollhu`, `/toollhu/survey`, `/chisaAI`, `/chisaAI/privacy`, `/styleguide`, `/login`, `/not-found`.
- 8 chiều rộng: 320, 375, 390, 430, 768, 1024, 1440, 1920; chiều cao 900. Kiểm tra thêm 320×400, 375×667 cho control/modal.
- 152 tổ hợp route/viewport lưu JSONL trước/sau. Sau các sửa shared UI, không thấy phần tử `main` vượt viewport trong trạng thái khách. Không suy rộng sang dữ liệu đăng nhập/chuỗi dài.
- Regression Node: execute source/component transpiled với service/hook seams stub chỉ trong test; không phải kết quả backend thật. Fixture browser `scripts/ui-audit.html` kiểm tra shared Dialog/LoadingScreen.

## Lỗi đã sửa
- Thư viện P1: thay icon QR giả bằng SVG QR mã hóa nguyên payload `LIB-${selectedBookingId}`; giữ contract API. P2: dùng Radix Dialog/DropdownMenu portal, bổ sung tên nút lịch/menu. Offline SVG/payload/copy/SSR đã kiểm tra; chưa check-in thật hoặc kiểm tra focus/Escape của modal booking bằng browser.
| Mức | Khu vực / tái hiện | Nguyên nhân | Sửa / chứng cứ |
|---|---|---|---|
| P1 | Đặt phòng: chọn giờ tương lai, xác nhận lần đầu | Gate thời gian đảo; chỉ xét ngày hôm nay; callback đọc isAccepted cũ; finally đóng form cả khi lỗi | So datetime ngày đã chọn; submit xác nhận trực tiếp; giữ form lỗi, chặn gửi lặp. `node scripts/room-booking-check.cjs`: 5 nhóm đạt; chưa booking thật |
| P1 | Lịch: request đầu lỗi, bấm Thử lại | MSSV chỉ lưu sau thành công | Lưu MSSV hợp lệ trước request; giữ ô tìm/đổi MSSV khi lỗi. `node scripts/check-schedule-ui.cjs`: retry hai trang đạt |
| P1 | Chỉ có lịch thi, không có lớp | Exam nằm trong nhánh có lớp; calendar kiểm tra schedules thay events | Tách phần thi; exam-only calendar. Regression đạt |
| P1 | ChisaAI: check tài khoản reject | userExists vẫn null, spinner trước nhánh lỗi | Lỗi riêng, alert, retry; không cấp quyền khi lỗi. `node scripts/chisa-ui-check.cjs`: reject/retry/terms/model đạt |
| P2 | Calendar: ngày thi thiếu/sai | Fallback new Date tạo lịch giả hôm nay | Bỏ ngày/giờ không hợp lệ; thông báo số mục bỏ qua. Regression đạt |
| P2 | Cài đặt: xóa cache rồi chuyển trang tài khoản | localStorage.clear xóa auth_user/settings | Chỉ xóa lịch sử tìm; giữ auth/preferences. `node scripts/cache-ui-check.mjs`: đạt |
| P2 | Cài đặt 320px: URL bị cắt; Tab bỏ qua URL | Flex không min-w-0, p onClick | Link native, break-all, flex shrink phù hợp. Browser regression trước fail, sau đạt |
| P2 | Tools 320px: Xử lý (0) vượt viewport | Action flex không wrap | flex-wrap; browser geometry sau đạt |
| P2 | Tools: nội dung dài trong wrapper | overflow-hidden không cho cuộn | overflow-y-auto; cần kiểm tra thêm danh sách có dữ liệu thật |
| P2 | Shared Dialog: nội dung cao 1200px tại 320×400 | Không max-height/scroll | Giới hạn theo dvh, cuộn, khoảng lề; fixture browser trước fail, sau đạt |
| P2 | LoadingScreen | Không status, căn giữa thiếu flex, chuyển động JS bỏ qua CSS giảm chuyển động | Live status, text, flex, useReducedMotion; fixture browser đạt, transform none khi reduce. GIF tự chuyển động chưa dừng |
| P2 | Login Trang chủ / QR hướng dẫn | a thiếu href, SVG onClick | Link/button native, accessible name; browser control hoạt động |
| P2 | Ô MSSV | Ring bị tắt, không chỉ báo focus | focus-within ring wrapper; browser computed shadow xác minh |
| P2 | Sidebar đóng | Không có Radix trigger để trả focus | onCloseAutoFocus trả nút Mở menu; đã kiểm tra lifecycle. Harness pause CSS animation; không tuyên bố kiểm tra thời gian animation tự nhiên |
| P2 | Token destructive/purple | White labels contrast 3.78/4.31 dưới AA | Light destructive 5.63; purple 5.62; dark destructive label 6.00, error-on-card 4.87. Tính sRGB từ token CSS thực tế |
| P2 | ChisaAI nhãn model | State safeName nhưng lookup modelId | Lookup safeName, không đổi payload API; regression đạt |
| P3 | Cài đặt | Lỗi chính tả Điều chỉnh | Sửa nhãn |

## Giới hạn / việc còn lại
- Không xác nhận WCAG 2.2 AA toàn hệ thống, screen reader thật, browser khác, thiết bị thật, keyboard toàn bộ luồng, camera, network/console toàn bộ. Accessibility tree xác minh switch settings có tên đúng; heuristic button text rỗng không phải lỗi.
- P2 cần xử lý tiếp: camera cleanup/reset; survey tiếp tục ngầm khi unmount; upload DRL div onClick; dialog thi lại/hủy khảo sát thiếu DialogTitle; label/select/date DRL/điểm danh; quản lý phòng search race. Source evidence, chưa runtime tái hiện.
- P2 legacy: PROOF_DRL handler xóa file mở dialog xóa link; chưa thấy mount ở luồng hiện tại, chưa sửa.
- P2/P3: footer Privacy/Terms là hash không nội dung; settings phiên bản 1.0.0 khác package 3.6.0; weather nhãn Cao là temp hiện tại; ngày cập nhật privacy động. Chưa quyết định nội dung sản phẩm nên giữ nguyên.
- P2 responsive: bãi xe col-span-3 trong grid mobile; chưa thấy overflow runtime, cần fixture vehicle có dữ liệu.
- Performance: build còn cảnh báo bundle ChisaAI lớn và Browserslist cũ. Không cập nhật dependency, không che warning.
- Booking/QR/API thật cần tài khoản, dữ liệu được phép; không giả lập kết quả thành công như đã chạy production.
- Không commit/push. Giữ thay đổi chưa commit có sẵn ChisaAI/services/types; chỉ patch vùng liên quan.

## Trạng thái kiểm thử
- ESLint: PASS; TypeScript `tsc -b`: PASS; production build/PWA: PASS; `git diff --check`: PASS tại checkpoint gần nhất.
- Node booking/schedule/cache/ChisaAI regressions: PASS.
- Browser shared settings/dialog/loader/help/route geometry: PASS như phạm vi trên.
- QR thư viện: `node scripts/check-elib-ui.cjs` PASS. Cảnh báo Calendar có `view` thiếu `onView` còn tồn tại; chưa thay đổi hành vi lịch.
- Lần kiểm tra cuối: cả 5 Node regression scripts, ESLint, build gồm TypeScript/PWA, git diff --check đều PASS. Warning giữ nguyên.

## Chạy lại
```sh
npm run dev -- --host 127.0.0.1
node scripts/cache-ui-check.mjs
node scripts/room-booking-check.cjs
node scripts/check-schedule-ui.cjs
node scripts/chisa-ui-check.cjs
node scripts/check-elib-ui.cjs
npm run lint
npm run build
```
Mở `/scripts/ui-audit.html`, gọi `checkDialogUI()` / `checkLoaderUI()` trong browser; `/settings` 320px import `/scripts/ui-audit-check.mjs`, gọi `checkSettingsUI()`.
