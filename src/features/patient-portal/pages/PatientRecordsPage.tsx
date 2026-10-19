import { Alert, Paper, Stack, Typography } from "@mui/material";
import { PatientPage, patientPages } from "@/routes/access";
import { AccessDTO } from "@/types/index";

const unavailable: Partial<Record<PatientPage, string>> = {
  appointments:
    "Lịch hẹn theo hồ sơ hiện chưa khả dụng. Vui lòng liên hệ phòng khám để xem hoặc thay đổi lịch hẹn.",
  examinations:
    "Kết quả khám trực tuyến hiện chưa khả dụng. Vui lòng liên hệ phòng khám để được hỗ trợ.",
  prescriptions:
    "Đơn thuốc trực tuyến hiện chưa khả dụng. Vui lòng liên hệ phòng khám để được hỗ trợ.",
  invoices:
    "Tra cứu danh sách và chi tiết hóa đơn trực tuyến hiện chưa khả dụng. Vui lòng liên hệ phòng khám để nhận hóa đơn.",
};
export function PatientRecordsPage({
  page,
  profile,
}: {
  page: PatientPage;
  profile: AccessDTO["patient"];
}) {
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
