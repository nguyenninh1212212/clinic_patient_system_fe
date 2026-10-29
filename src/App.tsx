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
  Alert,
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
import {
  setCredentials,
  logoutAction,
  setInitializing,
} from "@/store/slices/authSlice";
import { setCurrentTab, type AppTab } from "@/store/slices/uiSlice";
import { showRealtimeToast } from "@/store/slices/uiSlice";
import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
} from "@/services/socket";

// Components
import { PatientChatWidget } from "@/features/ai-chat/components/PatientChatWidget";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationDrawer } from "@/components/common/NotificationDrawer";
import { ToastSnackbar } from "@/components/common/ToastSnackbar";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { DoctorDirectoryPage } from "@/features/documentation/doctors/pages/DoctorDirectoryPage";
import { BookingPage } from "@/features/appointments/pages/BookingPage";
import { MyAppointmentsPage } from "@/features/appointments/pages/MyAppointmentsPage";

import { PatientPortal } from "@/features/patient-portal/components/PatientPortal";
import { patientTabPaths } from "@/store/tabPersistence";
import { resolveRoute } from "@/routes/access";

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitializing, accessToken, user } = useAppSelector(
    (state) => state.auth,
  );
  const { currentTab } = useAppSelector((state) => state.ui);
  const isAuthCallback = window.location.pathname === "/auth/callback";
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    let readingUrl = false;
    let previousTab = store.getState().ui.currentTab;
    const syncFromUrl = () => {
      const path = window.location.pathname;
      setPathname(path);
      const result = resolveRoute(user?.role, path);
      let tab: AppTab | undefined;
      if (result.area === "patient") {
        tab = /^\/patient\/?$/.test(path)
          ? store.getState().ui.currentTab
          : result.page === "overview"
            ? "dashboard"
            : result.page === "profiles"
              ? "profile"
              : result.page;
      }
      if (tab) {
        readingUrl = true;
        dispatch(setCurrentTab(tab));
        previousTab = tab;
        readingUrl = false;
        const canonical = patientTabPaths[tab];
        if (path !== canonical) {
          window.history.replaceState(
            null,
            "",
            canonical + window.location.search + window.location.hash,
          );
          setPathname(canonical);
        }
      }
    };
    syncFromUrl();
    const unsubscribe = store.subscribe(() => {
      const tab = store.getState().ui.currentTab;
      if (tab === previousTab) return;
      previousTab = tab;
      if (readingUrl) return;
      const result = resolveRoute(user?.role, window.location.pathname);
      if (result.area !== "patient") return;
      const path = patientTabPaths[tab];
      window.history.pushState(null, "", path);
      setPathname(path);
    });
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      unsubscribe();
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (isAuthCallback) {
      dispatch(setInitializing(false));
      return;
    }
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const refreshRes = await authApi.refreshToken();
        if (!isMounted) return;
        if (refreshRes?.accessToken) {
          const user = await authApi.getMe(refreshRes.accessToken);
          if (!isMounted) return;
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
  }, [dispatch, isAuthCallback]);

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
        queryClient.invalidateQueries({ queryKey: ["commerce"] });
        queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      });
    } else {
      disconnectNotificationsSocket();
    }

    return () => {
      disconnectNotificationsSocket();
    };
  }, [isAuthenticated, accessToken, dispatch]);

  if (isAuthCallback) {
    return <AuthCallbackPage />;
  }

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

  const route = resolveRoute(user?.role, pathname);
  if (route.area === "redirect") {
    window.location.replace(route.path);
    return null;
  }
  if (route.area === "denied")
    return (
      <Alert severity="error">Bạn không có quyền truy cập trang này.</Alert>
    );
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
        {currentTab === "examinations" && <PatientPortal page="examinations" />}
        {currentTab === "prescriptions" && <PatientPortal page="prescriptions" />}
        {currentTab === "invoices" && <PatientPortal page="invoices" />}
      </Box>

      <Sidebar />

      <NotificationDrawer />
      <ToastSnackbar />
      <PatientChatWidget key={user?.id} />
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
