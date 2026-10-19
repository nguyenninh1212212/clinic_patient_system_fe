import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Pagination as MuiPagination,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SecurityIcon from '@mui/icons-material/Security';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/appointments';
import { AppointmentStatus, AppointmentSummary } from '../../types';
import { renderStatusBadge } from '../dashboard/DashboardPage';
import { useAppDispatch } from '../../store';
import { setCurrentTab } from '../../store/slices/uiSlice';
import { getDegreeLabel } from '../doctors/DoctorDirectoryPage';

export const MyAppointmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch my bookings via GET /appointments/my-bookings
  const { data: bookingsRes, isLoading, error } = useQuery({
    queryKey: [
      'appointments',
      'my-bookings',
      {
        page: currentPage,
        limit: 8,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      },
    ],
    queryFn: () =>
      appointmentsApi.getMyBookings({
        page: currentPage,
        limit: 8,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      }),
  });

  const responseEnvelope = bookingsRes?.data;
  const bookings: AppointmentSummary[] = responseEnvelope?.data || [];
  const pagination = responseEnvelope?.pagination;

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Lịch hẹn khám của tôi
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Theo dõi lịch sử và tiến độ xử lý các lịch khám đã đăng ký qua tài khoản của bạn
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<CalendarMonthIcon />}
            onClick={() => dispatch(setCurrentTab('booking'))}
          >
            Đăng ký khám mới
          </Button>
        </Stack>

        {/* Security / Ownership Status Notice */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: '#f8fafc',
            borderColor: '#e2e8f0',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <SecurityIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.25 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.25 }}>
                Phạm vi dữ liệu lịch hẹn (Data Ownership & Scope):
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                Danh sách bên dưới được truy vấn từ endpoint chuyên biệt{' '}
                <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  GET /appointments/my-bookings
                </Box>{' '}
                (các lịch do tài khoản hiện tại tạo). Cổng bệnh nhân tuân thủ nghiêm ngặt nguyên tắc bảo mật: không gọi API tra cứu chung hoặc hủy lịch khi backend chưa bổ sung kiểm tra quyền sở hữu tương ứng.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Status Filter Tabs */}
        <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: '#ffffff', borderColor: '#e2e8f0' }}>
          <Tabs
            value={selectedStatus}
            onChange={(_, val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1 }}
          >
            <Tab label="Tất cả trạng thái" value="ALL" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
            <Tab label="Chờ duyệt (PENDING)" value="PENDING" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
            <Tab label="Đã xác nhận (CONFIRMED)" value="CONFIRMED" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
            <Tab label="Đang khám (IN_EXAMINATION)" value="IN_EXAMINATION" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
            <Tab label="Hoàn thành (COMPLETED)" value="COMPLETED" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
            <Tab label="Đã hủy (CANCELLED)" value="CANCELLED" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
          </Tabs>
        </Paper>

        {/* List of Bookings */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#ffffff' }}>
            <Typography color="error" variant="body1">
              Không thể tải danh sách lịch khám. Hãy kiểm tra kết nối với backend.
            </Typography>
          </Paper>
        ) : bookings.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 5,
              textAlign: 'center',
              bgcolor: '#f8fafc',
              borderRadius: 2.5,
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 50, color: '#94a3b8', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Không có lịch hẹn nào trong danh mục này
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
              Bạn chưa có lịch khám nào phù hợp với bộ lọc trạng thái đã chọn.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => dispatch(setCurrentTab('booking'))}
            >
              Đặt lịch khám ngay
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {bookings.map((item) => (
              <Card
                key={item.id}
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  borderColor: '#e2e8f0',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    {/* Time & Date Column */}
                    <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#f0f9ff',
                          border: '1px solid #e0f2fe',
                          textAlign: { xs: 'left', sm: 'center' },
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                          Thời gian khám
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', my: 0.5 }}>
                          {new Date(item.appointmentDate).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                          {new Date(item.appointmentDate).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Doctor, Specialty & Patient details */}
                    <Grid size={{ xs: 12, sm: 8, md: 6 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <MedicalServicesIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {item.doctor?.user?.fullName || 'Bác sĩ chuyên khoa'}
                          </Typography>
                          {item.doctor?.degree && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              ({getDegreeLabel(item.doctor.degree)})
                            </Typography>
                          )}
                        </Stack>

                        <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 600 }}>
                          Chuyên khoa: {item.doctor?.specialty?.name || 'Tổng quát'}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <PersonOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
                            Bệnh nhân: {item.patient?.fullName || 'Bản thân'}
                          </Typography>
                          {item.patient?.patientCode && (
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              (Mã BN: {item.patient.patientCode})
                            </Typography>
                          )}
                        </Stack>

                        {item.notes && (
                          <Typography
                            variant="caption"
                            sx={{
                              bgcolor: '#f8fafc',
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid #f1f5f9',
                              color: 'text.secondary',
                              fontStyle: 'italic',
                              display: 'block',
                            }}
                          >
                            Lý do khám: {item.notes}
                          </Typography>
                        )}
                      </Stack>
                    </Grid>

                    {/* Status & Action */}
                    <Grid size={{ xs: 12, md: 3 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Stack spacing={1.5} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                        {renderStatusBadge(item.status)}

                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Mã lịch: <Box component="span" sx={{ fontFamily: 'monospace' }}>{item.id.slice(0, 8)}...</Box>
                        </Typography>

                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Đăng ký lúc: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <MuiPagination
                  count={pagination.totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
