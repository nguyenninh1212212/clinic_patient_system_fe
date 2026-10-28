import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import axios from 'axios';
import type { IUser } from '@/types';
import { authApi } from '@/api/endpoints/auth.api';

interface AccountSettingsDialogProps {
  open: boolean;
  user: IUser | null;
  onClose: () => void;
  onUpdated: (user: IUser) => void;
}

export function AccountSettingsDialog({
  open,
  user,
  onClose,
  onUpdated,
}: AccountSettingsDialogProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(user?.fullName ?? '');
    setPhone(user?.phone ?? '');
    setEmail(user?.email ?? '');
    setError(null);
  }, [open, user]);

  const save = async () => {
    const nextFullName = fullName.trim();
    const nextPhone = phone.trim();
    const nextEmail = email.trim();
    if (nextFullName.length < 2) {
      setError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (!nextPhone) {
      setError('Số điện thoại là bắt buộc.');
      return;
    }
    if (nextEmail && !/^\S+@\S+\.\S+$/.test(nextEmail)) {
      setError('Địa chỉ email không đúng định dạng.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.updateMe({
        fullName: nextFullName,
        phone: nextPhone,
        email: nextEmail || null,
      });
      onUpdated(updated);
      onClose();
    } catch (cause) {
      setError(
        axios.isAxiosError(cause)
          ? String(cause.response?.data?.message ?? 'Không thể cập nhật thông tin tài khoản.')
          : 'Không thể cập nhật thông tin tài khoản.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chỉnh sửa thông tin tài khoản</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="Họ và tên"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={saving}
          />
          <TextField
            fullWidth
            required
            label="Số điện thoại"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={saving}
            helperText="Dùng để đăng nhập hoặc liên hệ với phòng khám."
          />
          <TextField
            fullWidth
            label="Địa chỉ email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={saving}
            helperText="Không bắt buộc."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={() => void save()} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Lưu thay đổi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
