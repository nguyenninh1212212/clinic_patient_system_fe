/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector, setMemoryAccessToken } from './store';
import { appTheme } from './theme';
import { authApi } from './api/auth';
import { setCredentials, logoutAction, setInitializing } from './store/slices/authSlice';
import { showRealtimeToast } from './store/slices/uiSlice';
import { connectNotificationsSocket, disconnectNotificationsSocket } from './api/socket';

// Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { BackendStatusModal } from './components/common/BackendStatusModal';
import { ToastSnackbar } from './components/common/ToastSnackbar';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { DoctorDirectoryPage } from './components/doctors/DoctorDirectoryPage';
import { BookingPage } from './components/appointments/BookingPage';
import { MyAppointmentsPage } from './components/appointments/MyAppointmentsPage';
import { ExaminationsPage } from './components/examinations/ExaminationsPage';
import { PrescriptionsPage } from './components/prescriptions/PrescriptionsPage';
import { InvoicesPage } from './components/invoices/InvoicesPage';
import { ApiAuditPage } from './components/documentation/ApiAuditPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitializing, accessToken } = useAppSelector(
    (state) => state.auth
  );
  const { currentTab } = useAppSelector((state) => state.ui);

  // Silent session restore on app mount via refresh-token cookie
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const refreshRes = await authApi.refreshToken();
        if (refreshRes?.accessToken) {
          setMemoryAccessToken(refreshRes.accessToken);
          // Fetch current user details
          const user = await authApi.getMe();
          if (isMounted) {
            dispatch(
              setCredentials({
                user,
                accessToken: refreshRes.accessToken,
              })
            );
          }
        } else {
          if (isMounted) dispatch(setInitializing(false));
        }
      } catch {
        // No valid refresh cookie or session expired
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

  // Connect Socket.IO for realtime notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectNotificationsSocket(accessToken, (payload) => {
        // Show realtime toast
        dispatch(
          showRealtimeToast({
            title: payload.title || 'Thông báo mới',
            message: payload.message || '',
            type: payload.type || 'SYSTEM',
          })
        );
        // Invalidate notifications queries
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
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
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f8fafc',
          gap: 2,
        }}
      >
        <CircularProgress color="primary" />
        <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          Đang khởi tạo phiên làm việc y tế an toàn...
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, pb: 6 }}>
        {currentTab === 'dashboard' && <DashboardPage />}
        {currentTab === 'profile' && <ProfilePage />}
        {currentTab === 'doctors' && <DoctorDirectoryPage />}
        {currentTab === 'booking' && <BookingPage />}
        {currentTab === 'appointments' && <MyAppointmentsPage />}
        {currentTab === 'examinations' && <ExaminationsPage />}
        {currentTab === 'prescriptions' && <PrescriptionsPage />}
        {currentTab === 'invoices' && <InvoicesPage />}
        {currentTab === 'api-audit' && <ApiAuditPage />}
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
