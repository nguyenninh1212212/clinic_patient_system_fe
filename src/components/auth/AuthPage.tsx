import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SecurityIcon from '@mui/icons-material/Security';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '../../api/auth';
import { useAppDispatch } from '../../store';
import { setCredentials, loginAsDemo } from '../../store/slices/authSlice';
import { setMemoryAccessToken } from '../../store';

// Validation schemas with Zod
const loginSchema = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên đầy đủ'),
  email: z.string().email('Địa chỉ email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export const AuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Login Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    setValue: setLoginValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'patient.demo@phongkham.vn',
      password: 'Password123@',
    },
  });

  // Register Form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: 'Nguyễn Văn An',
      email: 'patient.demo@phongkham.vn',
      password: 'Password123@',
    },
  });

  const handleLoginDemoDirectly = (customName?: string, customEmail?: string) => {
    dispatch(
      loginAsDemo({
        id: 'demo-user-patient-001',
        email: customEmail || 'patient.demo@phongkham.vn',
        role: 'USER',
        fullName: customName || 'Nguyễn Văn An',
        department: null,
      })
    );
  };

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await authApi.login({
        email: data.email.trim(),
        password: data.password,
      });

      // Save token in memory
      setMemoryAccessToken(res.accessToken);
      dispatch(
        setCredentials({
          user: res.user,
          accessToken: res.accessToken,
        })
      );
    } catch {
      // Backend not connected or failed -> log in as static page as requested!
      handleLoginDemoDirectly(data.email.split('@')[0], data.email.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await authApi.register({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      setMemoryAccessToken(res.accessToken);
      dispatch(
        setCredentials({
          user: res.user,
          accessToken: res.accessToken,
        })
      );
    } catch {
      // Backend not connected -> log in as static user with given name/email
      handleLoginDemoDirectly(data.fullName.trim(), data.email.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setLoginValue('email', 'patient.demo@phongkham.vn');
    setLoginValue('password', 'Password123@');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header Branding */}
          <Stack spacing={1.5} sx={{ alignItems: 'center', mb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              <LocalHospitalIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Cổng Dịch Vụ Bệnh Nhân
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
              Hệ thống theo dõi hồ sơ y tế điện tử, đặt khám chuyên khoa, quản lý đơn thuốc và thanh toán viện phí
            </Typography>
          </Stack>

          {/* Quick Static Demo Mode Card (Requested feature for no-backend environments) */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2.5,
              bgcolor: '#f0fdf4',
              borderColor: '#86efac',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)',
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlinedIcon sx={{ color: '#16a34a', fontSize: 22 }} />
                <Typography variant="subtitle2" sx={{ color: '#15803d', fontWeight: 700 }}>
                  Đang chạy Chế độ Trang Tĩnh (Không cần kết nối máy chủ)
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: '#166534', fontSize: '0.825rem', lineHeight: 1.5 }}>
                Do hiện tại chưa có backend đang chạy, bạn có thể bấm nút dưới đây để đăng nhập tức thì và sử dụng đầy đủ các trang: <strong>Hóa đơn</strong>, <strong>Đơn thuốc</strong>, <strong>Lịch hẹn</strong>, <strong>Bác sĩ</strong>,...
              </Typography>
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                startIcon={<FlashOnIcon />}
                onClick={() => handleLoginDemoDirectly()}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: '#16a34a',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                VÀO NGAY HỆ THỐNG (ĐĂNG NHẬP TĨNH)
              </Button>
            </Stack>
          </Paper>

          {/* Tabs for Login / Register */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabIndex}
              onChange={(_, newValue) => {
                setTabIndex(newValue);
                setApiError(null);
              }}
              variant="fullWidth"
            >
              <Tab label="Đăng nhập biểu mẫu" sx={{ fontWeight: 600 }} />
              <Tab label="Đăng ký tài khoản" sx={{ fontWeight: 600 }} />
            </Tabs>
          </Box>

          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          {/* Form: LOGIN */}
          {tabIndex === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit(onLogin)} noValidate>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  id="email"
                  label="Địa chỉ Email"
                  placeholder="patient.demo@phongkham.vn"
                  autoComplete="email"
                  error={Boolean(loginErrors.email)}
                  helperText={loginErrors.email?.message}
                  {...loginRegister('email')}
                />

                <TextField
                  fullWidth
                  id="password"
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={Boolean(loginErrors.password)}
                  helperText={loginErrors.password?.message}
                  {...loginRegister('password')}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ py: 1.25, fontSize: '0.95rem', fontWeight: 700 }}
                  startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}
                </Button>

                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                  <Chip
                    label="Điền thông tin mẫu"
                    clickable
                    size="small"
                    variant="outlined"
                    onClick={handleFillDemo}
                  />
                  <Chip
                    label="Vào thẳng trang tĩnh"
                    clickable
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={() => handleLoginDemoDirectly()}
                  />
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Form: REGISTER */}
          {tabIndex === 1 && (
            <Box component="form" onSubmit={handleRegisterSubmit(onRegister)} noValidate>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  id="fullName"
                  label="Họ và tên bệnh nhân"
                  placeholder="Nguyễn Văn An"
                  error={Boolean(registerErrors.fullName)}
                  helperText={registerErrors.fullName?.message}
                  {...registerRegister('fullName')}
                />

                <TextField
                  fullWidth
                  id="reg-email"
                  label="Địa chỉ Email"
                  placeholder="patient.demo@phongkham.vn"
                  autoComplete="email"
                  error={Boolean(registerErrors.email)}
                  helperText={registerErrors.email?.message}
                  {...registerRegister('email')}
                />

                <TextField
                  fullWidth
                  id="reg-password"
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu bất kỳ"
                  autoComplete="new-password"
                  error={Boolean(registerErrors.password)}
                  helperText={registerErrors.password?.message}
                  {...registerRegister('password')}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ py: 1.25, fontSize: '0.95rem', fontWeight: 700 }}
                  startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {isLoading ? 'Đang tạo...' : 'Đăng ký & Vào ngay'}
                </Button>
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Security & System Info */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              borderColor: '#e2e8f0',
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <SecurityIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.25 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.25 }}>
                  Tuân thủ bảo mật & Tiêu chuẩn Y tế
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                  Hệ thống tự động đồng bộ hóa đơn (GET/POST /invoices, export, import) và đơn thuốc (GET/POST/PATCH/DELETE /prescriptions & /prescription-items) với máy chủ hoặc lưu trữ cục bộ khi chạy offline.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
};
