# HƯỚNG DẪN TRIỂN KHAI & BÁO CÁO TÍCH HỢP CỔNG BỆNH NHÂN (PATIENT WEB PORTAL)

Ứng dụng Cổng Bệnh nhân được xây dựng bằng **React + TypeScript + Vite**, sử dụng hệ thống component **Material UI (MUI)** theo đúng quy chuẩn y tế, quản lý trạng thái máy chủ bằng **TanStack Query**, quản lý trạng thái toàn cục bằng **Redux Toolkit**, và HTTP client **Axios** (có interceptor tự động làm mới JWT token và bảo mật cookie).

---

## 1. Hướng Dẫn Khởi Chạy

### 1.1 Cấu hình biến môi trường
Tệp cấu hình mẫu `.env.example`:
```bash
VITE_API_BASE_URL="http://localhost:8000"
```
Khi khởi chạy frontend, ứng dụng mặc định kết nối tới `http://localhost:8000`. Người dùng và lập trình viên cũng có thể kiểm tra hoặc thay đổi địa chỉ backend trực tiếp trên giao diện thông qua nút **"Cấu hình kết nối Backend"** ở góc phải thanh tiêu đề.

### 1.2 Khởi chạy Backend NestJS
- Đảm bảo NestJS đang chạy tại `http://localhost:8000`.
- Kiểm tra cấu hình CORS trong `main.ts` của NestJS:
  - Cho phép origin: `http://localhost:3000`
  - Bật `credentials: true` (để gửi và nhận cookie HTTP-only chứa refresh token).

### 1.3 Khởi chạy Frontend
```bash
# Cài đặt dependencies (đã hoàn tất)
npm install

# Kiểm tra cú pháp và kiểu dữ liệu TypeScript
npm run lint

# Khởi chạy máy chủ phát triển (cổng 3000)
npm run dev
```

---

## 2. Trạng Thái Tích Hợp API Thực Tế

### 2.1 Các Phân Hệ Đã Tích Hợp Đầy Đủ & Hoạt Động (Production-Ready)
1. **Xác thực (Auth)**:
   - `POST /auth/login`: Đăng nhập bằng email/password, nhận `accessToken` và lưu thông tin `user` vào Redux. Refresh token được lưu trong HTTP-only cookie.
   - `POST /auth/register`: Đăng ký tài khoản người dùng role `USER` với validation tiếng Việt (Zod + React Hook Form).
   - `GET /auth/me`: Lấy thông tin tài khoản hiện tại với Bearer JWT.
   - `POST /auth/refresh-token`: Tự động kích hoạt thông qua Axios interceptor khi gặp mã lỗi `401 Unauthorized` (có cơ chế hàng đợi xử lý tranh chấp phiên).
   - `POST /auth/logout`: Xóa phiên và thu hồi cookie.
2. **Hồ sơ bệnh nhân & Người thân (Patients & Access)**:
   - `GET /patients/me`: Lấy hồ sơ y tế cá nhân. Xử lý chuẩn xác mã lỗi `404` (chưa liên kết hồ sơ phòng khám) bằng thông báo và hướng dẫn đến quầy tiếp đón; tuyệt đối không gọi `POST /patients` vì endpoint tạo hồ sơ chỉ dành cho nhân viên y tế.
   - `GET /user-patient-access/my-patients`: Lấy danh sách hồ sơ người thân được cấp quyền ủy quyền hợp lệ để chọn đặt khám.
3. **Chuyên khoa & Bác sĩ (Specialties & Doctors)**:
   - `GET /specialties/all` & `GET /specialties`: Lấy danh sách chuyên khoa y tế và phân trang.
   - `GET /doctors`: Tìm kiếm bác sĩ, lọc theo học vị (`MD`, `MASTER`, `PHD`, `PROFESSOR`, `ASSOCIATE_PROFESSOR`) và chuyên khoa.
   - `GET /doctors/:id`: Xem chi tiết bác sĩ.
   - `GET /doctors/:id/shifts`: Xem ca làm việc của bác sĩ theo ngày (thể hiện thời gian trực tại phòng khám).
