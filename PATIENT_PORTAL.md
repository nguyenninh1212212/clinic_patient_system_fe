# Bàn giao khu vực bệnh nhân

## Khảo sát và phạm vi

Đã đọc frontend types, auth/API client, Redux auth/profile/ui, App, Header/Sidebar,
queries trong UI và các API. Frontend ban đầu dùng Redux currentTab, không có router,
route guard, queryKeys.ts, queryClient.ts hay useMyPatients/useCheckAccess.
Các file này được bổ sung; không cài thêm router/dependency.

Đã đối chiếu chỉ đọc backend cạnh repo tại `../clinic_management_system_be/src`:

- `core/enums/commom.enum.ts`: bệnh nhân là USER; staff gồm ADMIN,
  SUPER_ADMIN, STAFF, MANAGER. GUEST và role lạ bị từ chối. Không suy ra quyền từ
  tên hiển thị, DOCTOR hay NURSE.
- `modules/user_patient_access/user-patient-access.controller.ts`, service,
  entity và DTO: GET my-patients trả ApiResponse<AccessDTO[]>; GET check/:patientId
  trả ApiResponse<access | null>. Service dùng createdBy để tìm liên kết.
- `modules/invoices/invoices.controller.ts`, service, DTO: GET /invoices hỗ trợ
  patientId/page/limit/search/dateFrom/dateTo; trả { data, pagination }.
  GET /invoices/:id và POST /invoices trả entity trực tiếp.
  POST /invoices/import và GET /invoices/export tồn tại.
- `modules/appointments/appointments.controller.ts`, service và DTO:
  my-bookings giới hạn bookedByUserId lấy từ session nhưng không lọc patientId.
  Không dùng endpoint này rồi lọc bệnh nhân tại frontend.
- Controllers/service examinations và prescriptions chưa xác minh quyền đọc theo user.

Backend hiện khai báo enum AccessStatus/PatientAccessLevel nhưng access entity/DTO
không có status/accessLevel. checkAccess chỉ tìm liên kết; revokeAccess không thay đổi
trạng thái hay xóa liên kết. Vì vậy liên kết KHÔNG được diễn giải thành FULL_ACCESS,
quyền chỉnh sửa, hay quyền quản lý người truy cập.

## Đã triển khai

- `/patient`, `/patient/overview`, `/patient/profiles`, `/patient/appointments`,
  `/patient/examinations`, `/patient/prescriptions`, `/patient/invoices`.
- Layout/navigation MUI tiếng Việt, tách khỏi Header/Sidebar nhân viên.
  Navigation qua History API giữ hồ sơ đang chọn, hỗ trợ Back/Forward.
- USER ở `/` chuyển tới `/patient`; staff tiếp tục sử dụng các tab nội bộ hiện có.
  Staff cũng có thể mở trực tiếp URL tab như `/invoices`, `/prescriptions`.
- Route policy chạy trước khi mount các trang staff: USER không mount trang hóa đơn
  nhân viên, form tạo/import, mutation ghi, hay dialog trạng thái lịch hẹn.
  `/invoices/new`, route nội bộ và route chi tiết hóa đơn chưa hỗ trợ đều bị từ chối.
- useMyPatients/useCheckAccess gọi endpoint thật qua API layer; không dùng user.id
  làm patientId. Kiểm tra phản hồi đúng tài khoản và patientId trước hiển thị.
- Chọn nhiều hồ sơ, xử lý chưa liên kết, loading, lỗi, mất quyền. Chỉ hiển thị thông tin
  cơ bản của hồ sơ sau khi check thành công. Tạm ẩn dữ liệu trong lúc xác minh lại.
  Refresh danh sách 30 giây và quyền 15 giây, kiểm tra lại khi cửa sổ được focus.
- Một QueryClient dùng chung, giữ cấu hình cũ và interceptor 401 hiện có.
  Khóa portal chứa userId/patientId; factory dữ liệu thêm resource/filter/page/limit.
  Query danh sách hóa đơn nhân viên có namespace staff/userId/bộ lọc.
