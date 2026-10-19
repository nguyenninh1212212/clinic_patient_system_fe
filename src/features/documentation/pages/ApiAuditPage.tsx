import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Grid,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import axios from 'axios';
import { getApiBaseUrl } from '@/api/axios';
import { useAppDispatch } from '@/store/index';
import { setServerConfigModalOpen } from '@/store/slices/uiSlice';

interface ApiAuditItem {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS';
  endpoint: string;
  category: string;
  status: 'INTEGRATED' | 'BLOCKED_SECURITY_RISK' | 'ASYNC_QUEUE' | 'PROPOSED';
  statusLabel: string;
  guard: string;
  notes: string;
}

export const ApiAuditPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentBaseUrl = getApiBaseUrl();

  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [pingDetail, setPingDetail] = useState<string>('');

  const testLiveEndpoint = async () => {
    setPingStatus('checking');
    setPingDetail('');
    try {
      const res = await axios.get(`${currentBaseUrl}/specialties/all`, {
        timeout: 5000,
        withCredentials: true,
      });
      setPingStatus('ok');
      setPingDetail(`Phản hồi thành công HTTP ${res.status}. Máy chủ NestJS sẵn sàng tại ${currentBaseUrl}`);
    } catch (err: unknown) {
      setPingStatus('fail');
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setPingDetail(`Lỗi: ${(err as { message: string }).message}. Lưu ý kiểm tra backend đã start và CORS chấp nhận http://localhost:3000.`);
      } else {
        setPingDetail('Không thể kết nối tới máy chủ.');
      }
    }
  };

  const auditItems: ApiAuditItem[] = [
    {
      method: 'POST',
      endpoint: '/auth/login',
      category: 'Xác thực',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Công khai (Public)',
      notes: 'Đăng nhập trả về accessToken; refresh token set tự động qua HTTP-only cookie.',
    },
    {
      method: 'POST',
      endpoint: '/auth/register',
      category: 'Xác thực',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Công khai (Public)',
      notes: 'Đăng ký tài khoản người dùng role USER với fullName, email, password.',
    },
    {
      method: 'GET',
      endpoint: '/auth/me',
      category: 'Xác thực',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Trả về đối tượng IUser trực tiếp; xử lý refresh token tự động khi hết hạn qua Axios interceptor.',
    },
    {
      method: 'POST',
      endpoint: '/auth/refresh-token',
      category: 'Xác thực',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Cookie Refresh',
      notes: 'Xử lý tự động trong Axios interceptor khi gặp mã lỗi 401 với cơ chế hàng đợi tránh race condition.',
    },
    {
      method: 'GET',
      endpoint: '/patients/me',
      category: 'Hồ sơ bệnh nhân',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Trả về hồ sơ cá nhân. Xử lý chuẩn mã 404 (chưa liên kết) bằng giao diện hướng dẫn, không gọi bừa POST /patients.',
    },
    {
      method: 'GET',
      endpoint: '/user-patient-access/my-patients',
      category: 'Hồ sơ người thân',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Lấy danh sách hồ sơ người thân đã được cấp quyền ủy quyền hợp lệ để đặt lịch khám.',
    },
    {
      method: 'GET',
      endpoint: '/specialties/all & /specialties',
      category: 'Chuyên khoa',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Truy vấn danh sách chuyên khoa, phân trang và hỗ trợ lọc bác sĩ theo khoa.',
    },
    {
      method: 'GET',
      endpoint: '/doctors & /doctors/:id',
      category: 'Bác sĩ',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Tìm kiếm bác sĩ, lọc theo học vị (MD, MASTER, PHD, GS, PGS) và chuyên khoa.',
    },
    {
      method: 'GET',
      endpoint: '/doctors/:id/shifts',
      category: 'Ca làm việc',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Xem ca trực của bác sĩ theo ngày (thể hiện thời gian trực, không tự suy diễn slot trống).',
    },
    {
      method: 'POST',
      endpoint: '/appointments',
      category: 'Đặt lịch khám',
      status: 'ASYNC_QUEUE',
      statusLabel: 'Bất đồng bộ (RabbitMQ)',
      guard: 'Bearer JWT',
      notes: 'Backend phát sự kiện RabbitMQ và chưa trả đồng bộ DTO lịch. Frontend hiển thị thông báo hàng đợi trung thực.',
    },
    {
      method: 'GET',
      endpoint: '/appointments/my-bookings',
      category: 'Lịch hẹn cá nhân',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Lấy danh sách các lịch do tài khoản hiện tại tạo với bộ lọc trạng thái và phân trang.',
    },
    {
      method: 'GET',
      endpoint: '/notifications & PUT /notifications/:id/read',
      category: 'Thông báo',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'Bearer JWT',
      notes: 'Lấy thông báo, đánh dấu đã đọc và hiển thị số lượng chưa đọc.',
    },
    {
      method: 'WS',
      endpoint: 'Socket.IO /notifications',
      category: 'Thông báo Realtime',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'auth.token',
      notes: 'Lắng nghe sự kiện notification để bật Toast alert tức thì và tự động refetch danh sách thông báo.',
    },
    {
      method: 'GET',
      endpoint: '/appointments (Chung) & DELETE /appointments/:id',
      category: 'Bảo mật lịch hẹn',
      status: 'BLOCKED_SECURITY_RISK',
      statusLabel: 'Chặn gọi từ Client',
      guard: 'Thiếu Ownership Guard',
      notes: 'Route chung chưa giới hạn dữ liệu theo user và DELETE chưa kiểm tra ownership. Đã khóa để bảo vệ an toàn.',
    },
    {
      method: 'GET',
      endpoint: '/appointments/:id/examination & /examinations',
      category: 'Kết quả khám bệnh',
      status: 'BLOCKED_SECURITY_RISK',
      statusLabel: 'Chờ Backend bổ sung',
      guard: 'Thiếu Guard / Ownership',
      notes: 'Đề xuất endpoint an toàn: GET /patients/me/examinations có JWT guard và kiểm tra hồ sơ bệnh nhân.',
    },
    {
      method: 'GET',
      endpoint: '/prescriptions, /prescription-items (CRUD)',
      category: 'Đơn thuốc',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'REST API',
      notes: 'Hỗ trợ tạo đơn (POST), cập nhật (PATCH), xóa (DELETE), quản lý thuốc trong đơn qua /prescription-items.',
    },
    {
      method: 'GET',
      endpoint: '/invoices (List, Detail, Create, Export, Import)',
      category: 'Hóa đơn viện phí',
      status: 'INTEGRATED',
      statusLabel: 'Đã tích hợp đầy đủ',
      guard: 'REST API',
      notes: 'Hỗ trợ xem danh sách, chi tiết, tạo hóa đơn kèm nhiều dòng hàng, xuất file Excel và nhập Excel multipart/form-data.',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Báo cáo Kiểm toán API & Tình trạng Kết nối Hệ thống
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Kiểm tra tính toàn vẹn của kết nối backend NestJS, kiểm toán các chốt chặn bảo mật và ranh giới tích hợp dữ liệu
          </Typography>
        </Box>

        {/* Live Server Connection Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: '#ffffff',
            borderColor: '#e2e8f0',
          }}
        >
          <Grid container spacing={3} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: '#e0f2fe',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SettingsEthernetIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Địa chỉ Backend hiện tại:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.dark' }}>
                    {currentBaseUrl}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    (Cấu hình qua biến môi trường VITE_API_BASE_URL hoặc hộp thoại cấu hình)
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testLiveEndpoint}
                  disabled={pingStatus === 'checking'}
                  startIcon={pingStatus === 'checking' ? <CircularProgress size={16} /> : <PlayCircleOutlinedIcon />}
                >
                  Kiểm tra Ping máy chủ
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => dispatch(setServerConfigModalOpen(true))}
                >
                  Đổi địa chỉ API
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {pingDetail && (
            <Alert
              severity={pingStatus === 'ok' ? 'success' : 'warning'}
              sx={{ mt: 2.5, fontSize: '0.85rem' }}
            >
              {pingDetail}
            </Alert>
          )}
        </Paper>

        {/* Security Rule Constitution */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: '#f8fafc',
            borderColor: '#cbd5e1',
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <SecurityIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Nguyên tắc Bảo mật & Giới hạn Tích hợp (Security Principles):
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              1. <strong>Không ngụy tạo dữ liệu:</strong> Cổng bệnh nhân không tạo mock data để giả lập đã tích hợp xong. Các API chưa an toàn hoặc chưa sẵn sàng được hiển thị trung thực với trạng thái chờ máy chủ.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              2. <strong>Ẩn nút không phải bảo mật:</strong> Dữ liệu bệnh nhân, đơn thuốc, hóa đơn phải được kiểm tra quyền ở máy chủ (Patient-Scoped Authorization), không được phơi bày endpoint trần không guard.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              3. <strong>Bảo vệ Cookie & Token:</strong> Truyền refresh token qua HTTP-only cookie, access token giữ trong bộ nhớ ứng dụng và không lưu dữ liệu y tế nhạy cảm trong localStorage.
            </Typography>
          </Stack>
        </Paper>

        {/* Audit Table */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
            Bảng ma trận kiểm toán API Backend
          </Typography>

          <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 90 }}>Phương thức</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 240 }}>Đường dẫn (Endpoint)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 140 }}>Nhóm nghiệp vụ</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 180 }}>Trạng thái cổng</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 150 }}>Cơ chế bảo vệ</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Ghi chú tích hợp & Bảo mật</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditItems.map((item, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell>
                        <Chip
                          label={item.method}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22,
                            bgcolor:
                              item.method === 'GET'
                                ? '#e0f2fe'
                                : item.method === 'POST'
                                ? '#dcfce7'
                                : item.method === 'PUT'
                                ? '#fef3c7'
                                : item.method === 'DELETE'
                                ? '#fee2e2'
                                : '#f3e8ff',
                            color:
                              item.method === 'GET'
                                ? '#0369a1'
                                : item.method === 'POST'
                                ? '#15803d'
                                : item.method === 'PUT'
                                ? '#b45309'
                                : item.method === 'DELETE'
                                ? '#b91c1c'
                                : '#7e22ce',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>
                        {item.endpoint}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {item.category}
                      </TableCell>
                      <TableCell>
                        {item.status === 'INTEGRATED' && (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                            label={item.statusLabel}
                            size="small"
                            sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                        {item.status === 'ASYNC_QUEUE' && (
                          <Chip
                            icon={<WarningAmberIcon sx={{ fontSize: '14px !important' }} />}
                            label={item.statusLabel}
                            size="small"
                            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                        {item.status === 'BLOCKED_SECURITY_RISK' && (
                          <Chip
                            icon={<ErrorOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                            label={item.statusLabel}
                            size="small"
                            sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>
                        {item.guard}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {item.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Stack>
    </Container>
  );
};
