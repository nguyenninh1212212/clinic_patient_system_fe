import React, { useEffect, useState } from "react";
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
  Chip,
  Divider,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useAppDispatch, useAppSelector } from "@/store/index";
import { setUser } from "@/store/slices/authSlice";
import { PatientProfileDialog } from "@/features/patients/components/PatientProfileDialog";
import {
  useCreatePatient,
  useMyPatient,
  useAccessiblePatients,
  useCreatePatientForMySelf,
  useUpdatePatientForMySelf,
} from "@/features/patients/hooks/usePatientProfiles";
import axios from "axios";
import type { PatientRecipient } from "@/features/patients/schemas/patient.schema";
import { useDefaultPatientProfile } from "@/features/patients/hooks/useDefaultPatientProfile";
import { AccountSettingsDialog } from "@/features/profile/components/AccountSettingsDialog";
import { authApi } from "@/api/endpoints/auth.api";
import { getApiBaseUrl } from "@/api/axios";

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [providerLinkError, setProviderLinkError] = useState<string | null>(null);
  const [providerBeingLinked, setProviderBeingLinked] = useState<"GOOGLE" | "FACEBOOK" | null>(null);
  const [oauthFeedback, setOauthFeedback] = useState<"success" | "error" | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [recipient, setRecipient] = useState<PatientRecipient>("self");
  const createProfile = useCreatePatientForMySelf();
  const createFamilyProfile = useCreatePatient();
  const updateProfile = useUpdatePatientForMySelf();

  const {
    data: myPatientRes,
    isLoading: isMyPatientLoading,
    isError: isMyPatientError,
    error: patientError,
    refetch: refetchMyPatient,
  } = useMyPatient();

  const { data: accessibleRes, isLoading: isAccessibleLoading, isError: isAccessibleError, refetch: refetchAccessible } = useAccessiblePatients();

  const patient = myPatientRes ?? undefined;
  const accessibleList = (accessibleRes?.data || []).filter(item => item.patient.id !== patient?.id);
  const { defaultPatientId, chooseDefault } = useDefaultPatientProfile(patient, accessibleRes?.data, !isMyPatientLoading && !isMyPatientError && !isAccessibleLoading && !isAccessibleError);
  const { data: providers, isError: isProvidersError, isLoading: isProvidersLoading } = useQuery({
    queryKey: ["patient-portal", user?.id, "auth-providers"],
    queryFn: () => authApi.getProviders(),
    enabled: Boolean(user?.id),
  });
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const linked = query.get("oauth_link");
    const error = query.get("oauth_error");
    if (!linked && !error) return;
    setOauthFeedback(linked === "success" ? "success" : "error");
    query.delete("oauth_link");
    query.delete("oauth_error");
    const remaining = query.toString();
    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}${remaining ? `?${remaining}` : ""}${window.location.hash}`,
    );
  }, []);
  const openSelfProfile = () => {
    setRecipient("self");
    setProfileDialogOpen(true);
  };
  const updateAccountUser = (nextUser: NonNullable<typeof user>) => {
    dispatch(setUser(nextUser));
  };
  const beginProviderLink = async (provider: "GOOGLE" | "FACEBOOK") => {
    setProviderLinkError(null);
    setProviderBeingLinked(provider);
    try {
      const { url } = await authApi.beginProviderLink(provider);
      if (!url.startsWith("/")) {
        throw new Error("Invalid OAuth link URL");
      }
      window.location.assign(`${getApiBaseUrl().replace(/\/+$/, "")}${url}`);
    } catch {
      setProviderBeingLinked(null);
      setProviderLinkError("Không thể bắt đầu liên kết tài khoản. Vui lòng thử lại.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={4}>
        {/* Title */}
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Hồ sơ y tế & Danh sách người thân
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Quản lý thông tin định danh y tế cá nhân và các hồ sơ người thân
            được cấp quyền ủy quyền
          </Typography>
        </Box>

        <Paper
          variant="outlined"
          sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2.5, borderColor: "#cbd5e1" }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 2.5 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                Thông tin tài khoản
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dùng email hoặc số điện thoại để đăng nhập.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => setAccountDialogOpen(true)} disabled={!user}>
              Chỉnh sửa tài khoản
            </Button>
          </Stack>
          {oauthFeedback === "success" && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Liên kết tài khoản thành công.
            </Alert>
          )}
          {oauthFeedback === "error" && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Liên kết tài khoản không thành công. Vui lòng thử lại.
            </Alert>
          )}
          {providerLinkError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {providerLinkError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                Họ và tên
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.fullName || "Chưa cập nhật"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                Số điện thoại
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.phone || "Chưa cập nhật"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                Email
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                {user?.email || "Chưa cập nhật"}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2.5 }} />
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", mb: 1 }}>
            Phương thức liên kết
          </Typography>
          {isProvidersLoading ? (
            <Typography variant="body2" color="text.secondary">
              Đang tải trạng thái các phương thức liên kết…
            </Typography>
          ) : isProvidersError ? (
            <Typography variant="body2" color="text.secondary">
              Không thể tải trạng thái các phương thức liên kết.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
              <Chip
                size="small"
                color={providers?.includes("LOCAL") ? "success" : "default"}
                label={providers?.includes("LOCAL") ? "Số điện thoại / mật khẩu: đã thiết lập" : "Số điện thoại / mật khẩu: chưa thiết lập"}
              />
              {providers?.includes("GOOGLE") ? (
                <Chip size="small" color="success" label="Google: đã liên kết" />
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={providerBeingLinked !== null}
                  onClick={() => void beginProviderLink("GOOGLE")}
                >
                  {providerBeingLinked === "GOOGLE" ? <CircularProgress size={16} color="inherit" /> : "Liên kết Google"}
                </Button>
              )}
              {providers?.includes("FACEBOOK") ? (
                <Chip size="small" color="success" label="Facebook: đã liên kết" />
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={providerBeingLinked !== null}
                  onClick={() => void beginProviderLink("FACEBOOK")}
                  sx={{ borderColor: "#1877f2", color: "#1877f2" }}
                >
                  {providerBeingLinked === "FACEBOOK" ? <CircularProgress size={16} color="inherit" /> : "Liên kết Facebook"}
                </Button>
              )}
            </Stack>
          )}
        </Paper>

        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, fontSize: "1.05rem" }}
            >
              1. Hồ sơ bệnh nhân của bạn
            </Typography>
            <Button
              variant="outlined"
              onClick={openSelfProfile}
              disabled={isMyPatientLoading}
            >
              {patient ? "Sửa hồ sơ cá nhân" : "Tạo hồ sơ cá nhân"}
            </Button>
          </Stack>

          {isMyPatientLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : isMyPatientError ? (
            <Alert severity="error" action={<Button onClick={() => void refetchMyPatient()}>Thử lại</Button>}>
              {axios.isAxiosError(patientError)
                ? patientError.response?.data?.message
                : "Không thể tải hồ sơ bệnh nhân. Vui lòng thử lại."}
            </Alert>
          ) : !patient ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                borderColor: "#e2e8f0",
              }}
            >
              <Stack
                spacing={2}
                sx={{
                  alignItems: "center",
                  textAlign: "center",
                  maxWidth: 600,
                  mx: "auto",
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "#fee2e2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InfoOutlinedIcon fontSize="large" />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "text.primary" }}
                >
                  Tài khoản chưa được liên kết với hồ sơ bệnh án
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", lineHeight: 1.6 }}
                >
                  Hệ thống không tìm thấy mã bệnh nhân tương ứng với tài khoản
                  này. Bạn có thể liên kết hồ sơ đã có hoặc tạo hồ sơ bệnh nhân mới.
                </Typography>
              </Stack>
            </Paper>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 2.5,
                bgcolor: "#ffffff",
                borderColor: "#cbd5e1",
              }}
            >
              <Grid container spacing={3}>
                <Grid
                  size={{ xs: 12, md: 4 }}
                  sx={{
                    borderRight: { md: "1px solid #f1f5f9" },
                    pr: { md: 3 },
                  }}
                >
                  <Stack
                    spacing={2}
                    sx={{ alignItems: { xs: "center", md: "flex-start" } }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        bgcolor: "primary.light",
                        color: "primary.dark",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PersonOutlinedIcon sx={{ fontSize: 40 }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {patient.fullName}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Mã BN:{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "primary.main",
                            fontFamily: "monospace",
                          }}
                        >
                          {patient.patientCode}
                        </Box>
                      </Typography>
                    </Box>

                    {defaultPatientId === patient.id ? (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: "center", color: "success.main" }}
                      >
                        <CheckCircleIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Đang chọn làm hồ sơ mặc định
                        </Typography>
                      </Stack>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => chooseDefault(patient, false)}
                      >
                        Chọn làm hồ sơ mặc định
                      </Button>
                    )}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Ngày sinh
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.dateOfBirth
                          ? new Date(patient.dateOfBirth).toLocaleDateString(
                              "vi-VN",
                            )
                          : "Chưa cập nhật"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Giới tính
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.gender === "MALE"
                          ? "Nam"
                          : patient.gender === "FEMALE"
                            ? "Nữ"
                            : "Khác"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Số điện thoại
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.phone || "Chưa cập nhật"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Số CCCD / CMND
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontFamily: "monospace" }}
                      >
                        {patient.identityNumber || "Chưa đăng ký"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Mã số thẻ Bảo hiểm Y tế (BHYT)
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "primary.dark",
                        }}
                      >
                        {patient.insuranceCode || "Không có BHYT"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Địa chỉ cư trú
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {patient.address || "Chưa cập nhật"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Tiền sử bệnh lý & Dị ứng
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          bgcolor: "#f8fafc",
                          p: 1.5,
                          borderRadius: 1.5,
                          border: "1px solid #f1f5f9",
                          mt: 0.5,
                        }}
                      >
                        {patient.medicalHistory ||
                          "Chưa ghi nhận tiền sử bệnh lý đặc biệt"}
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: "1.05rem" }}
              >
                2. Danh sách hồ sơ người thân được ủy quyền
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => { setRecipient("family"); setProfileDialogOpen(true); }} sx={{ flexShrink: 0 }}>
              Tạo hồ sơ người thân
            </Button>
          </Stack>

          {isAccessibleLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : isAccessibleError ? (
            <Alert severity="error" action={<Button onClick={() => void refetchAccessible()}>Thử lại</Button>}>
              Không thể tải hồ sơ người thân. Vui lòng thử lại.
            </Alert>
          ) : accessibleList.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "#f8fafc",
                borderRadius: 2,
              }}
            >
              <FamilyRestroomIcon
                sx={{ fontSize: 44, color: "#94a3b8", mb: 1 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Chưa có hồ sơ người thân nào được liên kết
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: "block",
                  maxWidth: 500,
                  mx: "auto",
                  mt: 0.5,
                }}
              >
                Nhấn “Tạo hồ sơ người thân” để thêm thông tin cho con nhỏ, cha mẹ
                hoặc người thân của bạn.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {accessibleList.map((item) => {
                const isSelected = defaultPatientId === item.patient.id;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: isSelected ? "secondary.main" : "#e2e8f0",
                        bgcolor: isSelected ? "#f0fdfa" : "#ffffff",
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              sx={{ alignItems: "center" }}
                            >
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  bgcolor: "secondary.light",
                                  color: "secondary.dark",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <FamilyRestroomIcon fontSize="small" />
                              </Box>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 700 }}
                                >
                                  {item.patient.fullName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Mã: {item.patient.patientCode}
                                </Typography>
                              </Box>
                            </Stack>
                            {isSelected && (
                              <CheckCircleIcon
                                fontSize="small"
                                sx={{ color: "secondary.main" }}
                              />
                            )}
                          </Stack>

                          <Divider />

                          <Stack
                            spacing={0.5}
                            sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                          >
                            <Box>
                              Giới tính:{" "}
                              <Box
                                component="span"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                {item.patient.gender === "MALE" ? "Nam" : "Nữ"}
                              </Box>
                            </Box>
                            <Box>
                              Ngày sinh:{" "}
                              <Box
                                component="span"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                {item.patient.dateOfBirth
                                  ? new Date(
                                      item.patient.dateOfBirth,
                                    ).toLocaleDateString("vi-VN")
                                  : "Chưa cập nhật"}
                              </Box>
                            </Box>
                            <Box>
                              SĐT liên hệ:{" "}
                              <Box
                                component="span"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                {item.patient.phone}
                              </Box>
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant={isSelected ? "contained" : "outlined"}
                              color="secondary"
                              fullWidth
                              onClick={() => chooseDefault(item.patient, true)}
                            >
                              {isSelected
                                ? "Hồ sơ mặc định"
                                : "Chọn làm hồ sơ mặc định"}
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
      <PatientProfileDialog
        open={profileDialogOpen}
        recipient={recipient}
        defaultName={user?.fullName}
        patient={recipient === "self" ? patient : undefined}
        onClose={() => setProfileDialogOpen(false)}
        createProfile={recipient === "self" ? createProfile : createFamilyProfile}
        updateProfile={updateProfile}
      />
      <AccountSettingsDialog
        open={accountDialogOpen}
        user={user}
        onClose={() => setAccountDialogOpen(false)}
        onUpdated={updateAccountUser}
      />
    </Container>
  );
};
