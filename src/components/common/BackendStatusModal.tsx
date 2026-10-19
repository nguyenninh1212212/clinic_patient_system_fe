import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setCustomApiBaseUrl,
  setServerConfigModalOpen,
} from '../../store/slices/uiSlice';
import { updateApiBaseUrl } from '../../api/client';
import axios from 'axios';

export const BackendStatusModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { serverConfigModalOpen, customApiBaseUrl } = useAppSelector(
    (state) => state.ui
  );

  const [inputUrl, setInputUrl] = useState(customApiBaseUrl);
  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'failed'
  >('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await axios.get(`${inputUrl}/specialties/all`, {
        timeout: 4000,
        withCredentials: true,
      });
      setTestStatus('success');
      setTestMessage(
        `Kết nối thành công (Mã ${res.status}). Máy chủ phản hồi hợp lệ.`
      );
    } catch (err: unknown) {
      setTestStatus('failed');
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setTestMessage(
          `Lỗi kết nối: ${(err as { message: string }).message}. Lưu ý kiểm tra CORS và đảm bảo NestJS đang chạy tại ${inputUrl}`
        );
      } else {
        setTestMessage('Không thể kết nối đến địa chỉ máy chủ.');
      }
    }
  };

  const handleSave = () => {
    const cleanedUrl = inputUrl.trim().replace(/\/+$/, '');
    dispatch(setCustomApiBaseUrl(cleanedUrl));
    updateApiBaseUrl(cleanedUrl);
    dispatch(setServerConfigModalOpen(false));
  };

  return (
    <Dialog
      open={serverConfigModalOpen}
      onClose={() => dispatch(setServerConfigModalOpen(false))}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Cấu hình kết nối Backend NestJS
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Cổng bệnh nhân kết nối trực tiếp với backend NestJS qua REST API và
            Socket.IO. Mặc định là{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              http://localhost:8000
            </Box>
            .
          </Typography>

          <Alert severity="info" sx={{ fontSize: '0.825rem' }}>
            <Box sx={{ fontWeight: 600, mb: 0.5 }}>Lưu ý về CORS và Cookie:</Box>
            Backend NestJS được thiết lập CORS cho phép{' '}
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              http://localhost:3000
            </Box>{' '}
            kèm{' '}
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              credentials: true
            </Box>
            . Refresh token được truyền tự động qua HTTP-only cookie.
          </Alert>

          <TextField
            label="Địa chỉ máy chủ Backend (API Base URL)"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="http://localhost:8000"
            fullWidth
            helperText="Thay đổi nếu backend của bạn chạy trên cổng hoặc host khác"
          />

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !inputUrl}
              startIcon={
                testStatus === 'testing' ? (
                  <CircularProgress size={16} />
                ) : undefined
              }
            >
              Kiểm tra kết nối (Ping)
            </Button>
            {testStatus === 'success' && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'success.main' }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Trực tuyến
                </Typography>
              </Stack>
            )}
            {testStatus === 'failed' && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'error.main' }}>
                <ErrorOutlinedIcon fontSize="small" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Không kết nối được
                </Typography>
              </Stack>
            )}
          </Stack>

          {testMessage && (
            <Alert
              severity={testStatus === 'success' ? 'success' : 'warning'}
              sx={{ fontSize: '0.8rem' }}
            >
              {testMessage}
            </Alert>
          )}

          <Divider />

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Biến môi trường Vite:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                bgcolor: '#f1f5f9',
                p: 1,
                borderRadius: 1,
                display: 'block',
              }}
            >
              VITE_API_BASE_URL="{customApiBaseUrl}"
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => dispatch(setServerConfigModalOpen(false))}
          color="inherit"
        >
          Đóng
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Lưu cấu hình
        </Button>
      </DialogActions>
    </Dialog>
  );
};