4. **Lịch hẹn cá nhân (Appointments)**:
   - `GET /appointments/my-bookings`: Truy vấn danh sách lịch hẹn do tài khoản hiện tại tạo, hỗ trợ lọc theo trạng thái (`PENDING`, `CONFIRMED`, `IN_EXAMINATION`, `COMPLETED`, `CANCELLED`).
   - `POST /appointments`: Gửi yêu cầu đặt lịch hẹn mới (xử lý bất đồng bộ qua hàng đợi RabbitMQ).
5. **Thông báo & Realtime (Notifications & WebSockets)**:
   - `GET /notifications`: Xem danh sách thông báo và số lượng chưa đọc (`unRead`).
   - `PUT /notifications/:id/read`: Đánh dấu đã đọc thông báo.
   - `Socket.IO namespace /notifications`: Kết nối an toàn bằng `auth: { token: accessToken }`, lắng nghe sự kiện `notification` để hiển thị Toast thông báo tức thì và kích hoạt làm mới bộ nhớ đệm TanStack Query.
6. **Quản lý Hóa đơn (Invoices Management)**:
   - `GET /invoices?page={page}&limit={limit}`: Danh sách hóa đơn phân trang.
   - `GET /invoices/:id`: Xem chi tiết hóa đơn, thông tin người mua, bệnh nhân và từng dòng hàng.
   - Tuân thủ yêu cầu: Backend chưa có API cập nhật hoặc xóa hóa đơn, giao diện không hiển thị 2 thao tác này.
7. **Quản lý Đơn thuốc (Prescriptions Management)**:
   - `GET /prescriptions?page={page}&limit={limit}&issuedAt={YYYY-MM-DD}`: Danh sách đơn thuốc phân trang, có lọc theo ngày cấp `issuedAt` và lọc client-side theo `pharmacyStatus`.
   - `GET /prescriptions/:id`: Xem chi tiết đơn thuốc và thông tin khám bệnh.
   - `POST /prescriptions`: Tạo đơn thuốc mới theo `examinationId`.
   - `PATCH /prescriptions/:id`: Cập nhật thông tin đơn thuốc (`notes`, `validUntil`, `pharmacyStatus`).
   - `DELETE /prescriptions/:id`: Xóa đơn thuốc.
   - `GET /prescription-items?prescriptionId={id}`: Lấy danh sách thuốc trong đơn.
   - `POST /prescription-items`: Thêm từng loại thuốc vào đơn (`medicineId`, `quantity`, `dosage`, `frequency`, `duration`, `note`).
   - `PATCH /prescription-items/:id`: Cập nhật thuốc trong đơn.
   - `DELETE /prescription-items/:id`: Xóa thuốc khỏi đơn.

---

## 3. Các API Bất Đồng Bộ & Cần Bổ Sung Bảo Vệ (Backend Gaps & Security Audit)

1. **Đặt lịch khám (`POST /appointments`)**:
   - Hiện tại controller backend chỉ phát sự kiện vào RabbitMQ và chưa trả đồng bộ DTO xác nhận lịch.
   - Giao diện thể hiện trung thực thông điệp: yêu cầu đã được đưa vào hàng đợi xử lý bất đồng bộ và sẽ được xác nhận khi phòng khám duyệt.
2. **Lịch hẹn chung & Hủy lịch (`GET /appointments` & `DELETE /appointments/:id`)**:
   - Hai route này trong backend chưa áp dụng bộ lọc quyền sở hữu bệnh nhân (ownership check).
   - Cổng bệnh nhân **không gọi** route chung hoặc hủy lịch trần để bảo vệ tính toàn vẹn dữ liệu.
3. **Kết quả khám bệnh (`GET /appointments/:id/examination` & `GET /examinations`)**:
   - Các route kết quả khám hiện chưa có guard kiểm tra quyền sở hữu của bệnh nhân.
   - Cổng bệnh nhân tạm thời khóa hiển thị bệnh án thô và hiển thị trạng thái chờ endpoint có bảo vệ:
     - **Đề xuất backend**: `GET /patients/me/examinations`

---

## 4. Kết Quả Kiểm Thử (Build & Typecheck)
- **TypeScript Typecheck (`npm run lint`)**: Đạt `0 errors`, tương thích hoàn toàn với `@mui/material` v9.4.0, React 19 và strict mode.
- **Vite Production Build (`npm run build`)**: Thành công 100%, tạo gói phân phối tối ưu trong thư mục `dist/`.
