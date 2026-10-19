import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/appointments';

export const ExaminationsPage: React.FC = () => {
  // Query completed bookings from patient's account
  const { data: bookingsRes } = useQuery({
    queryKey: ['appointments', 'my-bookings', { page: 1, limit: 10, status: 'COMPLETED' }],
    queryFn: () => appointmentsApi.getMyBookings({ page: 1, limit: 10, status: 'COMPLETED' }),
  });

  const completedBookings = bookingsRes?.data?.data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Kết quả Khám bệnh & Chẩn đoán Y khoa
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Tra cứu kết quả khám lâm sàng, mã bệnh ICD-10 và lịch hẹn tái khám của bác sĩ
          </Typography>
        </Box>

        {/* Security & API Status Banner */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: '#fffbeb',
            borderColor: '#fde68a',
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
            <ShieldIcon sx={{ fontSize: 32, color: '#d97706', mt: 0.25 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#92400e' }}>
                Trạng thái bảo mật dữ liệu bệnh án điện tử (Medical Records Access Control)
              </Typography>
              <Typography variant="body2" sx={{ color: '#78350f', mt: 0.5, lineHeight: 1.6 }}>
                Hệ thống backend hiện đang có các endpoint kết quả khám bệnh{' '}
                <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  GET /appointments/:id/examination
                </Box>{' '}
                và{' '}
                <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  GET /examinations
                </Box>{' '}
                nhưng các endpoint này <strong>chưa triển khai xác thực kiểm tra quyền sở hữu của bệnh nhân (patient ownership authorization)</strong>.
              </Typography>
              <Typography variant="body2" sx={{ color: '#78350f', mt: 1, lineHeight: 1.6 }}>
                Để tuân thủ nghiêm ngặt quy định bảo mật hồ sơ bệnh án cá nhân (HIPAA/Bộ Y tế), Cổng bệnh nhân <strong>tuyệt đối không truy vấn dữ liệu thô khi chưa có cơ chế kiểm tra quyền truy cập ở tầng máy chủ</strong>. Dữ liệu bệnh án chi tiết sẽ hiển thị tự động ngay khi backend hoàn tất bảo vệ route.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Specifications required from Backend */}
        <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CodeIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Đặc tả kỹ thuật đề xuất cho Backend NestJS:
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      1. Endpoint truy vấn kết quả khám an toàn:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      GET /patients/me/examinations
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Chỉ cho phép người dùng đã xác thực (Bearer JWT) truy xuất các hồ sơ bệnh án thuộc về chính mình hoặc người thân đã được ủy quyền hợp pháp.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      2. Cấu trúc trường dữ liệu ExaminationDTO:
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#334155', display: 'block', mt: 0.5 }}>
                      {'{'} diagnosis: string, clinicalNotes?: string, icd10Code?: string, followUpDate?: string, examinedAt: string, doctor: DoctorDTO {'}'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        {/* Completed Visits List from my-bookings */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
            Lịch sử các lần khám bệnh đã hoàn thành ({completedBookings.length})
          </Typography>

          {completedBookings.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: '#f8fafc',
                borderRadius: 2,
              }}
            >
              <HistoryEduIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Chưa ghi nhận lượt khám đã hoàn tất nào
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Khi bạn hoàn tất buổi khám tại phòng khám, lượt khám sẽ được chuyển trạng thái "Hoàn thành" (COMPLETED).
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {completedBookings.map((b) => (
                <Paper
                  key={b.id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderColor: '#cbd5e1',
                  }}
                >
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <Stack spacing={0.75}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Khám cùng: {b.doctor?.user?.fullName || 'Bác sĩ chuyên khoa'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                            · Khoa: {b.doctor?.specialty?.name || 'Đa khoa'}
                          </Typography>
                        </Stack>

                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Thời gian khám: {new Date(b.appointmentDate).toLocaleString('vi-VN')}
                        </Typography>

                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Bệnh nhân: {b.patient?.fullName} (Mã BN: {b.patient?.patientCode})
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Chip
                        icon={<LockIcon sx={{ fontSize: '13px !important' }} />}
                        label="Chờ kích hoạt API bệnh án"
                        size="small"
                        sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
};
