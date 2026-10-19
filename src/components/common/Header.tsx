import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Divider,
  Chip,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import AddIcon from '@mui/icons-material/Add';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  AppTab,
  setCurrentTab,
  setMobileSidebarOpen,
  setNotificationDrawerOpen,
  setServerConfigModalOpen,
} from '../../store/slices/uiSlice';
import { logoutAction } from '../../store/slices/authSlice';
import { setActiveProfile, clearActiveProfile } from '../../store/slices/profileSlice';
import { authApi } from '../../api/auth';
import { setMemoryAccessToken } from '../../store';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications';
import { patientsApi } from '../../api/patients';

interface NavItem {
  id: AppTab;
  label: string;
  isAction?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan' },
  { id: 'doctors', label: 'Bác sĩ' },
  { id: 'booking', label: 'Đặt khám', isAction: true },
  { id: 'appointments', label: 'Lịch hẹn' },
  { id: 'examinations', label: 'Kết quả khám' },
  { id: 'prescriptions', label: 'Đơn thuốc' },
  { id: 'invoices', label: 'Hóa đơn' },
];

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isDemoMode } = useAppSelector((state) => state.auth);
  const { currentTab } = useAppSelector((state) => state.ui);
  const { activePatientId, activePatientName, isRelative } = useAppSelector((state) => state.profile);

  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Notifications unread count query
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationsApi.getNotifications({ page: 1, limit: 1 }),
    refetchInterval: 30000,
  });

  // Patient profiles query for switcher
  const { data: myPatientData } = useQuery({
    queryKey: ['patient', 'me'],
    queryFn: patientsApi.getMyPatient,
    retry: 1,
  });

  const { data: accessiblePatientsData } = useQuery({
    queryKey: ['user-patient-access', 'my-patients'],
    queryFn: patientsApi.getMyAccessiblePatients,
    retry: 1,
  });

  const myPatient = myPatientData?.data;
  const accessiblePatients = accessiblePatientsData?.data || [];
  const unreadCount = notificationsData?.unRead || 0;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setMemoryAccessToken(null);
      dispatch(logoutAction());
      dispatch(clearActiveProfile());
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        zIndex: 1000,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3, md: 4 },
          minHeight: { xs: 60, md: 68 },
        }}
      >
        {/* Left Section: Mobile Hamburger + Brand Logo */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {/* Mobile Menu Button (Hamburger) */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => dispatch(setMobileSidebarOpen(true))}
            sx={{
              display: { xs: 'flex', md: 'none' },
              mr: 0.5,
              color: 'primary.dark',
              bgcolor: '#f1f5f9',
              borderRadius: 2,
              '&:hover': { bgcolor: '#e2e8f0' },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Clinic Brand */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', cursor: 'pointer' }}
            onClick={() => dispatch(setCurrentTab('dashboard'))}
          >
            <Box
              sx={{
                width: { xs: 36, md: 40 },
                height: { xs: 36, md: 40 },
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              }}
            >
              <LocalHospitalIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                  lineHeight: 1.2,
                  color: 'primary.dark',
                  letterSpacing: -0.2,
                }}
              >
                CỔNG BỆNH NHÂN
              </Typography>
              <Typography
                variant="caption"
                component="div"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.725rem',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Phòng khám & Bệnh viện Thông minh
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {/* Center Section: Sleek Desktop Navigation Tabs (Hidden on mobile) */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            mx: 2,
          }}
        >
          {mainNavItems.map((item) => {
            const isActive = currentTab === item.id;
            if (item.isAction) {
              return (
                <Button
                  key={item.id}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  color="primary"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => dispatch(setCurrentTab(item.id))}
                  sx={{
                    px: 1.75,
                    py: 0.65,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    bgcolor: isActive ? 'primary.main' : '#f0f9ff',
                    borderColor: '#7dd3fc',
                    color: isActive ? '#ffffff' : 'primary.dark',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : '#e0f2fe',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            }

            return (
              <Button
                key={item.id}
                size="small"
                onClick={() => dispatch(setCurrentTab(item.id))}
                sx={{
                  px: 1.5,
                  py: 0.7,
                  borderRadius: 2,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  color: isActive ? 'primary.dark' : '#475569',
                  bgcolor: isActive ? '#f0f9ff' : 'transparent',
                  borderBottom: isActive ? '2px solid #0284c7' : '2px solid transparent',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    color: 'primary.main',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        {/* Right Section: Patient Switcher, Notifications, User Menu */}
        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center' }}>
          {/* Active Patient Switcher (Desktop and Tablet) */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
              endIcon={<ArrowDropDownIcon sx={{ fontSize: 18 }} />}
              startIcon={
                isRelative ? (
                  <FamilyRestroomIcon sx={{ fontSize: 17, color: '#db2777' }} />
                ) : (
                  <PersonOutlinedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                )
              }
              sx={{
                borderColor: '#e2e8f0',
                color: '#0f172a',
                bgcolor: '#f8fafc',
                px: 1.5,
                py: 0.6,
                fontSize: '0.825rem',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' },
              }}
            >
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, maxWidth: 160 }}>
                {activePatientName || 'Chọn hồ sơ'}
              </Typography>
            </Button>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={() => setProfileMenuAnchor(null)}
              slotProps={{ paper: { sx: { minWidth: 260, mt: 1, p: 1, borderRadius: 2 } } }}
            >
              <Typography
                variant="caption"
                sx={{ px: 2, py: 0.5, fontWeight: 700, color: 'text.secondary', display: 'block' }}
              >
                HỒ SƠ BẢN THÂN
              </Typography>
              {myPatient ? (
                <MenuItem
                  selected={activePatientId === myPatient.id}
                  onClick={() => {
                    dispatch(
                      setActiveProfile({
                        patientId: myPatient.id,
                        patientName: myPatient.fullName,
                        patientCode: myPatient.patientCode,
                        isRelative: false,
                      })
                    );
                    setProfileMenuAnchor(null);
                  }}
                  sx={{ borderRadius: 1.5 }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <PersonOutlinedIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {myPatient.fullName} (Tôi)
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Mã BN: {myPatient.patientCode}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ) : (
                <MenuItem disabled sx={{ borderRadius: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Chưa tạo hồ sơ bệnh nhân cá nhân
                  </Typography>
                </MenuItem>
              )}

              <Divider sx={{ my: 1 }} />
              <Typography
                variant="caption"
                sx={{ px: 2, py: 0.5, fontWeight: 700, color: 'text.secondary', display: 'block' }}
              >
                HỒ SƠ NGƯỜI THÂN ĐƯỢC ỦY QUYỀN
              </Typography>
              {accessiblePatients.length > 0 ? (
                accessiblePatients.map((acc) => (
                  <MenuItem
                    key={acc.id}
                    selected={activePatientId === acc.patient.id}
                    onClick={() => {
                      dispatch(
                        setActiveProfile({
                          patientId: acc.patient.id,
                          patientName: acc.patient.fullName,
                          patientCode: acc.patient.patientCode,
                          isRelative: true,
                        })
                      );
                      setProfileMenuAnchor(null);
                    }}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <FamilyRestroomIcon fontSize="small" sx={{ color: '#db2777' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {acc.patient.fullName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Mã: {acc.patient.patientCode}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled sx={{ borderRadius: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Không có hồ sơ người thân liên kết
                  </Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* Notifications Icon Button */}
          <Tooltip title="Thông báo hệ thống">
            <IconButton
              size="small"
              onClick={() => dispatch(setNotificationDrawerOpen(true))}
              sx={{
                color: '#475569',
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 0.85,
                '&:hover': { bgcolor: '#f1f5f9', color: 'primary.main' },
              }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Avatar Button & Menu */}
          <Box>
            <Tooltip title="Tài khoản người dùng">
              <IconButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                size="small"
                sx={{
                  p: 0.4,
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {(user?.fullName || 'BN').charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              slotProps={{ paper: { sx: { minWidth: 240, mt: 1, p: 1, borderRadius: 2 } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {user?.fullName || 'Người dùng'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {user?.email || 'patient@example.com'}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <Chip
                    label={isDemoMode ? 'Chế độ Trang tĩnh' : 'Đã kết nối API'}
                    size="small"
                    color={isDemoMode ? 'success' : 'primary'}
                    icon={<CheckCircleOutlinedIcon />}
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              <MenuItem
                onClick={() => {
                  dispatch(setCurrentTab('profile'));
                  setUserMenuAnchor(null);
                }}
                sx={{ borderRadius: 1.5 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <PersonOutlinedIcon fontSize="small" sx={{ color: '#475569' }} />
                  <Typography variant="body2">Hồ sơ sức khỏe</Typography>
                </Stack>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  dispatch(setCurrentTab('api-audit'));
                  setUserMenuAnchor(null);
                }}
                sx={{ borderRadius: 1.5 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <DnsOutlinedIcon fontSize="small" sx={{ color: '#475569' }} />
                  <Typography variant="body2">Trạng thái API & Kết nối</Typography>
                </Stack>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  dispatch(setServerConfigModalOpen(true));
                  setUserMenuAnchor(null);
                }}
                sx={{ borderRadius: 1.5 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <SettingsEthernetIcon fontSize="small" sx={{ color: '#475569' }} />
                  <Typography variant="body2">Cấu hình máy chủ</Typography>
                </Stack>
              </MenuItem>

              <Divider sx={{ my: 1 }} />

              <MenuItem onClick={handleLogout} sx={{ borderRadius: 1.5, color: 'error.main' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <LogoutIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Đăng xuất
                  </Typography>
                </Stack>
              </MenuItem>
            </Menu>
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
