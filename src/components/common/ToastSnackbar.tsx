import React from 'react';
import { Snackbar, Alert, AlertTitle, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { hideRealtimeToast } from '@/store/slices/uiSlice';

export const ToastSnackbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { realtimeToast } = useAppSelector((state) => state.ui);

  if (!realtimeToast) return null;

  return (
    <Snackbar
      open={realtimeToast.open}
      autoHideDuration={6000}
      onClose={() => dispatch(hideRealtimeToast())}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => dispatch(hideRealtimeToast())}
        severity={
          realtimeToast.type === 'APPOINTMENT'
            ? 'info'
            : realtimeToast.type === 'EXAMINATION'
            ? 'success'
            : 'info'
        }
        variant="filled"
        sx={{ width: '100%', maxWidth: 400, boxShadow: 3 }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>
          {realtimeToast.title || 'Thông báo mới'}
        </AlertTitle>
        <Typography variant="body2">{realtimeToast.message}</Typography>
      </Alert>
    </Snackbar>
  );
};
