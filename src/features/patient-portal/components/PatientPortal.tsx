import { useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  useAppDispatch,
  useAppSelector,
  setMemoryAccessToken,
} from "@/store/index";
import { logoutAction } from "@/store/slices/authSlice";
import { authApi } from "@/api/endpoints/auth.api";
import { PatientPage, patientPages } from "@/routes/access";
import {
  useCheckAccess,
  useMyPatients,
} from "@/features/patient-portal/hooks/usePatientAccess";
import { PatientRecordsPage } from "@/features/patient-portal/pages/PatientRecordsPage";

export function PatientPortal({ page }: { page: PatientPage }) {
  const { user, isDemoMode } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState("");
  const profiles = useMyPatients();
  const list = profiles.isSuccess && !profiles.isFetching ? profiles.data : [];
  const patientId = selected || list[0]?.patientId || "";
  const linked = list.find(
    (p) =>
      p.patientId === patientId &&
      p.patient?.id === patientId &&
      p.createdBy === user?.id,
  );
  const access = useCheckAccess(patientId, !!linked);
  const allowed =
    linked &&
    access.isSuccess &&
    !access.isFetching &&
    access.data?.createdBy === user?.id &&
    access.data?.patientId === patientId;
  const logout = () => {
    // Clear local session synchronously, even if the logout request fails.
    const request = authApi.logout();
    setMemoryAccessToken(null);
    dispatch(logoutAction());
    void request.catch(() => undefined);
  };
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
          <Typography variant="h6">Cổng bệnh nhân</Typography>
          <Typography>{user?.fullName}</Typography>
          <Button onClick={logout}>Đăng xuất</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Box
            component="nav"
            aria-label="Điều hướng bệnh nhân"
            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
          >
            {Object.entries(patientPages).map(([key, label]) => (
              <Button
                key={key}
                href={`/patient/${key}`}
                onClick={(event) => {
                  if (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  window.history.pushState(null, "", `/patient/${key}`);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                variant={page === key ? "contained" : "outlined"}
              >
                {label}
              </Button>
            ))}
          </Box>
          {isDemoMode ? (
            <Alert severity="info">
              Vui lòng đăng nhập tài khoản thật để xác minh các hồ sơ được liên
              kết.
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
              Không thể xác minh hồ sơ được liên kết. Vui lòng thử lại hoặc đăng
              nhập lại.
            </Alert>
          ) : list.length === 0 ? (
            <Alert severity="info">
              Tài khoản chưa có hồ sơ được liên kết. Vui lòng liên hệ phòng
              khám.
            </Alert>
          ) : (
            <>
              <TextField
                select
                label="Hồ sơ được liên kết"
                value={linked ? patientId : ""}
                onChange={(e) => setSelected(e.target.value)}
                fullWidth
              >
                {list.map((p) => (
                  <MenuItem key={p.id} value={p.patientId}>
                    {p.patient.fullName} — {p.patient.patientCode}
                  </MenuItem>
                ))}
              </TextField>
              {!linked ? (
                <Alert severity="warning">
                  Hồ sơ đã chọn không còn được liên kết. Vui lòng chọn hồ sơ
                  khác.
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
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
