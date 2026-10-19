import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CircleIcon from '@mui/icons-material/Circle';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { setNotificationDrawerOpen } from '@/store/slices/uiSlice';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints/notifications.api';

export const NotificationDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { notificationDrawerOpen } = useAppSelector((state) => state.ui);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.getNotifications({ page: 1, limit: 15 }),
    enabled: notificationDrawerOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.notifications || [];
  const unReadCount = data?.unRead || 0;

  return (
    <Drawer
      anchor="right"
      open={notificationDrawerOpen}
      onClose={() => dispatch(setNotificationDrawerOpen(false))}
      slotProps={{
        paper: {
          sx: { width: { xs: '100%', sm: 420 }, p: 0, bgcolor: '#ffffff' },
        },
      }}
    >
      <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Thông báo
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {unReadCount > 0
                ? `Bạn có ${unReadCount} thông báo chưa đọc`
                : 'Đã đọc tất cả thông báo'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => dispatch(setNotificationDrawerOpen(false))}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body2">
              Không thể tải danh sách thông báo từ máy chủ.
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Chưa có thông báo nào dành cho bạn.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 2.5,
                    py: 2,
                    bgcolor: item.isRead ? '#ffffff' : '#f0f9ff',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: '#f8fafc',
                    },
                  }}
                  secondaryAction={
                    !item.isRead ? (
                      <IconButton
                        edge="end"
                        size="small"
                        title="Đánh dấu đã đọc"
                        onClick={() => markReadMutation.mutate(item.id)}
                        disabled={markReadMutation.isPending}
                      >
                        <DoneAllIcon fontSize="small" color="primary" />
                      </IconButton>
                    ) : null
                  }
                >
                  <Box sx={{ mr: 1.5, mt: 0.5 }}>
                    {!item.isRead ? (
                      <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                    ) : (
                      <CircleIcon sx={{ fontSize: 8, color: '#cbd5e1' }} />
                    )}
                  </Box>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: item.isRead ? 600 : 700,
                            color: item.isRead ? 'text.primary' : 'primary.dark',
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.type || 'HỆ THỐNG'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: item.type === 'APPOINTMENT' ? '#dbeafe' : '#f1f5f9',
                            color: item.type === 'APPOINTMENT' ? '#1e40af' : '#475569',
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.85rem',
                            mb: 0.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {new Date(item.createdAt).toLocaleString('vi-VN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
          Thông báo được đồng bộ thời gian thực qua kênh an toàn WebSocket.
        </Typography>
      </Box>
    </Drawer>
  );
};
