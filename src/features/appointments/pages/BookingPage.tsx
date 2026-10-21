import { PatientProfileDialog } from "@/features/patients/components/PatientProfileDialog";
import type { PatientRecipient } from "@/features/patients/schemas/patient.schema";
import React, { useState, useEffect } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsApi } from "@/api/endpoints/doctors.api";
import { appointmentsApi } from "@/api/endpoints/appointments.api";
import { useAppDispatch, useAppSelector } from "@/store/index";
import { setSelectedDoctorForBooking } from "@/store/slices/profileSlice";
import { setCurrentTab } from "@/store/slices/uiSlice";
import { getDegreeLabel } from "@/features/documentation/doctors/doctorLabels";
import {
  useCreatePatient,
  useCreatePatientForMySelf,
  useMyPatient,
  useAccessiblePatients,
  useUpdatePatient,
} from "@/features/patients/hooks/usePatientProfiles";

const bookingSchema = z.object({
  patientId: z.string().min(1, "Vui lòng chọn hồ sơ bệnh nhân khám"),
  doctorId: z.string().min(1, "Vui lòng chọn bác sĩ khám"),
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày khám hợp lệ")
    .refine(
      (value) =>
        value >= clinicDate() &&
        Number.isFinite(bookingInstant(value, "00:00").getTime()),
      "Ngày khám không được nằm trong quá khứ",
    ),
  appointmentTime: z.string().min(1, "Vui lòng chọn khung giờ khám"),
  notes: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

import type { DoctorDTO } from "@/types";
import { BookingTimeSlots } from "../components/BookingTimeSlots";
import {
  buildBookingSlots,
  bookingInstant,
  clinicDate,
} from "../utils/bookingSlots";
import { useDoctorSchedule } from "../hooks/useDoctorSchedule";

interface BookingPageProps {
  doctor?: DoctorDTO;
  embedded?: boolean;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  doctor,
  embedded = false,
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const [recipient, setRecipient] = useState<PatientRecipient>("self");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { activePatientId, selectedDoctorForBooking } = useAppSelector(
    (state) => state.profile,
  );

  const [bookingSuccessInfo, setBookingSuccessInfo] = useState<{
    message: string;
    patientName: string;
    doctorName: string;
    dateTime: string;
  } | null>(null);
  const createFamilyProfile = useCreatePatient();
  const createSelfProfile = useCreatePatientForMySelf();
  const updateProfile = useUpdatePatient();
  const { data: myPatientRes, isLoading: isMyPatientLoading } = useMyPatient();
  const { data: accessiblePatientsRes, isLoading: isAccessibleLoading } =
    useAccessiblePatients();

  const { data: doctorsRes, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ["doctors", "booking-list"],
    queryFn: () => doctorsApi.getDoctors({ page: 1, limit: 100 }),
  });

  const myPatient = myPatientRes;
  const accessibleList = (accessiblePatientsRes?.data || []).filter(
    (item) => item.patient.id !== myPatient?.id,
  );
  const doctors = doctor ? [doctor] : doctorsRes?.data || [];

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
      patientId: activePatientId || (myPatient?.id ? myPatient.id : ""),
      doctorId: doctor?.id || selectedDoctorForBooking?.id || "",
      appointmentDate: clinicDate(new Date(Date.now() + 86400000)),
      appointmentTime: "",
      notes: "",
    },
  });

  // Watch selected doctor and date to query shifts
  const selectedPatientId = watch("patientId");
  const watchedDoctorId = watch("doctorId");
  const watchedDate = watch("appointmentDate");
  const watchedTime = watch("appointmentTime");

  // Query shifts for selected doctor and date
  const {
    data: shiftsRes,
    isFetching: isShiftsLoading,
    isError: isShiftsError,
    refetch: refetchShifts,
  } = useQuery({
    queryKey: ["doctor-shifts", watchedDoctorId, watchedDate],
    queryFn: () => doctorsApi.getDoctorShifts(watchedDoctorId, watchedDate),
    enabled: Boolean(watchedDoctorId && watchedDate),
  });

  const availableShifts = shiftsRes?.data || [];
  const chosenDoctor = doctors.find((item) => item.id === watchedDoctorId);
  const schedule = useDoctorSchedule(
    watchedDoctorId,
    chosenDoctor?.user.fullName ?? "",
    watchedDate,
  );
  const slots = buildBookingSlots(
    watchedDoctorId,
    watchedDate,
    availableShifts,
    schedule.data ?? [],
  );
  const slotsReady =
    Boolean(watchedDoctorId && watchedDate && chosenDoctor) &&
    !isShiftsLoading &&
    !isShiftsError &&
    schedule.isSuccess &&
    !schedule.isFetching;

  useEffect(() => {
    setValue("appointmentTime", "");
  }, [watchedDoctorId, watchedDate, setValue]);

  useEffect(() => {
    if (
      slotsReady &&
      watchedTime &&
      !slots.some(
        (slot) => slot.time === watchedTime && slot.status === "available",
      )
    ) {
      setValue("appointmentTime", "", { shouldValidate: true });
    }
  }, [slotsReady, slots, watchedTime, setValue]);

  // Sync active patient and selected doctor if changed outside
  useEffect(() => {
    if (activePatientId) {
      setValue("patientId", activePatientId);
    } else if (myPatient?.id) {
      setValue("patientId", myPatient.id);
    }
  }, [activePatientId, myPatient, setValue]);

  useEffect(() => {
    if (selectedPatientId)
      setRecipient(selectedPatientId === myPatient?.id ? "self" : "family");
  }, [selectedPatientId, myPatient?.id]);

  useEffect(() => {
    const selected = doctor ?? selectedDoctorForBooking;
    if (selected?.id) setValue("doctorId", selected.id);
  }, [doctor, selectedDoctorForBooking, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      if (
        !slotsReady ||
        !slots.some(
          (slot) =>
            slot.time === data.appointmentTime && slot.status === "available",
        )
      ) {
        throw new Error("Khung giờ không còn khả dụng. Vui lòng chọn lại.");
      }
      const latest = await schedule.refetch();
      if (
        latest.error ||
        !latest.data ||
        !buildBookingSlots(
          data.doctorId,
          data.appointmentDate,
          availableShifts,
          latest.data,
        ).some(
          (slot) =>
            slot.time === data.appointmentTime && slot.status === "available",
        )
      ) {
        throw new Error("Khung giờ không còn khả dụng. Vui lòng chọn lại.");
      }
      const combinedDateTime = bookingInstant(
        data.appointmentDate,
        data.appointmentTime,
      );
      const isoDateString = combinedDateTime.toISOString();

      return appointmentsApi.createAppointment({
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: isoDateString,
        notes: data.notes?.trim() || undefined,
      });
    },
    onSuccess: (result, variables) => {
      let pName = "Bản thân";
      if (myPatient && myPatient.id === variables.patientId) {
        pName = myPatient.fullName;
      } else {
        const found = accessibleList.find(
          (a) => a.patient.id === variables.patientId,
        );
        if (found) pName = `${found.patient.fullName} (Người thân)`;
      }

      const docFound = doctors.find((d) => d.id === variables.doctorId);
      const dName = docFound ? docFound.user.fullName : "Bác sĩ chuyên khoa";

      setBookingSuccessInfo({
        message: result.message,
        patientName: pName,
        doctorName: dName,
        dateTime: `${variables.appointmentTime} - ${new Date(variables.appointmentDate).toLocaleDateString("vi-VN")}`,
      });

      dispatch(setSelectedDoctorForBooking(null));
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      reset();
    },
  });

  const onSubmit = (data: BookingFormData) => {
    createMutation.mutate(data);
  };

  const hasPatientProfiles = Boolean(
    myPatient?.id || accessibleList.length > 0,
  );

  return (
    <Container
      maxWidth={embedded ? false : "md"}
      disableGutters={embedded}
      sx={{ py: embedded ? 0 : 3.5 }}
    >
      <Stack spacing={3.5}>
        {/* Title */}
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Đăng ký Đặt lịch khám bệnh
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
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
              bgcolor: "#ecfdf5",
              border: "1px solid #a7f3d0",
            }}
          >
            <Stack
              spacing={2}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <CheckCircleOutlinedIcon
                sx={{ fontSize: 52, color: "success.main" }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#065f46" }}
              >
                Yêu cầu đặt lịch đã được gửi thành công!
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#047857", maxWidth: 620, lineHeight: 1.6 }}
              >
                {bookingSuccessInfo.message}
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "#ffffff",
                  borderRadius: 2,
                  width: "100%",
                  maxWidth: 500,
                  textAlign: "left",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                >
                  Bệnh nhân:{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {bookingSuccessInfo.patientName}
                  </Box>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                >
                  Bác sĩ khám:{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {bookingSuccessInfo.doctorName}
                  </Box>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  Thời gian đăng ký:{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {bookingSuccessInfo.dateTime}
                  </Box>
                </Typography>
              </Paper>

              <Alert
                severity="info"
                sx={{ textAlign: "left", width: "100%", maxWidth: 500 }}
              >
                <Typography
                  variant="caption"
                  sx={{ lineHeight: 1.4, display: "block" }}
                >
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    Chờ phòng khám xác nhận:
                  </Box>{" "}
                  Phòng khám đang tiếp nhận yêu cầu và sẽ gửi thông báo xác nhận
                  lịch qua Cổng bệnh nhân.
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => dispatch(setCurrentTab("appointments"))}
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
              p: embedded ? 2 : { xs: 2.5, md: 4 },
              borderRadius: 3,
              bgcolor: "#ffffff",
              borderColor: "#e2e8f0",
            }}
          >
            {/* Warning if no patient profiles exist */}
            {!isMyPatientLoading &&
              !isAccessibleLoading &&
              !hasPatientProfiles && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    Tài khoản chưa có hồ sơ bệnh nhân hợp lệ để đặt khám
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Bạn chưa có hồ sơ để đặt lịch. Chọn chính mình hoặc người
                    nhà bên dưới để mở biểu mẫu tạo hồ sơ. Chức năng lưu đang
                    chờ API; hiện bạn có thể liên hệ quầy tiếp đón để được hỗ
                    trợ.
                  </Typography>
                </Alert>
              )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={3}>
                {/* 1. Chọn hồ sơ bệnh nhân */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonOutlinedIcon color="primary" fontSize="small" />
                    1. Chọn người khám bệnh
                  </Typography>

                  <ToggleButtonGroup
                    exclusive
                    value={recipient}
                    size="small"
                    sx={{ mb: 2 }}
                    aria-label="Đặt lịch cho ai"
                    onChange={(_, value: PatientRecipient | null) => {
                      if (!value) return;
                      setRecipient(value);
                      setValue(
                        "patientId",
                        value === "self"
                          ? (myPatient?.id ?? "")
                          : (accessibleList[0]?.patient.id ?? ""),
                        { shouldValidate: false },
                      );
                    }}
                  >
                    <ToggleButton value="self">
                      <PersonOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                      Chính mình
                    </ToggleButton>
                    <ToggleButton value="family">
                      <FamilyRestroomIcon fontSize="small" sx={{ mr: 1 }} />
                      Người nhà
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {((recipient === "self" && !myPatient) ||
                    (recipient === "family" &&
                      accessibleList.length === 0)) && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {recipient === "self"
                        ? "Bạn chưa có hồ sơ cá nhân."
                        : "Bạn chưa có hồ sơ người nhà được liên kết."}
                    </Alert>
                  )}
                  <Controller
                    name="patientId"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                        error={Boolean(errors.patientId)}
                      >
                        <InputLabel id="select-patient-label">
                          Hồ sơ bệnh nhân
                        </InputLabel>
                        <Select
                          labelId="select-patient-label"
                          label="Hồ sơ bệnh nhân"
                          {...field}
                          disabled={
                            recipient === "self"
                              ? !myPatient
                              : accessibleList.length === 0
                          }
                        >
                          {recipient === "self" && myPatient && (
                            <MenuItem value={myPatient.id}>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center" }}
                              >
                                <PersonOutlinedIcon
                                  fontSize="small"
                                  color="primary"
                                />
                                <Box>
                                  <Box
                                    component="span"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {myPatient.fullName}
                                  </Box>{" "}
                                  (Bản thân - Mã BN: {myPatient.patientCode})
                                </Box>
                              </Stack>
                            </MenuItem>
                          )}

                          {recipient === "family" &&
                            accessibleList.map((item) => (
                              <MenuItem
                                key={item.patient.id}
                                value={item.patient.id}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{ alignItems: "center" }}
                                >
                                  <FamilyRestroomIcon
                                    fontSize="small"
                                    color="secondary"
                                  />
                                  <Box>
                                    <Box
                                      component="span"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {item.patient.fullName}
                                    </Box>{" "}
                                    (Người thân - Mã: {item.patient.patientCode}
                                    )
                                  </Box>
                                </Stack>
                              </MenuItem>
                            ))}
                        </Select>
                        {errors.patientId && (
                          <FormHelperText>
                            {errors.patientId.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                  {(recipient === "family" || !myPatient) && (
                    <Button
                      variant="outlined"
                      sx={{ mt: 1.5 }}
                      onClick={() => setProfileDialogOpen(true)}
                      disabled={isMyPatientLoading || isAccessibleLoading}
                    >
                      {recipient === "self"
                        ? "Tạo hồ sơ cho chính mình"
                        : "Thêm hồ sơ người nhà"}
                    </Button>
                  )}
                </Box>

                <Divider />

                {/* 2. Chọn bác sĩ */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <MedicalServicesIcon color="primary" fontSize="small" />
                    2. Chọn bác sĩ chuyên khoa
                  </Typography>

                  <Controller
                    name="doctorId"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                        error={Boolean(errors.doctorId)}
                      >
                        <InputLabel id="select-doctor-label">
                          Bác sĩ phụ trách
                        </InputLabel>
                        <Select
                          labelId="select-doctor-label"
                          label="Bác sĩ phụ trách"
                          {...field}
                          disabled={
                            isDoctorsLoading ||
                            Boolean(doctor) ||
                            createMutation.isPending
                          }
                        >
                          {doctors.map((doc) => (
                            <MenuItem key={doc.id} value={doc.id}>
                              <Box>
                                <Box component="span" sx={{ fontWeight: 600 }}>
                                  {doc.user.fullName}
                                </Box>{" "}
                                - {getDegreeLabel(doc.degree)} (Khoa:{" "}
                                {doc.specialty?.name})
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.doctorId && (
                          <FormHelperText>
                            {errors.doctorId.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>

                <Divider />

                {/* 3. Chọn ngày & giờ khám */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
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
                            slotProps={{
                              inputLabel: { shrink: true },
                              htmlInput: { min: clinicDate() },
                            }}
                            disabled={createMutation.isPending}
                            error={Boolean(errors.appointmentDate)}
                            helperText={errors.appointmentDate?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="appointmentTime"
                        control={control}
                        render={({ field }) => (
                          <BookingTimeSlots
                            slots={slots}
                            value={field.value}
                            onChange={field.onChange}
                            enabled={Boolean(
                              watchedDoctorId && watchedDate && chosenDoctor,
                            )}
                            loading={
                              isShiftsLoading ||
                              schedule.isFetching ||
                              schedule.isPending
                            }
                            error={isShiftsError || schedule.isError}
                            pending={createMutation.isPending}
                            helperText={errors.appointmentTime?.message}
                            onRetry={() => {
                              void refetchShifts();
                              void schedule.refetch();
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* 4. Triệu chứng / Lý do khám */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
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
                        helperText={
                          errors.notes?.message ||
                          "Giúp bác sĩ và điều dưỡng phân luồng chuẩn bị tốt hơn trước buổi khám"
                        }
                      />
                    )}
                  />
                </Box>

                {/* Architecture notice regarding event-driven queuing */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: "#f8fafc",
                    borderColor: "#e2e8f0",
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <InfoOutlinedIcon
                      sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: "text.primary",
                          display: "block",
                          mb: 0.25,
                        }}
                      >
                        Quy trình xử lý lịch hẹn tại phòng khám:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          lineHeight: 1.4,
                        }}
                      >
                        Yêu cầu sẽ được gửi đến phòng khám để xác nhận. Khung
                        giờ có thể thay đổi khi có người đặt cùng lúc. Bạn có
                        thể theo dõi kết quả trong mục "Lịch hẹn của tôi".
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {createMutation.isError && (
                  <Alert severity="error">
                    {createMutation.error instanceof Error
                      ? createMutation.error.message
                      : "Đăng ký đặt lịch thất bại. Vui lòng thử lại."}
                  </Alert>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={
                    createMutation.isPending ||
                    !hasPatientProfiles ||
                    !selectedPatientId ||
                    !slotsReady ||
                    !slots.some(
                      (slot) =>
                        slot.time === watchedTime &&
                        slot.status === "available",
                    )
                  }
                  startIcon={
                    createMutation.isPending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <CalendarMonthIcon />
                    )
                  }
                  sx={{ py: 1.5, fontSize: "1rem", fontWeight: 700 }}
                >
                  {createMutation.isPending
                    ? "Đang gửi yêu cầu đặt lịch..."
                    : "Xác nhận Đặt lịch khám"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}
      </Stack>
      <PatientProfileDialog
        open={profileDialogOpen}
        recipient={recipient}
        defaultName={user?.fullName}
        onClose={() => setProfileDialogOpen(false)}
        createProfile={
          recipient === "self" ? createSelfProfile : createFamilyProfile
        }
        updateProfile={updateProfile}
      />
    </Container>
  );
};