- Cache bị hủy/xóa đồng bộ khi đổi user/role/demo hoặc logout. Profile Redux cũng reset.
  Request hoàn thành muộn không khôi phục cache phiên cũ. Không dùng placeholderData.
  Query 403 xóa cache portal của tài khoản; mất liên kết/null/error xóa cache dữ liệu hồ sơ.
- Portal không dùng dữ liệu demo thay lỗi thật; API hồ sơ thật cũng không fallback demo.
- Hóa đơn nhân viên: khôi phục types, items state, các phương thức tạo/import/export
  đang thiếu khiến lint ban đầu lỗi. Các endpoint đã được xác nhận từ backend.
  Phản hồi tạo là InvoiceDTO, được kiểm tra định dạng trước dùng trong UI.
  Mutation hook giữ đúng shape cache (entity/danh sách/envelope), cập nhật bằng setQueryData.
- findByPatientId gửi patientId/page/limit lên server, không tải toàn bộ rồi lọc.
  Facade hóa đơn hiện chỉ dành cho staff; USER bị từ chối trước khi gửi request.
- Bỏ Axios trực tiếp khỏi hai UI kiểm tra kết nối, chuyển sang API endpoint module.

## Chưa thể mở do hợp đồng backend thiếu

Các trang lịch hẹn, kết quả khám, đơn thuốc, hóa đơn hiện hiển thị trạng thái chưa
khả dụng. Đây là các trang đã được định tuyến nhưng CHƯA có danh sách/chi tiết dữ liệu
thật cho bệnh nhân. Không có nút in/tải hóa đơn, tự thanh toán hay thao tác ghi.
Không gọi API không đủ phân quyền, không giả lập endpoint hoặc dữ liệu.

Cần bổ sung/xác nhận backend trước khi nối dữ liệu:

1. Access: sửa quan hệ userId/createdBy cho nhất quán; trả status và quyền đọc từng
   loại dữ liệu; thực thi ACTIVE/REVOKED, revoke thật; không chỉ khai báo enum.
   GET check phải phản ánh thu hồi và không trả liên kết bị thu hồi như còn hợp lệ.
2. Hóa đơn: endpoint list hiện hữu đã có patientId + pagination, nhưng phải thêm
   xác thực và kiểm tra người gọi được xem patientId đó trước truy vấn. Chi tiết
   phải kiểm tra quyền trên patientId của hóa đơn thực tế, bao gồm hóa đơn không
   gắn bệnh nhân. Trả 403/404 khi không được phép; backend từ chối mọi thao tác ghi
   của USER kể cả tạo/import và mọi endpoint items/trạng thái nếu bổ sung sau này.
   Không mở GET export hiện tại cho bệnh nhân. Chỉ mở tải/in từng hóa đơn khi có
   quyền riêng được backend thực thi; không export toàn bộ.
3. Lịch hẹn: bổ sung hợp đồng patientId + page/limit với kiểm tra liên kết/quyền từ
   session ở server. my-bookings hiện chỉ theo người đặt, không đủ để hiển thị theo
   hồ sơ. Xác định quyền đặt/đổi/hủy và trạng thái được phép; API phải thực thi.
   Chưa mở các thao tác này trên portal dù POST đặt lịch tồn tại.
4. Kết quả khám/đơn thuốc: hợp đồng lọc patientId + phân trang, kiểm tra quyền đọc
   từng kết quả/đơn/items theo session và mức quyền; chỉ đọc trong portal.
5. Chốt response schema, bộ lọc, pagination, mã lỗi 401/403/404 và cơ chế báo thu hồi
   để triển khai hooks đọc dữ liệu thật. Những nội dung trên là yêu cầu bổ sung,
   không phải endpoint mới đã được frontend giả định là tồn tại.

Repo đang sửa chỉ là frontend; không sửa backend cạnh repo. Guard UI và kiểm tra role
ở API facade KHÔNG bảo vệ server khỏi HTTP request trực tiếp. Chưa thể tuyên bố backend
đã ngăn lộ dữ liệu bằng cách đổi invoiceId. Với portal hiện tại, các route ID bị chặn
và không gửi request đọc hóa đơn, nên không render hóa đơn từ ID tùy ý.

