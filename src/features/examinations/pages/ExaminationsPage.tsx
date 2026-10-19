import React, { useEffect, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Alert,
  Button,
  CircularProgress,
  TablePagination,
  Chip,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useQuery } from "@tanstack/react-query";
import { appointmentsApi } from "@/api/endpoints/appointments.api";

export const ExaminationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: bookingsRes, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "appointments",
      "my-bookings",
      { page, limit: pageSize, status: "COMPLETED" },
    ],
    queryFn: () =>
      appointmentsApi.getMyBookings({
        page,
        limit: pageSize,
        status: "COMPLETED",
      }),
  });

  const completedBookings = bookingsRes?.data?.data || [];
  const pagination = bookingsRes?.data?.pagination;
  useEffect(() => {
    if (pagination && page > Math.max(1, pagination.totalPages)) setPage(Math.max(1, pagination.totalPages));
  }, [pagination, page]);

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Header */}
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Kết quả Khám bệnh & Chẩn đoán Y khoa
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Tra cứu kết quả khám lâm sàng, mã bệnh ICD-10 và lịch hẹn tái khám
            của bác sĩ
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 2 }}
          >
            Lịch sử các lần khám bệnh đã hoàn thành ({pagination?.total ?? 0})
          </Typography>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress aria-label="Đang tải lịch sử khám" /></Box>
          ) : isError ? (
            <Alert severity="error" action={<Button onClick={() => void refetch()}>Thử lại</Button>}>Không thể tải lịch sử khám. Vui lòng thử lại.</Alert>
          ) : completedBookings.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "#f8fafc",
                borderRadius: 2,
              }}
            >
              <HistoryEduIcon sx={{ fontSize: 44, color: "#94a3b8", mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Chưa ghi nhận lượt khám đã hoàn tất nào
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
              >
                Khi bạn hoàn tất buổi khám tại phòng khám, lượt khám sẽ được
                chuyển trạng thái "Hoàn thành" (COMPLETED).
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {completedBookings.map((b) => (
                <Paper
                  key={b.id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderColor: "#cbd5e1",
                  }}
                >
                  <Grid container spacing={2} sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <Stack spacing={0.75}>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center" }}
                        >
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            Khám cùng:{" "}
                            {b.doctor?.user?.fullName || "Bác sĩ chuyên khoa"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "primary.main", fontWeight: 600 }}
                          >
                            · Khoa: {b.doctor?.specialty?.name || "Đa khoa"}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Thời gian khám:{" "}
                          {new Date(b.appointmentDate).toLocaleString("vi-VN")}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Bệnh nhân: {b.patient?.fullName} (Mã BN:{" "}
                          {b.patient?.patientCode})
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid
                      size={{ xs: 12, sm: 4 }}
                      sx={{ textAlign: { xs: "left", sm: "right" } }}
                    >
                      <Chip
                        icon={<LockIcon sx={{ fontSize: "13px !important" }} />}
                        label="Chờ kích hoạt API bệnh án"
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
          {pagination && !isError && (
            <TablePagination component="div" count={pagination.total} page={Math.min(page - 1, Math.max(0, pagination.totalPages - 1))}
              rowsPerPage={pageSize} rowsPerPageOptions={[5, 10, 20, 50]}
              onPageChange={(_, value) => setPage(value + 1)}
              onRowsPerPageChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}
              labelRowsPerPage="Số lượt khám mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} lượt khám`}
              getItemAriaLabel={type => ({ first: 'Trang đầu', last: 'Trang cuối', previous: 'Trang trước', next: 'Trang sau' })[type]}
              showFirstButton showLastButton
              sx={{ mt: 2, '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'center', px: 0 }, '& .MuiTablePagination-spacer': { display: 'none' } }} />
          )}
        </Box>
      </Stack>
    </Container>
  );
};
