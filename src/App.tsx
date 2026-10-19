/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
} from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import { Provider } from "react-redux";
import {
  store,
  useAppDispatch,
  useAppSelector,
  setMemoryAccessToken,
} from "@/store/index";
import { appTheme } from "@/theme/theme";
import { authApi } from "@/api/endpoints/auth.api";
import { decodeAccessToken } from "@/features/auth/utils/decodeAccessToken";
import {
  setCredentials,
  logoutAction,
  setInitializing,
} from "@/store/slices/authSlice";
import { showRealtimeToast } from "@/store/slices/uiSlice";
import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
} from "@/services/socket";

// Components
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationDrawer } from "@/components/common/NotificationDrawer";
import { BackendStatusModal } from "@/components/common/BackendStatusModal";
import { ToastSnackbar } from "@/components/common/ToastSnackbar";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { DoctorDirectoryPage } from "@/features/documentation/doctors/pages/DoctorDirectoryPage";
import { BookingPage } from "@/features/appointments/pages/BookingPage";
import { MyAppointmentsPage } from "@/features/appointments/pages/MyAppointmentsPage";
import { ExaminationsPage } from "@/features/examinations/pages/ExaminationsPage";
import { PrescriptionsPage } from "@/features/prescriptions/pages/PrescriptionsPage";
import { InvoicesPage } from "@/features/invoices/pages/InvoicesPage";
import { ApiAuditPage } from "@/features/documentation/pages/ApiAuditPage";

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitializing, accessToken } = useAppSelector(
    (state) => state.auth,
  );
  const { currentTab } = useAppSelector((state) => state.ui);

  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const refreshRes = await authApi.refreshToken();
        if (!isMounted) return;
        if (refreshRes?.accessToken) {
          const user = decodeAccessToken(refreshRes.accessToken);
          setMemoryAccessToken(refreshRes.accessToken);
          dispatch(
            setCredentials({ user, accessToken: refreshRes.accessToken }),
          );
        } else {
          dispatch(setInitializing(false));
        }
      } catch {
        if (isMounted) {
          setMemoryAccessToken(null);
          dispatch(logoutAction());
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectNotificationsSocket(accessToken, (payload) => {
        dispatch(
          showRealtimeToast({
            title: payload.title || "Thông báo mới",
            message: payload.message || "",
            type: payload.type || "SYSTEM",
          }),
        );
        // Invalidate notifications queries
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
      });
    } else {
      disconnectNotificationsSocket();
    }

    return () => {
      disconnectNotificationsSocket();
    };
  }, [isAuthenticated, accessToken, dispatch]);

  if (isInitializing) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8fafc",
          gap: 2,
        }}
      >
        <CircularProgress color="primary" />
        <Box
          component="span"
          sx={{ color: "text.secondary", fontSize: "0.85rem" }}
        >
          Đang khởi tạo phiên làm việc y tế an toàn...
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, pb: 6 }}>
        {currentTab === "dashboard" && <DashboardPage />}
        {currentTab === "profile" && <ProfilePage />}
        {currentTab === "doctors" && <DoctorDirectoryPage />}
        {currentTab === "booking" && <BookingPage />}
        {currentTab === "appointments" && <MyAppointmentsPage />}
        {currentTab === "examinations" && <ExaminationsPage />}
        {currentTab === "prescriptions" && <PrescriptionsPage />}
        {currentTab === "invoices" && <InvoicesPage />}
        {currentTab === "api-audit" && <ApiAuditPage />}
      </Box>

      {/* Mobile Drawer (Only shown when mobile menu is toggled) */}
      <Sidebar />

      {/* Global Modals & Notifications */}
      <NotificationDrawer />
      <BackendStatusModal />
      <ToastSnackbar />
    </Box>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
