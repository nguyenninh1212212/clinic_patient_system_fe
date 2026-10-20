import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { authApi } from '@/api/endpoints/auth.api';
import { useAppDispatch, setMemoryAccessToken } from '@/store/index';
import { logoutAction, setCredentials } from '@/store/slices/authSlice';

const getReturnUrl = () => {
  const value = new URLSearchParams(window.location.search).get('returnUrl');
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
};

export const AuthCallbackPage = () => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const accessToken = new URLSearchParams(window.location.hash.slice(1)).get('access_token');
    const returnUrl = getReturnUrl();
    window.history.replaceState({}, document.title, '/auth/callback');
    if (!accessToken) { dispatch(logoutAction()); setError('Không nhận được mã truy cập từ nhà cung cấp đăng nhập.'); return; }
    let cancelled = false;
    const completeLogin = async () => {
      try {
        setMemoryAccessToken(accessToken);
        const user = await authApi.getMe(accessToken);
        if (cancelled) return;
        dispatch(setCredentials({ user, accessToken }));
        window.history.replaceState({}, document.title, returnUrl);
      } catch {
        if (!cancelled) { setMemoryAccessToken(null); dispatch(logoutAction()); setError('Không thể hoàn tất đăng nhập. Vui lòng thử lại.'); }
      }
    };
    void completeLogin();
    return () => { cancelled = true; };
  }, [dispatch]);
  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: '#f8fafc' }}><Paper sx={{ p: 4, maxWidth: 460, width: '100%' }}><Stack spacing={2} sx={{ alignItems: 'center' }}>
    {error ? <><Alert severity="error" sx={{ width: '100%' }}>{error}</Alert><Button variant="contained" onClick={() => window.location.assign('/login')}>Quay lại đăng nhập</Button></> : <><CircularProgress /><Typography>Đang hoàn tất đăng nhập an toàn…</Typography></>}
  </Stack></Paper></Box>;
};
