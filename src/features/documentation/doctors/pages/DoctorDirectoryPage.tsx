import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Paper,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '@/api/endpoints/doctors.api';
import { DoctorDegree, DoctorDTO } from '@/types/index';

import { getDegreeLabel } from '../doctorLabels';
export { getDegreeLabel } from '../doctorLabels';
import { BookingPage } from '@/features/appointments/pages/BookingPage';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

export const DoctorDirectoryPage: React.FC = () => {
  const [bookingDoctor, setBookingDoctor] = useState<DoctorDTO | null>(null);
  const bookingPanel = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (bookingDoctor && window.matchMedia("(max-width: 899px)").matches) {
      bookingPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [bookingDoctor]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | ''>('');
  const [selectedDegree, setSelectedDegree] = useState<DoctorDegree | ''>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState(8);

  // Shifts Modal State
  const [selectedDoctorForShifts, setSelectedDoctorForShifts] = useState<DoctorDTO | null>(null);
  const [shiftDate, setShiftDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Fetch Specialties
  const { data: specialtiesRes } = useQuery({
    queryKey: ['specialties', 'all'],
    queryFn: doctorsApi.getAllSpecialties,
  });

  // Fetch Doctors with filtering and pagination
  const { data: doctorsRes, isLoading, error } = useQuery({
    queryKey: [
      'doctors',
      {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        specialtyId: selectedSpecialtyId !== '' ? Number(selectedSpecialtyId) : undefined,
        degree: selectedDegree !== '' ? selectedDegree : undefined,
      },
    ],
    queryFn: () =>
      doctorsApi.getDoctors({
        page: currentPage,
        limit: pageSize,
        search: searchTerm ? searchTerm.trim() : undefined,
        specialtyId: selectedSpecialtyId !== '' ? Number(selectedSpecialtyId) : undefined,
        degree: selectedDegree !== '' ? selectedDegree : undefined,
      }),
  });

  // Fetch Doctor Shifts when modal opens
  const { data: shiftsRes, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['doctor-shifts', selectedDoctorForShifts?.id, shiftDate],
    queryFn: () =>
      doctorsApi.getDoctorShifts(selectedDoctorForShifts!.id, shiftDate),
    enabled: Boolean(selectedDoctorForShifts),
  });

  const doctors = doctorsRes?.data || [];
  const pagination = doctorsRes?.pagination;
  React.useEffect(() => {
    if (pagination && currentPage > Math.max(1, pagination.totalPages)) setCurrentPage(Math.max(1, pagination.totalPages));
  }, [pagination, currentPage]);
  const specialties = specialtiesRes?.data || [];
  const shifts = shiftsRes?.data || [];

  const handleBookWithDoctor = (doctor: DoctorDTO) => {
    setBookingDoctor(doctor);
  };

  return (
    <Container maxWidth={bookingDoctor ? "xl" : "lg"} sx={{ py: 3.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: bookingDoctor ? { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(360px, 480px)' } : 'minmax(0, 1fr)', gap: 3, alignItems: 'start' }}>
      <Stack spacing={3.5}>
        {/* Title */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Đội ngũ Bác sĩ & Chuyên khoa
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Tra cứu thông tin chuyên môn, học vị và lịch ca làm việc của đội ngũ y bác sĩ tại phòng khám
          </Typography>
        </Box>

        {/* Filter Controls Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: '#ffffff',
            borderColor: '#e2e8f0',
          }}
        >
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            {/* Search Input */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Tìm tên bác sĩ..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
                  },
                }}
              />
            </Grid>

            {/* Specialty Select */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="specialty-label">Chuyên khoa</InputLabel>
                <Select
                  labelId="specialty-label"
                  value={selectedSpecialtyId}
                  label="Chuyên khoa"
                  onChange={(e) => {
                    setSelectedSpecialtyId(e.target.value as number | '');
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">Tất cả chuyên khoa</MenuItem>
                  {specialties.map((spec) => (
                    <MenuItem key={spec.id} value={spec.id}>
                      {spec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Degree Select */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="degree-label">Học vị / Học hàm</InputLabel>
                <Select
                  labelId="degree-label"
                  value={selectedDegree}
                  label="Học vị / Học hàm"
                  onChange={(e) => {
                    setSelectedDegree(e.target.value as DoctorDegree | '');
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">Tất cả học vị</MenuItem>
                  <MenuItem value="MD">Bác sĩ Y khoa (MD)</MenuItem>
                  <MenuItem value="MASTER">Thạc sĩ Y học (MASTER)</MenuItem>
                  <MenuItem value="PHD">Tiến sĩ Y học (PHD)</MenuItem>
                  <MenuItem value="ASSOCIATE_PROFESSOR">Phó Giáo sư</MenuItem>
                  <MenuItem value="PROFESSOR">Giáo sư</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Reset Filters */}
            <Grid size={{ xs: 12, sm: 6, md: 1 }}>
              <Button
                variant="text"
                size="small"
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecialtyId('');
                  setSelectedDegree('');
                  setCurrentPage(1);
                }}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Đặt lại
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Doctor List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fff' }}>
            <Typography color="error" variant="body1">
              Không thể tải danh sách bác sĩ. Vui lòng kiểm tra kết nối tới máy chủ phòng khám.
            </Typography>
          </Paper>
        ) : doctors.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 5,
              textAlign: 'center',
              bgcolor: '#f8fafc',
              borderRadius: 2.5,
            }}
          >
            <PersonIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Không tìm thấy bác sĩ phù hợp
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bớt tiêu chí lọc chuyên khoa.
            </Typography>
          </Paper>
        ) : (
          <Box>
            <Grid container spacing={3}>
              {doctors.map((doc) => (
                <Grid size={{ xs: 12, sm: 6, md: bookingDoctor ? 12 : 6, lg: bookingDoctor ? 12 : 6 }} key={doc.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2.5,
                      transition: 'border-color 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-start', mb: 2 }}>
                        {/* Avatar */}
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: '#e0f2fe',
                            color: 'primary.dark',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {doc.user.avatar ? (
                            <Box
                              component="img"
                              src={doc.user.avatar}
                              alt={doc.user.fullName}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <PersonIcon sx={{ fontSize: 36 }} />
                          )}
                        </Box>

                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {doc.user.fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 600, display: 'block', mt: 0.25 }}>
                            {getDegreeLabel(doc.degree)}
                          </Typography>

                          {/* Specialty metadata */}
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                            <MedicalServicesIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              {doc.specialty?.name || 'Đa khoa'}
                            </Typography>
                            {doc.yearsOfExperience && (
                              <Box component="span" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                · {doc.yearsOfExperience} năm kinh nghiệm
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      {/* Bio */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.85rem',
                          mb: 2,
                          flexGrow: 1,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {doc.bio || 'Bác sĩ chuyên khoa giàu kinh nghiệm trong chẩn đoán và điều trị bệnh nhân.'}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Actions */}
                      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AccessTimeIcon fontSize="small" />}
                          onClick={() => {
                            setSelectedDoctorForShifts(doc);
                            setShiftDate(new Date().toISOString().split('T')[0]);
                          }}
                        >
                          Xem ca trực
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CalendarMonthIcon fontSize="small" />}
                          onClick={() => handleBookWithDoctor(doc)}
                        >
                          Đặt khám
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>


          </Box>
        )}

        {pagination && !error && (
          <TablePagination component="div" count={pagination.total} page={Math.min(currentPage - 1, Math.max(0, pagination.totalPages - 1))}
            rowsPerPage={pageSize} rowsPerPageOptions={[4, 8, 16, 24]}
            onPageChange={(_, page) => setCurrentPage(page + 1)}
            onRowsPerPageChange={event => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
            labelRowsPerPage="Số bác sĩ mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} bác sĩ`}
            getItemAriaLabel={type => ({ first: 'Trang đầu', last: 'Trang cuối', previous: 'Trang trước', next: 'Trang sau' })[type]}
            showFirstButton showLastButton
            sx={{ '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'center', px: 0 }, '& .MuiTablePagination-spacer': { display: 'none' } }} />
        )}

        {/* Modal: Doctor Shifts */}
        <Dialog
          open={Boolean(selectedDoctorForShifts)}
          onClose={() => setSelectedDoctorForShifts(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            Lịch ca làm việc - {selectedDoctorForShifts?.user?.fullName}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Chuyên khoa: {selectedDoctorForShifts?.specialty?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {getDegreeLabel(selectedDoctorForShifts?.degree || 'MD')}
                </Typography>
              </Paper>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                  Chọn ngày muốn tra cứu ca trực:
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              {/* Notice regarding shifts vs slots */}
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fffbeb', borderColor: '#fef3c7', borderRadius: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <InfoOutlinedIcon sx={{ color: '#d97706', fontSize: 18, mt: 0.25 }} />
                  <Typography variant="caption" sx={{ color: '#92400e', lineHeight: 1.4 }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>Lưu ý y tế:</Box> Ca làm việc thể hiện thời gian bác sĩ trực tại phòng khám, không phải danh sách số thứ tự khám trống. Giờ khám chính xác sẽ do hệ thống phân luồng và phòng khám xác nhận.
                  </Typography>
                </Stack>
              </Paper>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Ca trực ngày {new Date(shiftDate).toLocaleDateString('vi-VN')}:
                </Typography>

                {isShiftsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : shifts.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 2, textAlign: 'center' }}>
                    Bác sĩ không có ca trực nào được ghi nhận trong ngày này.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {shifts.map((shift) => (
                      <Paper
                        key={shift.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          bgcolor: '#f0f9ff',
                          borderColor: '#bae6fd',
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" sx={{ color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {shift.startTime} - {shift.endTime}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 600 }}>
                          Ca trực khả dụng
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedDoctorForShifts(null)} color="inherit">
              Đóng
            </Button>
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={() => {
                if (selectedDoctorForShifts) {
                  handleBookWithDoctor(selectedDoctorForShifts);
                  setSelectedDoctorForShifts(null);
                }
              }}
            >
              Đặt lịch với bác sĩ này
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
      {bookingDoctor && (
        <Box ref={bookingPanel} component="aside" aria-label="Đăng ký khám" sx={{ position: { md: 'sticky' }, top: 88, maxHeight: { md: 'calc(100vh - 104px)' }, overflowY: { md: 'auto' }, scrollMarginTop: 88, minWidth: 0 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Đăng ký khám</Typography>
            <IconButton aria-label="Đóng đăng ký khám" onClick={() => setBookingDoctor(null)}><CloseIcon /></IconButton>
          </Stack>
          <BookingPage key={bookingDoctor.id} doctor={bookingDoctor} embedded />
        </Box>
      )}
      </Box>
    </Container>
  );
};
