import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '../../api/patients';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveProfile } from '../../store/slices/profileSlice';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { activePatientId } = useAppSelector((state) => state.profile);

  // My patient profile
  const {
    data: myPatientRes,
    isLoading: isMyPatientLoading,
  } = useQuery({
    queryKey: ['patient', 'me'],
    queryFn: patientsApi.getMyPatient,
  });

  // Accessible patients list (family members)
  const {
    data: accessibleRes,
    isLoading: isAccessibleLoading,
  } = useQuery({
    queryKey: ['user-patient-access', 'my-patients'],
    queryFn: patientsApi.getMyAccessiblePatients,
  });

  const patient = myPatientRes?.data;
  const accessibleList = accessibleRes?.data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={4}>
        {/* Title */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Hồ sơ y tế & Danh sách người thân
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Quản lý thông tin định danh y tế cá nhân và các hồ sơ người thân được cấp quyền ủy quyền
          </Typography>
        </Box>

        {/* SECTION 1: Personal Patient Profile */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
            1. Hồ sơ bệnh nhân của bạn
          </Typography>

          {isMyPatientLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : !patient ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 2.5,
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
              }}
            >
              <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <InfoOutlinedIcon fontSize="large" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Tài khoản chưa được liên kết với hồ sơ bệnh án
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  Hệ thống không tìm thấy mã bệnh nhân tương ứng với tài khoản này (mã lỗi 404 từ máy chủ). 
                  Theo quy định y tế, hồ sơ bệnh nhân chỉ được tạo và liên kết trực tiếp bởi nhân viên tiếp đón tại phòng khám khi bạn đến đăng ký hoặc khám bệnh trực tiếp.
                </Typography>

                <Alert severity="info" sx={{ textAlign: 'left', width: '100%', mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Hướng dẫn liên kết hồ sơ:
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    1. Mang theo Căn cước công dân hoặc thẻ BHYT đến quầy Lễ tân / Tiếp đón bệnh viện.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    2. Cung cấp email tài khoản của bạn:{' '}
                    <Box component="span" sx={{ fontWeight: 600 }}>{user?.email}</Box>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    3. Nhân viên y tế sẽ xác minh và gán mã bệnh nhân vào tài khoản của bạn.
                  </Typography>
                </Alert>
              </Stack>
            </Paper>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 2.5,
                bgcolor: '#ffffff',
                borderColor: '#cbd5e1',
              }}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }} sx={{ borderRight: { md: '1px solid #f1f5f9' }, pr: { md: 3 } }}>
                  <Stack spacing={2} sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PersonOutlinedIcon sx={{ fontSize: 40 }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {patient.fullName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Mã BN:{' '}
                        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace' }}>
                          {patient.patientCode}
                        </Box>
                      </Typography>
                    </Box>

                    {activePatientId === patient.id ? (
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Đang chọn làm hồ sơ mặc định
                        </Typography>
                      </Stack>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          dispatch(
                            setActiveProfile({
                              patientId: patient.id,
                              patientName: patient.fullName,
                              patientCode: patient.patientCode,
                              isRelative: false,
                            })
                          )
                        }
                      >
                        Chọn hồ sơ này để đặt khám
                      </Button>
                    )}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                        Ngày sinh
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.dateOfBirth
                          ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN')
                          : 'Chưa cập nhật'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                        Giới tính
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.gender === 'MALE'
                          ? 'Nam'
                          : patient.gender === 'FEMALE'
                          ? 'Nữ'
                          : 'Khác'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                        Số điện thoại
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.phone || 'Chưa cập nhật'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                        Số CCCD / CMND
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {patient.identityNumber || 'Chưa đăng ký'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                        Mã số thẻ Bảo hiểm Y tế (BHYT)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'primary.dark' }}>
                        {patient.insuranceCode || 'Không có BHYT'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                        Địa chỉ cư trú
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {patient.address || 'Chưa cập nhật'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                        Tiền sử bệnh lý & Dị ứng
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          bgcolor: '#f8fafc',
                          p: 1.5,
                          borderRadius: 1.5,
                          border: '1px solid #f1f5f9',
                          mt: 0.5,
                        }}
                      >
                        {patient.medicalHistory || 'Chưa ghi nhận tiền sử bệnh lý đặc biệt'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>

        <Divider />

        {/* SECTION 2: Authorized Family Members */}
        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                2. Danh sách hồ sơ người thân được ủy quyền
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Chỉ các hồ sơ được backend xác thực quyền truy cập mới được hiển thị và cho phép đặt lịch hộ.
              </Typography>
            </Box>
          </Stack>

          {isAccessibleLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : accessibleList.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: '#f8fafc',
                borderRadius: 2,
              }}
            >
              <FamilyRestroomIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Chưa có hồ sơ người thân nào được liên kết
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', maxWidth: 500, mx: 'auto', mt: 0.5 }}>
                Để được ủy quyền đặt lịch hoặc theo dõi thông tin người thân (con nhỏ, cha mẹ), vui lòng liên hệ quầy hành chính bệnh viện để lập giấy ủy quyền hợp lệ.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {accessibleList.map((item) => {
                const isSelected = activePatientId === item.patient.id;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: isSelected ? 'secondary.main' : '#e2e8f0',
                        bgcolor: isSelected ? '#f0fdfa' : '#ffffff',
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  bgcolor: 'secondary.light',
                                  color: 'secondary.dark',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <FamilyRestroomIcon fontSize="small" />
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {item.patient.fullName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Mã: {item.patient.patientCode}
                                </Typography>
                              </Box>
                            </Stack>
                            {isSelected && (
                              <CheckCircleIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                            )}
                          </Stack>

                          <Divider />

                          <Stack spacing={0.5} sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            <Box>
                              Giới tính:{' '}
                              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {item.patient.gender === 'MALE' ? 'Nam' : 'Nữ'}
                              </Box>
                            </Box>
                            <Box>
                              Ngày sinh:{' '}
                              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {item.patient.dateOfBirth
                                  ? new Date(item.patient.dateOfBirth).toLocaleDateString('vi-VN')
                                  : 'Chưa cập nhật'}
                              </Box>
                            </Box>
                            <Box>
                              SĐT liên hệ:{' '}
                              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {item.patient.phone}
                              </Box>
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant={isSelected ? 'contained' : 'outlined'}
                              color="secondary"
                              fullWidth
                              onClick={() => {
                                dispatch(
                                  setActiveProfile({
                                    patientId: item.patient.id,
                                    patientName: item.patient.fullName,
                                    patientCode: item.patient.patientCode,
                                    isRelative: true,
                                  })
                                );
                              }}
                            >
                              {isSelected ? 'Đang chọn hồ sơ này' : 'Chọn đặt khám'}
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Stack>
    </Container>
  );
};