## Kiểm tra

- Baseline trước sửa: npm run lint lỗi ở InvoicesPage vì thiếu payload types,
  items/setItems, createInvoice/importExcel/exportExcel; npm run build đạt.
- Sau sửa: npm run lint đạt; npm run build đạt. Vẫn còn cảnh báo bundle >500 kB
  đã có từ baseline.
- npm run test:patient-portal: 13 bài kiểm tra bằng node:test và QueryClient thật:
  route USER/role lạ; route staff; keys tài khoản/hồ sơ/filter/page; đổi tài khoản,
  role/logout xóa cache và profile; request cũ hoàn thành muộn; 403 xóa cache;
  facade hóa đơn USER không gửi request; staff gửi patientId + pagination;
  đổi query key hồ sơ không dùng dữ liệu trước làm placeholder.
- Kiểm thử policy/cache và API adapter có mock, chưa chạy trình duyệt/E2E với tài
  khoản/backend thật. Chưa xác minh nghiệp vụ tạo/import/export thực tế hay quyền
  truy cập server; cần kiểm thử tích hợp sau khi backend hoàn tất các yêu cầu trên.

## File thay đổi trong công việc này

- src/App.tsx, src/routing/access.ts: phân vùng và guard.
- src/features/patient-portal/{components,hooks,pages}: portal và hook quyền.
- src/api/queryClient.ts, src/api/queryKeys.ts: client và keys thống nhất.
- src/api/endpoints/{patientAccess,invoices,diagnostics}.ts: API đã xác nhận.
- src/api/{invoices,patients}.ts: facade staff, lọc server và bỏ fallback hồ sơ thật.
- src/features/invoices/hooks/useStaffInvoices.ts, src/components/invoices/InvoicesPage.tsx:
  sửa lỗi staff có sẵn và hook đọc hóa đơn.
- src/store/index.ts, src/store/slices/profileSlice.ts: xóa cache/profile theo phiên.
- src/types/index.ts: role đã xác nhận và payload hóa đơn.
- src/components/common/BackendStatusModal.tsx,
  src/components/documentation/ApiAuditPage.tsx: chuyển Axios về API layer.
- tests/patient-portal.test.ts, tests/run-patient-portal.mjs, package.json: kiểm thử.
- PATIENT_PORTAL.md: bàn giao này. Giữ các chỉnh sửa người dùng có sẵn trong repo.

## Refactor query/mutation thành hook

Toàn bộ useQuery/useMutation đã được đưa khỏi src/components vào src/features/*/hooks,
bao gồm profile, bác sĩ/ca khám, lịch hẹn, thông báo, đơn thuốc và hóa đơn.
Query key nhân viên dùng resource/staff/userId/filter và query chỉ chạy khi hợp lệ.
Hook realtime cũng chứa phần đồng bộ cache thay vì đặt trong App.

Không còn invalidateQueries. Mutation cập nhật bằng setQueryData: thông báo đã đọc,
đơn thuốc và dòng thuốc có đủ response được cập nhật trực tiếp vào các cache liên quan.
Tạo/xóa/import thay đổi phân trang, phản hồi chỉ xác nhận và sự kiện realtime không
có entity cần đọc lại các trang đang có trong cache theo đúng filter, rồi setQueryData
với response thật. Không tự ghép entity hoặc pagination từ dữ liệu chưa đủ.
Đồng bộ thất bại loại bỏ cache trang cũ; không báo thao tác ghi đã thành công là thất bại.
Bản ghi cache bị xóa hoặc phiên thay đổi không được khôi phục bởi response đến muộn.
Đặt lịch qua hàng đợi chỉ nhận acknowledgment, không tạo lịch hẹn giả trong cache.

Bổ sung kiểm thử cập nhật thông báo nhiều cache không trừ unread hai lần, cập nhật
entity giữ pagination, đọc lại trang đúng filter và response đồng bộ sau logout
không tái tạo cache riêng tư.
