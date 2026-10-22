import { CommerceInvoicesPage, PatientPrescriptionPurchases } from '@/features/commerce/CommercePages';
import { useExaminations } from '@/features/examinations/hook/useExaminations';
import { Alert, Button, CircularProgress, Divider, Grid, Pagination, Paper, Stack, Typography } from "@mui/material";
import { useState } from 'react';
import { PatientPage, patientPages } from "@/routes/access";
import { AccessDTO } from "@/types/index";

const unavailable: Partial<Record<PatientPage, string>> = {
  appointments:
    "Lịch hẹn theo hồ sơ hiện chưa khả dụng. Vui lòng liên hệ phòng khám để xem hoặc thay đổi lịch hẹn.",
  prescriptions:
    "Đơn thuốc trực tuyến hiện chưa khả dụng. Vui lòng liên hệ phòng khám để được hỗ trợ.",
  invoices:
    "Tra cứu danh sách và chi tiết hóa đơn trực tuyến hiện chưa khả dụng. Vui lòng liên hệ phòng khám để nhận hóa đơn.",
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";
const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Chưa cập nhật";
const genderLabel = (gender?: string) =>
  gender === "MALE" ? "Nam" : gender === "FEMALE" ? "Nữ" : gender || "Chưa cập nhật";
export function PatientRecordsPage({
  page,
  profile,
}: {
  page: PatientPage;
  profile: AccessDTO["patient"];
}) {
  const [examinationPage, setExaminationPage] = useState(1);
  const examinations = useExaminations(
    { patientId: profile.id, page: examinationPage, limit: 10 },
    page === "examinations",
  );
  if(page==='prescriptions') return <PatientPrescriptionPurchases key={profile.id} patientId={profile.id}/>;
  if(page==='invoices') return <CommerceInvoicesPage key={profile.id} patientId={profile.id}/>;
  if (page === "examinations") {
    const records = examinations.data?.data ?? [];
    const pagination = examinations.data?.pagination;
    return (
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Kết quả khám
        </Typography>
        {examinations.isLoading ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={30} />
          </Paper>
        ) : examinations.isError ? (
          <Alert severity="error" action={<Button onClick={() => void examinations.refetch()}>Thử lại</Button>}>
            Không thể tải kết quả khám. Vui lòng thử lại.
          </Alert>
        ) : records.length === 0 ? (
          <Alert severity="info">Chưa có kết quả khám cho hồ sơ này.</Alert>
        ) : (
          <>
            {records.map((record) => (
              <Paper key={record.id} variant="outlined" sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {record.diagnosis || "Chưa có chẩn đoán"}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Ngày khám</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(record.examinedAt)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Bác sĩ khám</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.doctor?.user?.fullName || "Chưa cập nhật"}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Ngày hẹn khám</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(record.appointment?.appointmentDate)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Ngày tái khám</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(record.followUpDate)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Mã ICD-10</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.icd10Code || "Chưa cập nhật"}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Mã lần khám</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.appointmentId || record.appointment?.id || "Chưa cập nhật"}</Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Bệnh nhân</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.appointment?.patient?.fullName || profile.fullName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Ngày sinh · Giới tính</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(record.appointment?.patient?.dateOfBirth || profile.dateOfBirth)} · {genderLabel(record.appointment?.patient?.gender || profile.gender)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.appointment?.patient?.phone || profile.phone || "Chưa cập nhật"}</Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">Ghi chú lâm sàng</Typography>
                    <Typography variant="body2">{record.clinicalNotes || "Chưa có ghi chú lâm sàng."}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {(pagination?.totalPages ?? 1) > 1 && (
              <Stack direction="row" sx={{ justifyContent: "center", pt: 1 }}>
                <Pagination
                  color="primary"
                  count={pagination?.totalPages ?? 1}
                  page={pagination?.page ?? examinationPage}
                  onChange={(_, nextPage) => setExaminationPage(nextPage)}
                />
              </Stack>
            )}
          </>
        )}
      </Stack>
    );
  }
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">{patientPages[page]}</Typography>
        {unavailable[page] ? (
          <Alert severity="info">{unavailable[page]}</Alert>
        ) : (
          <>
            <Typography variant="h6">{profile.fullName}</Typography>
            <Typography>Mã bệnh nhân: {profile.patientCode}</Typography>
            <Typography>
              Ngày sinh:{" "}
              {profile.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                : "Chưa cập nhật"}
            </Typography>
            <Typography>
              Điện thoại: {profile.phone || "Chưa cập nhật"}
            </Typography>
            <Alert severity="info">
              Bạn đang xem hồ sơ được liên kết. Để cập nhật thông tin hoặc thay
              đổi quyền truy cập, vui lòng liên hệ phòng khám.
            </Alert>
          </>
        )}
      </Stack>
    </Paper>
  );
}
