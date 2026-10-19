import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  FormHelperText,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../../api/patients';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedDoctorForBooking } from '../../store/slices/profileSlice';
import { setCurrentTab } from '../../store/slices/uiSlice';
import { getDegreeLabel } from '../doctors/DoctorDirectoryPage';

const bookingSchema = z.object({
  patientId: z.string().min(1, 'Vui lòng chọn hồ sơ bệnh nhân khám'),
  doctorId: z.string().min(1, 'Vui lòng chọn bác sĩ khám'),
  appointmentDate: z.string().min(1, 'Vui lòng chọn ngày khám'),
  appointmentTime: z.string().min(1, 'Vui lòng chọn khung giờ khám'),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const BookingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { activePatientId, selectedDoctorForBooking } = useAppSelector(
    (state) => state.profile
  );

  const [bookingSuccessInfo, setBookingSuccessInfo] = useState<{
    message: string;
    patientName: string;
    doctorName: string;
    dateTime: string;
  } | null>(null);

  // Queries
  const { data: myPatientRes, isLoading: isMyPatientLoading } = useQuery({
    queryKey: ['patient', 'me'],
    queryFn: patientsApi.getMyPatient,
  });

  const { data: accessiblePatientsRes, isLoading: isAccessibleLoading } = useQuery({
    queryKey: ['user-patient-access', 'my-patients'],
    queryFn: patientsApi.getMyAccessiblePatients,
  });

  const { data: doctorsRes, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ['doctors', 'booking-list'],
    queryFn: () => doctorsApi.getDoctors({ page: 1, limit: 100 }),
  });

  const myPatient = myPatientRes?.data;
  const accessibleList = accessiblePatientsRes?.data || [];
  const doctors = doctorsRes?.data || [];

  // Form setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patientId: activePatientId || (myPatient?.id ? myPatient.id : ''),
      doctorId: selectedDoctorForBooking?.id || '',
      appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      appointmentTime: '08:30',
      notes: '',
    },
  });

  // Watch selected doctor and date to query shifts
  const watchedDoctorId = watch('doctorId');
  const watchedDate = watch('appointmentDate');

  // Query shifts for selected doctor and date
  const { data: shiftsRes, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['doctor-shifts', watchedDoctorId, watchedDate],
    queryFn: () => doctorsApi.getDoctorShifts(watchedDoctorId, watchedDate),
    enabled: Boolean(watchedDoctorId && watchedDate),
  });

  const availableShifts = shiftsRes?.data || [];

  // Sync active patient and selected doctor if changed outside
  useEffect(() => {
    if (activePatientId) {
      setValue('patientId', activePatientId);
    } else if (myPatient?.id) {
      setValue('patientId', myPatient.id);
    }
  }, [activePatientId, myPatient, setValue]);

  useEffect(() => {
    if (selectedDoctorForBooking?.id) {
      setValue('doctorId', selectedDoctorForBooking.id);
    }
  }, [selectedDoctorForBooking, setValue]);

  // Mutation to create appointment
  const createMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const combinedDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
      const isoDateString = combinedDateTime.toISOString();

      return appointmentsApi.createAppointment({
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: isoDateString,
        notes: data.notes?.trim() || undefined,
      });
    },
    onSuccess: (result, variables) => {
      let pName = 'Bản thân';
      if (myPatient && myPatient.id === variables.patientId) {
        pName = myPatient.fullName;
      } else {
        const found = accessibleList.find((a) => a.patient.id === variables.patientId);
        if (found) pName = `${found.patient.fullName} (Người thân)`;
      }

      const docFound = doctors.find((d) => d.id === variables.doctorId);
      const dName = docFound ? docFound.user.fullName : 'Bác sĩ chuyên khoa';

      setBookingSuccessInfo({
        message: result.message,
        patientName: pName,
        doctorName: dName,
        dateTime: `${variables.appointmentTime} - ${new Date(variables.appointmentDate).toLocaleDateString('vi-VN')}`,
      });

      dispatch(setSelectedDoctorForBooking(null));
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      reset();
    },
  });

  const onSubmit = (data: BookingFormData) => {
    createMutation.mutate(data);
  };

  const hasPatientProfiles = Boolean(myPatient?.id || accessibleList.length > 0);

  return (
    <Container maxWidth="md" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Title */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Đăng ký Đặt lịch khám bệnh
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Điền thông tin bệnh nhân, chọn bác sĩ và thời gian khám phù hợp
          </Typography>
        </Box>

        {/* Success Alert Card */}
        {bookingSuccessInfo && (
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 2.5,
              bgcolor: '#ecfdf5',
              border: '1px solid #a7f3d0',
            }}
          >
            <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
              <CheckCircleOutlinedIcon sx={{ fontSize: 52, color: 'success.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#065f46' }}>
                Yêu cầu đặt lịch đã được gửi thành công!
              </Typography>
              <Typography variant="body2" sx={{ color: '#047857', maxWidth: 620, lineHeight: 1.6 }}>
                {bookingSuccessInfo.message}
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: 500,
                  textAlign: 'left',
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Bệnh nhân:{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {bookingSuccessInfo.patientName}
                  </Box>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Bác sĩ khám:{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {bookingSuccessInfo.doctorName}
                  </Box>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Thời gian đăng ký:{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {bookingSuccessInfo.dateTime}
                  </Box>
                </Typography>
              </Paper>

              <Alert severity="info" sx={{ textAlign: 'left', width: '100%', maxWidth: 500 }}>
                <Typography variant="caption" sx={{ lineHeight: 1.4, display: 'block' }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>Cơ chế xử lý hệ thống:</Box> Lịch hẹn đang được chuyển đến hệ thống xếp hàng đợi (RabbitMQ) của phòng khám. Phòng khám sẽ duyệt và gửi thông báo xác nhận lịch qua Cổng bệnh nhân.
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => dispatch(setCurrentTab('appointments'))}
                  startIcon={<AssignmentTurnedInIcon />}
                >
                  Theo dõi tại Lịch hẹn của tôi
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setBookingSuccessInfo(null)}
                >
                  Đặt thêm lịch khám khác
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Main Booking Form */}
        {!bookingSuccessInfo && (
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: 3,
              bgcolor: '#ffffff',
              borderColor: '#e2e8f0',
            }}
          >
            {/* Warning if no patient profiles exist */}
            {!isMyPatientLoading && !isAccessibleLoading && !hasPatientProfiles && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Tài khoản chưa có hồ sơ bệnh nhân hợp lệ để đặt khám
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Tài khoản của bạn chưa được liên kết với hồ sơ bệnh nhân tại phòng khám và chưa có ủy quyền người thân. Vui lòng liên hệ quầy tiếp đón phòng khám để kích hoạt hồ sơ trước khi đặt khám.
                </Typography>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={3}>
                {/* 1. Chọn hồ sơ bệnh nhân */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOutlinedIcon color="primary" fontSize="small" />
                    1. Chọn người khám bệnh
                  </Typography>

                  <Controller
                    name="patientId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={Boolean(errors.patientId)}>
                        <InputLabel id="select-patient-label">Hồ sơ bệnh nhân</InputLabel>
                        <Select
                          labelId="select-patient-label"
                          label="Hồ sơ bệnh nhân"
                          {...field}
                          disabled={!hasPatientProfiles}
                        >
                          {myPatient && (
                            <MenuItem value={myPatient.id}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <PersonOutlinedIcon fontSize="small" color="primary" />
                                <Box>
                                  <Box component="span" sx={{ fontWeight: 600 }}>
                                    {myPatient.fullName}
                                  </Box>{' '}
                                  (Bản thân - Mã BN: {myPatient.patientCode})
                                </Box>
                              </Stack>
                            </MenuItem>
                          )}

                          {accessibleList.map((item) => (
                            <MenuItem key={item.patient.id} value={item.patient.id}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <FamilyRestroomIcon fontSize="small" color="secondary" />
                                <Box>
                                  <Box component="span" sx={{ fontWeight: 600 }}>
                                    {item.patient.fullName}
                                  </Box>{' '}
                                  (Người thân - Mã: {item.patient.patientCode})
                                </Box>
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.patientId && (
                          <FormHelperText>{errors.patientId.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    Chỉ các hồ sơ được backend xác thực quyền sở hữu hoặc ủy quyền mới hiển thị tại đây.
                  </Typography>
                </Box>

                <Divider />

                {/* 2. Chọn bác sĩ */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalServicesIcon color="primary" fontSize="small" />
                    2. Chọn bác sĩ chuyên khoa
                  </Typography>

                  <Controller
                    name="doctorId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={Boolean(errors.doctorId)}>
                        <InputLabel id="select-doctor-label">Bác sĩ phụ trách</InputLabel>
                        <Select
                          labelId="select-doctor-label"
                          label="Bác sĩ phụ trách"
                          {...field}
                          disabled={isDoctorsLoading}
                        >
                          {doctors.map((doc) => (
                            <MenuItem key={doc.id} value={doc.id}>
                              <Box>
                                <Box component="span" sx={{ fontWeight: 600 }}>
                                  {doc.user.fullName}
                                </Box>{' '}
                                - {getDegreeLabel(doc.degree)} (Khoa: {doc.specialty?.name})
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.doctorId && (
                          <FormHelperText>{errors.doctorId.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>

                <Divider />

                {/* 3. Chọn ngày & giờ khám */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonthIcon color="primary" fontSize="small" />
                    3. Chọn ngày & khung giờ khám mong muốn
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="appointmentDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="date"
                            fullWidth
                            label="Ngày khám"
                            slotProps={{ inputLabel: { shrink: true } }}
                            error={Boolean(errors.appointmentDate)}
                            helperText={errors.appointmentDate?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="appointmentTime"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth size="small" error={Boolean(errors.appointmentTime)}>
                            <InputLabel id="select-time-label">Khung giờ dự kiến</InputLabel>
                            <Select
                              labelId="select-time-label"
                              label="Khung giờ dự kiến"
                              {...field}
                            >
                              <MenuItem value="08:00">08:00 - 08:30 (Sáng)</MenuItem>
                              <MenuItem value="08:30">08:30 - 09:00 (Sáng)</MenuItem>
                              <MenuItem value="09:00">09:00 - 09:30 (Sáng)</MenuItem>
                              <MenuItem value="09:30">09:30 - 10:00 (Sáng)</MenuItem>
                              <MenuItem value="10:00">10:00 - 10:30 (Sáng)</MenuItem>
                              <MenuItem value="10:30">10:30 - 11:00 (Sáng)</MenuItem>
                              <MenuItem value="13:30">13:30 - 14:00 (Chiều)</MenuItem>
                              <MenuItem value="14:00">14:00 - 14:30 (Chiều)</MenuItem>
                              <MenuItem value="14:30">14:30 - 15:00 (Chiều)</MenuItem>
                              <MenuItem value="15:00">15:00 - 15:30 (Chiều)</MenuItem>
                              <MenuItem value="15:30">15:30 - 16:00 (Chiều)</MenuItem>
                              <MenuItem value="16:00">16:00 - 16:30 (Chiều)</MenuItem>
                            </Select>
                            {errors.appointmentTime && (
                              <FormHelperText>{errors.appointmentTime.message}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>

                  {/* Doctor shift hint for that day */}
                  {watchedDoctorId && watchedDate && (
                    <Box sx={{ mt: 1.5 }}>
                      {isShiftsLoading ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Đang kiểm tra ca làm việc của bác sĩ...
                        </Typography>
                      ) : availableShifts.length > 0 ? (
                        <Alert severity="success" sx={{ py: 0.5, px: 1.5, fontSize: '0.8rem' }}>
                          Ca trực của bác sĩ trong ngày: {availableShifts.map((s) => `${s.startTime} - ${s.endTime}`).join(', ')}
                        </Alert>
                      ) : (
                        <Alert severity="warning" sx={{ py: 0.5, px: 1.5, fontSize: '0.8rem' }}>
                          Bác sĩ chưa có ca trực đăng ký trong ngày {new Date(watchedDate).toLocaleDateString('vi-VN')}. Lịch hẹn của bạn sẽ được tiếp nhận ở chế độ chờ xếp ca.
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* 4. Triệu chứng / Lý do khám */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="primary" fontSize="small" />
                    4. Triệu chứng & Lý do khám bệnh
                  </Typography>

                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Mô tả tóm tắt triệu chứng bạn đang gặp phải (ví dụ: đau đầu, ho sốt 2 ngày, khám tổng quát định kỳ...)"
                        error={Boolean(errors.notes)}
                        helperText={errors.notes?.message || 'Giúp bác sĩ và điều dưỡng phân luồng chuẩn bị tốt hơn trước buổi khám'}
                      />
                    )}
                  />
                </Box>

                {/* Architecture notice regarding event-driven queuing */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <InfoOutlinedIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.25 }}>
                        Quy trình xử lý lịch hẹn tại phòng khám:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                        Hệ thống backend sử dụng hàng đợi thông điệp RabbitMQ bất đồng bộ. Khi bấm Đăng ký, yêu cầu sẽ được chuyển đến bộ phận tiếp nhận để xếp thứ tự khám. Bạn có thể theo dõi trạng thái cập nhật tại mục "Lịch hẹn của tôi".
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {createMutation.isError && (
                  <Alert severity="error">
                    Đăng ký đặt lịch thất bại. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.
                  </Alert>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={createMutation.isPending || !hasPatientProfiles}
                  startIcon={
                    createMutation.isPending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <CalendarMonthIcon />
                    )
                  }
                  sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700 }}
                >
                  {createMutation.isPending ? 'Đang gửi yêu cầu đặt lịch...' : 'Xác nhận Đặt lịch khám'}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};
