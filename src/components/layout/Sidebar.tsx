import { authApi } from "@/api/endpoints/auth.api";
import { setMemoryAccessToken, useAppDispatch, useAppSelector } from "@/store/index";
import { logoutAction } from "@/store/slices/authSlice";
import { clearActiveProfile } from "@/store/slices/profileSlice";
import {
  AppTab,
  setCurrentTab,
  setMobileSidebarOpen,
  setServerConfigModalOpen,
} from "@/store/slices/uiSlice";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LogoutIcon from "@mui/icons-material/Logout";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

interface NavGroup {
  title: string;
  items: Array<{
    id: AppTab;
    label: string;
    icon: React.ReactElement;
  }>;
}

const navGroups: NavGroup[] = [
  {
    title: "DỊCH VỤ KHÁM CHỮA BỆNH",
    items: [
      {
        id: "dashboard",
        label: "Trang chủ Tổng quan",
        icon: <SpaceDashboardOutlinedIcon fontSize="small" />,
      },
      {
        id: "booking",
        label: "Đặt lịch khám",
        icon: <CalendarMonthOutlinedIcon fontSize="small" />,
      },
      {
        id: "doctors",
        label: "Tìm kiếm Bác sĩ",
        icon: <PersonSearchOutlinedIcon fontSize="small" />,
      },
      {
        id: "appointments",
        label: "Lịch hẹn của tôi",
        icon: <EventNoteOutlinedIcon fontSize="small" />,
      },
    ],
  },
  {
    title: "HỒ SƠ ĐIỆN TỬ & VIỆN PHÍ",
    items: [
      {
        id: "examinations",
        label: "Kết quả khám bệnh",
        icon: <AssignmentOutlinedIcon fontSize="small" />,
      },
      {
        id: "prescriptions",
        label: "Đơn thuốc điện tử",
        icon: <MedicationOutlinedIcon fontSize="small" />,
      },
      {
        id: "invoices",
        label: "Hóa đơn viện phí",
        icon: <ReceiptLongOutlinedIcon fontSize="small" />,
      },
      {
        id: "profile",
        label: "Hồ sơ sức khỏe",
        icon: <BadgeOutlinedIcon fontSize="small" />,
      },
    ],
  },
];

export const MOBILE_DRAWER_WIDTH = 290;

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentTab, mobileSidebarOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const { activePatientName, isRelative } = useAppSelector(
    (state) => state.profile,
  );

  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore
    } finally {
      setMemoryAccessToken(null);
      dispatch(logoutAction());
      dispatch(clearActiveProfile());
    }
  };

  const handleTabClick = (tabId: AppTab) => {
    dispatch(setCurrentTab(tabId));
    dispatch(setMobileSidebarOpen(false));
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#ffffff",
      }}
    >
      {/* Drawer Header Brand & Close Button */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
            }}
          >
            <LocalHospitalIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "primary.dark",
                lineHeight: 1.2,
              }}
            >
              CỔNG BỆNH NHÂN
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.725rem" }}
            >
              Phòng khám Thông minh
            </Typography>
          </Box>
        </Stack>

        <IconButton
          size="small"
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          sx={{ color: "#64748b", "&:hover": { bgcolor: "#f1f5f9" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

 

      {/* Navigation Group Items */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={2.5}>
          {navGroups.map((group) => (
            <Box key={group.title}>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  mb: 0.75,
                  display: "block",
                  fontWeight: 700,
                  fontSize: "0.675rem",
                  letterSpacing: 0.6,
                  color: "#94a3b8",
                }}
              >
                {group.title}
              </Typography>

              <Stack spacing={0.5}>
                {group.items.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <Button
                      key={item.id}
                      fullWidth
                      startIcon={
                        <Box
                          sx={{
                            color: isActive ? "primary.main" : "#64748b",
                            display: "flex",
                          }}
                        >
                          {item.icon}
                        </Box>
                      }
                      onClick={() => handleTabClick(item.id)}
                      sx={{
                        justifyContent: "flex-start",
                        px: 1.5,
                        py: 0.9,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "0.875rem",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "primary.dark" : "#334155",
                        bgcolor: isActive ? "#f0f9ff" : "transparent",
                        borderLeft: isActive
                          ? "3px solid #0284c7"
                          : "3px solid transparent",
                        "&:hover": {
                          bgcolor: isActive ? "#e0f2fe" : "#f8fafc",
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* Footer User Info & Logout in Mobile Drawer */}
      <Box sx={{ p: 2, bgcolor: "#f8fafc" }}>
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ minWidth: 0, mr: 1 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 700, color: "#0f172a" }}
              >
                {user?.fullName || "Bệnh nhân"}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "text.secondary", display: "block" }}
              >
                {user?.email || "patient@example.com"}
              </Typography>
            </Box>
            <Chip
              label="Bệnh nhân"
              size="small"
              sx={{
                fontSize: "0.675rem",
                height: 20,
                bgcolor: "#e2e8f0",
                fontWeight: 600,
              }}
            />
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<SettingsEthernetIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                dispatch(setMobileSidebarOpen(false));
                dispatch(setServerConfigModalOpen(true));
              }}
              sx={{
                py: 0.6,
                fontSize: "0.75rem",
                borderColor: "#cbd5e1",
                color: "#475569",
                bgcolor: "#ffffff",
                textTransform: "none",
              }}
            >
              Máy chủ
            </Button>

            <Tooltip title="Đăng xuất">
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleLogout}
                sx={{
                  py: 0.6,
                  px: 1.5,
                  minWidth: "auto",
                  borderColor: "#fca5a5",
                  bgcolor: "#ffffff",
                }}
              >
                <LogoutIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );

  return (
    /* Only rendered as a temporary slide-out Drawer on mobile when menu is clicked! */
    <Drawer
      variant="temporary"
      open={mobileSidebarOpen}
      onClose={() => dispatch(setMobileSidebarOpen(false))}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          boxSizing: "border-box",
          width: MOBILE_DRAWER_WIDTH,
          border: "none",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
