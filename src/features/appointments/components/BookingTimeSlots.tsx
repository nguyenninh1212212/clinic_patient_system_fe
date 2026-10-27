import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { BookingSlot } from "../utils/bookingSlots";

interface Props {
  slots: BookingSlot[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  error: boolean;
  enabled: boolean;
  pending: boolean;
  helperText?: string;
  onRetry: () => void;
}

export function BookingTimeSlots({
  slots,
  value,
  onChange,
  loading,
  error,
  enabled,
  pending,
  helperText,
  onRetry,
}: Props) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Chọn khung giờ khám (30 phút)
      </Typography>
      {!enabled ? (
        <Alert severity="info">
          Chọn bác sĩ và ngày khám để xem khung giờ.
        </Alert>
      ) : loading ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Đang kiểm tra lịch khám...</Typography>
        </Stack>
      ) : error ? (
        <Alert
          severity="error"
          action={<Button onClick={onRetry}>Thử lại</Button>}
        >
          Không thể tải trạng thái khung giờ. Vui lòng thử lại.
        </Alert>
      ) : !slots.length ? (
        <Alert severity="info">
          Bác sĩ chưa có khung giờ khám trong ngày này. Vui lòng chọn ngày khác.
        </Alert>
      ) : (
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary">
            Còn trống · Đang chọn · Đã đặt · Đã qua
          </Typography>
          {[
            { label: "Buổi sáng", afternoon: false },
            { label: "Buổi chiều / tối", afternoon: true },
          ].map((group) => {
            const items = slots.filter(
              (slot) => slot.time >= "12:00" === group.afternoon,
            );
            return (
              items.length > 0 && (
                <Box key={group.label}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, display: "block", mb: 1 }}
                  >
                    {group.label}
                  </Typography>
                  <Box
                    role="group"
                    aria-label={group.label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(112px, 1fr))",
                      gap: 1,
                    }}
                  >
                    {items.map((slot) => (
                      <Button
                        key={slot.time}
                        type="button"
                        aria-pressed={value === slot.time}
                        aria-label={`${slot.time} - ${slot.endTime}, ${slot.status === "booked" ? "Đã đặt" : slot.status === "past" ? "Đã qua" : "Còn trống"}`}
                        disabled={pending || slot.status !== "available"}
                        onClick={() => onChange(slot.time)}
                        variant={value === slot.time ? "contained" : "outlined"}
                        sx={{
                          py: 1,
                          flexDirection: "column",
                          "&.Mui-disabled": {
                            bgcolor:
                              slot.status === "booked" ? "#fff1f2" : "#f1f5f9",
                            color:
                              slot.status === "booked" ? "#be123c" : "#64748b",
                            borderColor:
                              slot.status === "booked" ? "#fecdd3" : "#e2e8f0",
                          },
                        }}
                      >
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ fontWeight: 700 }}
                        >
                          {slot.time} – {slot.endTime}
                        </Typography>
                        <Typography component="span" variant="caption">
                          {slot.status === "booked"
                            ? "Đã đặt"
                            : slot.status === "past"
                              ? "Đã qua"
                              : value === slot.time
                                ? "Đang chọn"
                                : "Còn trống"}
                        </Typography>
                      </Button>
                    ))}
                  </Box>
                </Box>
              )
            );
          })}
        </Stack>
      )}
      {helperText && (
        <Typography variant="caption" color="error" role="alert">
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
