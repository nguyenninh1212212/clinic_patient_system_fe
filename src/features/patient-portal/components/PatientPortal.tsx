import { useEffect } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Stack,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { setActiveProfile } from "@/store/slices/profileSlice";
import { useMyPatient } from "@/features/patients/hooks/usePatientProfiles";
import { type PatientPage } from "@/routes/access";
import {
  useCheckAccess,
  useMyPatients,
} from "@/features/patient-portal/hooks/usePatientAccess";
import { PatientRecordsPage } from "@/features/patient-portal/pages/PatientRecordsPage";

export function PatientPortal({ page }: { page: PatientPage }) {
  const { user, isDemoMode } = useAppSelector((s) => s.auth);
  const { activePatientId } = useAppSelector((s) => s.profile);
  const dispatch = useAppDispatch();
  const profiles = useMyPatients();
  const self = useMyPatient();
  const list = profiles.isSuccess && !profiles.isFetching ? profiles.data : [];

  const patientId = activePatientId || list[0]?.patientId || "";
  const linked = list.find(
    (p) =>
      p.patientId === patientId &&
      p.patient?.id === patientId &&
      p.userId === user?.id,
  );
  const access = useCheckAccess(patientId, !!linked);
  const allowed =
    linked &&
    access.isSuccess &&
    !access.isFetching &&
    access.data?.userId === user?.id &&
    access.data?.patientId === patientId;
  useEffect(() => {
    if (!activePatientId && linked && self.isSuccess) {
      dispatch(
        setActiveProfile({
          patientId,
          patientName: linked.patient.fullName,
          patientCode: linked.patient.patientCode,
          isRelative: self.data?.id !== patientId,
        }),
      );
    }
  }, [activePatientId, linked, patientId, dispatch, self.data, self.isSuccess]);
  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3}>
        {isDemoMode ? (
          <Alert severity="info">
            Vui lòng đăng nhập để xem hồ sơ và thanh toán.
          </Alert>
        ) : profiles.isPending || profiles.isFetching ? (
          <CircularProgress aria-label="Đang tải hồ sơ" />
        ) : profiles.isError ? (
          <Alert
            severity="error"
            action={
              <Button onClick={() => void profiles.refetch()}>Thử lại</Button>
            }
          >
            Không thể xác minh hồ sơ được liên kết.
          </Alert>
        ) : !list.length ? (
          <Alert severity="info">
            Tài khoản chưa có hồ sơ được liên kết. Bạn có thể tạo hoặc chọn hồ
            sơ trong menu ở góc trên.
          </Alert>
        ) : !linked ? (
          <Alert severity="warning">
            Hồ sơ đã chọn không còn được liên kết. Vui lòng chọn hồ sơ khác.
          </Alert>
        ) : access.isPending || access.isFetching ? (
          <CircularProgress aria-label="Đang xác minh quyền truy cập" />
        ) : !allowed ? (
          <Alert
            severity="error"
            action={
              <Button onClick={() => void access.refetch()}>
                Kiểm tra lại
              </Button>
            }
          >
            Không có quyền truy cập hồ sơ hoặc không thể xác minh quyền.
          </Alert>
        ) : (
          <PatientRecordsPage
            key={`${user?.id}:${patientId}:${page}`}
            page={page}
            profile={linked.patient}
          />
        )}
      </Stack>
    </Container>
  );
}
