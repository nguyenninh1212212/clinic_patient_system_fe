import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BadgeIcon from '@mui/icons-material/Badge';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PersonIcon from '@mui/icons-material/Person';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCurrentTab } from '../../store/slices/uiSlice';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/appointments';
import { patientsApi } from '../../api/patients';
import { doctorsApi } from '../../api/doctors';
import { notificationsApi } from '../../api/notifications';
import { AppointmentStatus } from '../../types';

// Helper for status badge & text
export const renderStatusBadge = (status: AppointmentStatus) => {
  switch (status) {
    case 'PENDING':
      return (
        <Chip
          icon={<HourglassEmptyIcon sx={{ fontSize: '14px !important' }} />}
          label="Chờ duyệt"
          size="small"
          sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    case 'CONFIRMED':
      return (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
          label="Đã xác nhận"
          size="small"
          sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    case 'IN_EXAMINATION':
      return (
        <Chip
          label="Đang khám"
          size="small"
          sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    case 'COMPLETED':
      return (
        <Chip
          label="Hoàn thành"
          size="small"
          sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    case 'CANCELLED':
      return (
        <Chip
          icon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
          label="Đã hủy"
          size="small"
          sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    case 'WAITING_TRIAGE':
      return (
        <Chip
          label="Chờ phân luồng"
          size="small"
          sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    case 'TRIAGED':
      return (
        <Chip
          label="Đã phân luồng"
          size="small"
          sx={{ bgcolor: '#fae8ff', color: '#86198f', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    case 'NO_SHOW':
      return (
        <Chip
          label="Vắng mặt"
          size="small"
          sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
    default:
      return (
        <Chip
          label={status}
          size="small"
          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.75rem' }}
        />
      );
  }
};

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { activePatientName, isRelative } = useAppSelector((state) => state.profile);

  // Patient profile query
  const { data: patientRes } = useQuery({
    queryKey: ['patient', 'me'],
    queryFn: patientsApi.getMyPatient,
  });

  // Recent bookings query
  const { data: bookingsRes, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['appointments', 'my-bookings', { page: 1, limit: 3 }],
    queryFn: () => appointmentsApi.getMyBookings({ page: 1, limit: 3 }),
  });

  // Specialties
  const { data: specialtiesRes } = useQuery({
    queryKey: ['specialties', 'all'],
    queryFn: doctorsApi.getAllSpecialties,
  });

  // Recent notifications
  const { data: notificationsRes } = useQuery({
    queryKey: ['notifications', 'dashboard'],
    queryFn: () => notificationsApi.getNotifications({ page: 1, limit: 3 }),
  });

  const patient = patientRes?.data;
  const recentBookings = bookingsRes?.data?.data || [];
  const specialties = specialtiesRes?.data || [];
  const recentNotifications = notificationsRes?.notifications || [];

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Welcome Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          }}
        >
          <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    bgcolor: 'primary.main',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  <MedicalServicesIcon sx={{ fontSize: 30 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#0369a1' }}>
                    Xin chào, {user?.fullName || 'Quý khách'}!
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155', mt: 0.25 }}>
                    {patient ? (
                      <Box component="span">
                        Mã bệnh nhân:{' '}
                        <Box component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {patient.patientCode}
                        </Box>{' '}
                        · SĐT: {patient.phone}
                      </Box>
                    ) : (
                      'Tài khoản đã sẵn sàng đặt lịch khám với các bác sĩ chuyên khoa.'
                    )}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CalendarMonthIcon />}
                onClick={() => dispatch(setCurrentTab('booking'))}
                sx={{
                  py: 1.2,
                  px: 3,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                }}
              >
                Đặt lịch khám ngay
              </Button>
            </Grid>
          </Grid>

          {/* Active Context Banner */}
          {activePatientName && (
            <Box
              sx={{
                mt: 2.5,
                pt: 2,
                borderTop: '1px dashed #bae6fd',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {isRelative ? (
                <FamilyRestroomIcon fontSize="small" sx={{ color: 'secondary.main' }} />
              ) : (
                <PersonIcon fontSize="small" sx={{ color: 'primary.main' }} />
              )}
              <Typography variant="body2" sx={{ color: '#0f172a' }}>
                Hồ sơ đang chọn để thao tác:{' '}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {activePatientName}
                </Box>{' '}
                ({isRelative ? 'Hồ sơ người thân được ủy quyền' : 'Hồ sơ bản thân'})
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Quick Action Navigation Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
              }}
              onClick={() => dispatch(setCurrentTab('booking'))}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: '#e0f2fe',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarMonthIcon />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Đặt lịch khám
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    Chọn bác sĩ, ngày hẹn và gửi yêu cầu đăng ký khám nhanh chóng.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
              }}
              onClick={() => dispatch(setCurrentTab('doctors'))}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: '#f0fdf4',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PersonSearchIcon />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Tìm bác sĩ
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    Tra cứu danh sách bác sĩ chuyên khoa, học vị và ca làm việc.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
              }}
              onClick={() => dispatch(setCurrentTab('appointments'))}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AssignmentIcon />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Lịch hẹn của tôi
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    Theo dõi trạng thái các lịch khám đã gửi và lịch sắp tới.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' },
              }}
              onClick={() => dispatch(setCurrentTab('profile'))}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: '#f3e8ff',
                      color: '#9333ea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BadgeIcon />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Hồ sơ & Người thân
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    Quản lý thông tin y tế cá nhân và danh sách hồ sơ người thân.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Two-column layout: Upcoming Bookings & Recent Notifications */}
        <Grid container spacing={3}>
          {/* Upcoming Bookings */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    Lịch hẹn sắp tới
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    onClick={() => dispatch(setCurrentTab('appointments'))}
                  >
                    Xem tất cả
                  </Button>
                </Stack>

                {isBookingsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : recentBookings.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                    }}
                  >
                    <CalendarMonthIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Chưa có lịch hẹn nào
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                      Hãy đặt lịch khám với bác sĩ chuyên khoa để được chăm sóc chu đáo nhất.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => dispatch(setCurrentTab('booking'))}
                    >
                      Đặt lịch ngay
                    </Button>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {recentBookings.map((booking) => (
                      <Paper
                        key={booking.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderColor: '#e2e8f0',
                          '&:hover': { borderColor: 'primary.light', bgcolor: '#f8fafc' },
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {booking.doctor?.user?.fullName || 'Bác sĩ chuyên khoa'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                Chuyên khoa: {booking.doctor?.specialty?.name || 'Tổng quát'}
                              </Typography>
                            </Box>
                            {renderStatusBadge(booking.status)}
                          </Stack>

                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                              <AccessTimeIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                {new Date(booking.appointmentDate).toLocaleString('vi-VN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              • Bệnh nhân: {booking.patient?.fullName || 'Tôi'}
                            </Typography>
                          </Stack>

                          {booking.notes && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                bgcolor: '#f1f5f9',
                                p: 1,
                                borderRadius: 1,
                                fontStyle: 'italic',
                              }}
                            >
                              Ghi chú: {booking.notes}
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Recent Notifications & Clinic Notice */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <NotificationsActiveIcon color="primary" fontSize="small" />
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        Thông báo gần đây
                      </Typography>
                    </Stack>
                  </Stack>

                  {recentNotifications.length === 0 ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Không có thông báo mới nào.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {recentNotifications.map((n) => (
                        <Box
                          key={n.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: n.isRead ? '#f8fafc' : '#f0f9ff',
                            borderLeft: '3px solid',
                            borderColor: n.isRead ? '#cbd5e1' : 'primary.main',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {n.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                            {n.message}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Clinic Notes */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#ffffff',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0369a1' }}>
                  Giờ làm việc & Tiếp đón bệnh nhân
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  • Buổi sáng: 07:30 - 11:30 | Buổi chiều: 13:30 - 17:00
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  • Quý khách vui lòng có mặt trước giờ hẹn 15 phút tại Quầy tiếp đón để hoàn tất thủ tục phân luồng.
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  • Cần hỗ trợ khẩn cấp: Hotline cấp cứu 1900-xxxx (24/7).
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Featured Specialties Section */}
        {specialties.length > 0 && (
          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                Chuyên khoa nổi bật
              </Typography>
              <Button
                size="small"
                onClick={() => dispatch(setCurrentTab('doctors'))}
                endIcon={<ArrowForwardIcon fontSize="small" />}
              >
                Khám phá chuyên khoa
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {specialties.slice(0, 6).map((spec) => (
                <Grid size={{ xs: 6, sm: 4, md: 2 }} key={spec.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: '#f0f9ff',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => dispatch(setCurrentTab('doctors'))}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        mx: 'auto',
                        mb: 1,
                        borderRadius: '50%',
                        bgcolor: '#e0f2fe',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MedicalServicesIcon fontSize="small" />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {spec.name}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Stack>
    </Container>
  );
};
