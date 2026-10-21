import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authApi } from "@/api/endpoints/auth.api";
import { getApiBaseUrl } from "@/api/axios";
import { useAppDispatch, setMemoryAccessToken } from "@/store/index";
import { setCredentials } from "@/store/slices/authSlice";

const loginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập email hoặc số điện thoại"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
const registerSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ và tên"),
  email: z.string().email("Địa chỉ email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export const AuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [tabIndex, setTabIndex] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const saveSession = (session: Awaited<ReturnType<typeof authApi.login>>) => {
    setMemoryAccessToken(session.accessToken);
    dispatch(setCredentials(session));
  };
  const beginSocialLogin = (provider: "google" | "facebook") => {
    window.location.assign(
      `${getApiBaseUrl().replace(/\/+$/, "")}/auth/${provider}`,
    );
  };
  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      saveSession(
        await authApi.login({
          identifier: data.identifier.trim(),
          password: data.password,
        }),
      );
    } catch {
      setApiError(
        "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      saveSession(
        await authApi.register({
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          password: data.password,
        }),
      );
    } catch {
      setApiError("Không thể tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };
  const submitIcon = isLoading ? (
    <CircularProgress size={18} color="inherit" />
  ) : undefined;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 3,
            border: "1px solid #e2e8f0",
          }}
        >
          <Stack
            spacing={1}
            sx={{ mb: 3, textAlign: "center", alignItems: "center" }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Cổng Dịch Vụ Bệnh Nhân
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đăng nhập để quản lý hồ sơ y tế và lịch hẹn.
            </Typography>
          </Stack>
          <Tabs
            value={tabIndex}
            onChange={(_, value) => {
              setTabIndex(value);
              setApiError(null);
            }}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Đăng nhập" />
            <Tab label="Đăng ký tài khoản" />
          </Tabs>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}
          {tabIndex === 0 ? (
            <Box
              component="form"
              onSubmit={loginForm.handleSubmit(onLogin)}
              noValidate
            >
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Số điện thoại hoặc địa chỉ email"
                  autoComplete="email"
                  error={Boolean(loginForm.formState.errors.identifier)}
                  helperText={loginForm.formState.errors.identifier?.message}
                  {...loginForm.register("identifier")}
                />
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type="password"
                  autoComplete="current-password"
                  error={Boolean(loginForm.formState.errors.password)}
                  helperText={loginForm.formState.errors.password?.message}
                  {...loginForm.register("password")}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={submitIcon}
                >
                  Đăng nhập vào hệ thống
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={registerForm.handleSubmit(onRegister)}
              noValidate
            >
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Họ và tên bệnh nhân"
                  error={Boolean(registerForm.formState.errors.fullName)}
                  helperText={registerForm.formState.errors.fullName?.message}
                  {...registerForm.register("fullName")}
                />
                <TextField
                  fullWidth
                  label="Địa chỉ email"
                  autoComplete="email"
                  error={Boolean(registerForm.formState.errors.email)}
                  helperText={registerForm.formState.errors.email?.message}
                  {...registerForm.register("email")}
                />
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(registerForm.formState.errors.password)}
                  helperText={registerForm.formState.errors.password?.message}
                  {...registerForm.register("password")}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={submitIcon}
                >
                  Đăng ký & vào ngay
                </Button>
              </Stack>
            </Box>
          )}
          <Divider sx={{ my: 3 }}>hoặc tiếp tục với</Divider>
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={() => beginSocialLogin("google")}
            >
              Đăng nhập Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={() => beginSocialLogin("facebook")}
              sx={{ borderColor: "#1877f2", color: "#1877f2" }}
            >
              Đăng nhập Facebook
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
