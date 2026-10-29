# Kiến trúc frontend phòng khám

Phạm vi refactor là các chức năng và API đang có trong repository. Không bổ sung endpoint, role hoặc nghiệp vụ từ các placeholder trong yêu cầu.

- `features/<feature>/pages`: các trang nghiệp vụ; feature hooks quản lý React Query.
- `features/auth/schemas/auth.schema.ts`: validation đăng nhập/đăng ký; `hooks/useAuthActions.ts` gọi API và lưu phiên.
- `api/endpoints/*.api.ts`: các hàm gọi backend, giữ nguyên contract hiện có. `invoices.api.ts` là facade; `invoice-requests.api.ts` chứa request và kiểm tra quyền nhân viên.
- `api/axios.ts`: HTTP client, cookie, Bearer token và hàng đợi refresh. Giữ nguyên cơ chế refresh hiện có.
- `api/queryClient.ts`, `api/queryKeys.ts`: cấu hình cache và khóa có phạm vi tài khoản. Giữ nguyên query keys hiện có để tương thích logic reconciliation và cách ly dữ liệu.
- `types/*.types.ts`: type theo nghiệp vụ; `types/index.ts` cung cấp named re-exports.
- `components/layout`: Header và Sidebar dùng chung. `components/common` chứa thông báo và dialog hiện có.
- `services/socket.ts`: vòng đời kết nối realtime hiện có.
- `routes/access.ts`: luật phân vùng bệnh nhân/nhân viên; role không xác định bị từ chối.
- `theme/theme.ts`: theme Material UI. Alias `@/` trỏ đến `src/` ở cả TypeScript và Vite.

## Tương thích và phần chưa chuyển đổi

Giữ Redux và điều hướng nội bộ hiện có; chưa chuyển sang Zustand hoặc React Router. Không thêm Day.js khi chưa cần thay đổi xử lý ngày giờ. Các form ngoài auth và các component dùng chung hiện tại chưa được chuẩn hóa toàn bộ theo danh sách mẫu. Không tạo file rỗng hoặc component thay thế chỉ để khớp cây thư mục.

Giữ hành vi demo của project: lỗi đăng nhập/đăng ký có thể chuyển sang tài khoản demo. Đây không phải xác thực thành công từ backend. Mock dữ liệu hiện có vẫn ở `api/demoData.ts`.

Không dùng placeholder data chung cho dữ liệu riêng tư giữa các tài khoản hoặc hồ sơ. Không thay toàn bộ query keys vì các thao tác cập nhật cache hiện có phụ thuộc prefix và vị trí filters.

## Kiểm tra

- `npm run lint`: TypeScript, không phát sinh file.
- `npm run test:patient-portal`: kiểm tra phân quyền, cách ly cache theo tài khoản/hồ sơ và cập nhật cache.
- `npm run build`: production bundle.

Chưa kiểm tra tương tác trong trình duyệt hoặc tích hợp backend trực tiếp. Build có cảnh báo bundle lớn hơn 500 kB.

## Phạm vi giao diện

Giữ nguyên JSX, style, bố cục và hành vi tương tác trước refactor. Chỉ di chuyển file, sửa import/alias và tách module; không thêm debounce, thay đổi query keys hoặc thay đổi xử lý refresh token.

## Giao diện được khôi phục

Theo yêu cầu, các trang, Header/Sidebar, theme và CSS lấy lại từ commit `7e9d30d`; giữ đường dẫn feature mới và alias. App dùng lại giao diện các tab chung sau đăng nhập, không chuyển sang PatientPortal. QueryClient dùng chung được giữ để tương thích việc dọn cache khi đăng xuất. Các kiểm tra phân vùng trong `routes/access.ts` vẫn kiểm tra helper; chúng không xác minh App đang áp dụng helper đó. API và kiểm tra quyền hiện có trong API layer không được khôi phục về bản cũ.

## Tạo hồ sơ từ trang đặt lịch (frontend, chờ API)

Trang BookingPage có lựa chọn Chính mình / Người nhà, chỉ hiển thị hồ sơ tương ứng và nút mở PatientProfileDialog khi chưa có hồ sơ cá nhân hoặc cần thêm người nhà. Form sử dụng React Hook Form/Zod, nhập họ tên, ngày sinh, giới tính, số điện thoại và địa chỉ. Khi mở lại, form được reset; tên chính mình lấy từ tài khoản.

Theo yêu cầu chỉ làm frontend, `apiAvailable=false`: nút lưu bị khóa và biểu mẫu thông báo rõ chưa lưu dữ liệu. Không gọi endpoint giả định, không tạo hồ sơ trong cache và không tự chuyển sang bước đặt lịch bằng hồ sơ chưa tồn tại. Backend hiện chỉ cho ADMIN/SUPER_ADMIN/STAFF gọi POST /patients; route tự tạo và liên kết bản thân/người nhà chưa có. Khi API sẵn sàng cần thêm DTO quan hệ, endpoint, mutation và refresh danh sách hồ sơ; chỉ chọn hồ sơ và đóng dialog khi backend xác nhận thành công.
