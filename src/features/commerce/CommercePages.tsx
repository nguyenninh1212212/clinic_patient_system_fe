import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MedicationIcon from "@mui/icons-material/Medication";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  commerceApi,
  type PurchaseInvoice,
} from "@/api/endpoints/commerce.api";
import { useAppSelector } from "@/store/index";
const money = (value: string | number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value),
  );
const labels: Record<string, string> = {
  DRAFT: "Bản nháp",
  ISSUED: "Đã phát hành",
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  PENDING: "Chờ chuẩn bị",
  PREPARING: "Đang chuẩn bị",
  READY: "Sẵn sàng nhận",
  DISPENSED: "Đã bàn giao",
  SUCCESS: "Thành công",
  PROCESSING: "Đang xử lý",
  EXPIRED: "Hết hạn",
  FAILED: "Thất bại",
};
const errorText = (error: unknown) =>
  isAxiosError(error)
    ? Array.isArray(error.response?.data?.message)
      ? error.response.data.message.join(", ")
      : error.response?.data?.message ||
        "Không thể thực hiện. Vui lòng thử lại."
    : error instanceof Error
      ? error.message
      : "Không thể thực hiện";
const State = ({ value }: { value: string | null }) => (
  <Chip
    size="small"
    label={value ? labels[value] || value : "Hóa đơn lịch sử"}
  />
);
function useRefresh() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["commerce"] });
}

function formatCurrency(amount:number, locale = 'vi-VN', currency = 'VND') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function PatientPrescriptionPurchases({
  patientId: providedId,
}: {
  patientId?: string;
}) {
  const profile = useAppSelector((s) => s.profile) as any;
  const actorId = useAppSelector((s) => s.auth.user?.id);
  const patientId =
    providedId || profile.activePatientId || profile.defaultPatientId || "";
  const refresh = useRefresh();
  const [selected, setSelected] = useState<PurchaseInvoice | null>(null);
  const [declined, setDeclined] = useState<string[]>([]);
  const query = useQuery({
    queryKey: ["commerce", actorId, "prescriptions", patientId],
    queryFn: () => commerceApi.prescriptions(patientId),
    enabled: !!patientId,
  });
  const invoiceQuery = useQuery({
    queryKey: ["commerce", actorId, "invoices-by-prescription", patientId],
    queryFn: () => commerceApi.invoices({ patientId, page: 1, limit: 100 }),
    enabled: !!patientId,
  });
  const paidPrescriptionIds = new Set(
    invoiceQuery.data?.data
      .filter(
        (invoice) =>
          invoice.status === "PAID" && invoice.prescription_id !== null,
      )
      .map((invoice) => invoice.prescription_id) ?? [],
  );
  const purchase = useMutation({
    mutationFn: ({
      id,
      channel,
    }: {
      id: string;
      channel: "COUNTER" | "ONLINE";
    }) => commerceApi.purchase(id, channel),
    onSuccess: (invoice) => {
      setSelected(invoice);
      void refresh();
    },
  });
  if (!patientId)
    return (
      <Alert severity="info">Chọn hồ sơ bệnh nhân để xem đơn thuốc.</Alert>
    );
  return (
    <Container disableGutters maxWidth={false}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <MedicationIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
            Đơn thuốc điện tử
          </Typography>
        </Stack>
        <Typography>
          Bạn có thể chọn mua thuốc hoặc quyết định sau. Hóa đơn chỉ được tạo
          khi bạn xác nhận mua.
        </Typography>
        {query.isPending && <CircularProgress />}
        {query.isError && (
          <Alert severity="error">{errorText(query.error)}</Alert>
        )}
        {purchase.isError && (
          <Alert severity="error">{errorText(purchase.error)}</Alert>
        )}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}
        >
          <Table aria-label="Đơn thuốc điện tử" sx={{ minWidth: 740 }}>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell>Ngày kê đơn</TableCell>
                <TableCell>Thuốc và chỉ định</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {query.data?.data
                .filter((p) => p.status === "ISSUED")
                .map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell
                      sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}
                    >
                      {p.issuedAt
                        ? new Date(p.issuedAt).toLocaleDateString("vi-VN")
                        : "—"}
                      <Typography
                        variant="caption"
                        sx={{ display: "block" }}
                        color="text.secondary"
                      >
                        Hạn dùng: {p.validUntil || "Theo chỉ định"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {p.items.map((item) => {
                        return <Box key={item.id} sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.medicine.name} · {item.quantity}{" "}
                            {item.medicine.unit} · {formatCurrency(item.medicine.sellingPrice)}{" "}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.dosage}, {item.frequency}, {item.duration}
                          </Typography>
                        </Box>;
                      })}
                      {p.notes && (
                        <Typography variant="body2" color="text.secondary">
                          {p.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <State value={p.status} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 250 }}>
                      {paidPrescriptionIds.has(p.id) ? (
                        <Chip
                          color="success"
                          label="Đã thanh toán"
                          size="small"
                          variant="outlined"
                        />
                      ) : declined.includes(p.id) ? (
                        <Alert
                          severity="info"
                          action={
                            <Button
                              onClick={() =>
                                setDeclined((list) =>
                                  list.filter((id) => id !== p.id),
                                )
                              }
                            >
                              Chọn lại
                            </Button>
                          }
                        >
                          Chưa mua thuốc. Đơn thuốc vẫn được giữ.
                        </Alert>
                      ) : (
                        <Stack
                          direction="row"
                          sx={{ gap: 1, flexWrap: "wrap" }}
                        >
                          <Button
                            disabled={purchase.isPending}
                            onClick={() =>
                              purchase.mutate({ id: p.id, channel: "COUNTER" })
                            }
                          >
                            Xác nhận mua tại quầy
                          </Button>
                          <Button
                            variant="contained"
                            disabled={purchase.isPending}
                            onClick={() =>
                              purchase.mutate({ id: p.id, channel: "ONLINE" })
                            }
                          >
                            Xác nhận mua online
                          </Button>
                          <Button
                            onClick={() =>
                              setDeclined((list) => [...list, p.id])
                            }
                          >
                            Chưa mua
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {query.isSuccess &&
          !query.data.data.some((p) => p.status === "ISSUED") && (
            <Alert severity="info">Chưa có đơn thuốc đã phát hành.</Alert>
          )}
      </Stack>
      <InvoiceDialog
        key={selected?.id}
        id={selected?.id || null}
        onClose={() => setSelected(null)}
      />
    </Container>
  );
}

function InvoiceDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const actorId = useAppSelector((s) => s.auth.user?.id);
  const refresh = useRefresh();
  const [reason, setReason] = useState("");
  const detail = useQuery({
    queryKey: ["commerce", actorId, "invoice", id],
    queryFn: () => commerceApi.invoice(id!),
    enabled: !!id,
    refetchInterval: (q) =>
      ["PENDING_PAYMENT", "PAID", "REFUND_PENDING"].includes(
        q.state.data?.status || "",
      )
        ? 5000
        : false,
  });
  const history = useQuery({
    queryKey: ["commerce", actorId, "payments", id],
    queryFn: () => commerceApi.payments(id!),
    enabled: !!id,
    refetchInterval: id ? 5000 : false,
  });
  const action = useMutation({
    mutationFn: (command: "zalopay" | "cancel" | "refund") =>
      command === "refund"
        ? commerceApi.refund(id!, reason)
        : commerceApi[command](id!),
    onSuccess: () => void refresh(),
  });
  const invoice = detail.data;
  const checkout = history.data?.find(
    (p) =>
      p.method === "ZALOPAY" &&
      ["PENDING", "PROCESSING"].includes(p.status) &&
      p.checkout_url,
  );
  return (
    <Dialog open={!!id} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Chi tiết hóa đơn</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {detail.isPending && <CircularProgress />}
          {detail.isError && (
            <Alert severity="error">{errorText(detail.error)}</Alert>
          )}
          {action.isError && (
            <Alert severity="error">{errorText(action.error)}</Alert>
          )}
          {invoice && (
            <>
              <Typography>{invoice.invoice_number}</Typography>
              <State value={invoice.status} />
              <Typography>Tổng tiền: {money(invoice.total_amount)}</Typography>
              {invoice.items?.map((item) => (
                <Typography key={item.id}>
                  {item.description} · {item.quantity} ×{" "}
                  {money(item.unit_price)} = {money(item.line_total)}
                </Typography>
              ))}
              {invoice.dispensing && (
                <Typography>
                  Nhà thuốc: {labels[invoice.dispensing.status]}
                </Typography>
              )}
              {invoice.status === "PENDING_PAYMENT" && (
                <>
                  <Alert severity="info">
                    Thuốc được giữ trong 15 phút. Nếu quá hạn, hệ thống kiểm tra
                    lại tồn kho. Bạn có thể thanh toán tại quầy hoặc qua
                    ZaloPay.
                  </Alert>
                  <Button
                    disabled={action.isPending}
                    onClick={() => action.mutate("zalopay")}
                  >
                    Tạo / xem thanh toán ZaloPay
                  </Button>
                  {checkout?.checkout_url && (
                    <Button
                      href={checkout.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                    >
                      Mở ZaloPay để thanh toán / xem QR
                    </Button>
                  )}
                  <Button
                    disabled={action.isPending}
                    onClick={() => action.mutate("cancel")}
                  >
                    Hủy hóa đơn chưa thanh toán
                  </Button>
                </>
              )}
              {invoice.status === "PAID" &&
                invoice.dispensing?.status !== "DISPENSED" && (
                  <>
                    <TextField
                      label="Lý do yêu cầu hoàn tiền"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      slotProps={{ htmlInput: { maxLength: 500 } }}
                    />
                    <Button
                      disabled={action.isPending || !reason.trim()}
                      onClick={() => action.mutate("refund")}
                    >
                      Yêu cầu hoàn tiền trước bàn giao
                    </Button>
                  </>
                )}
              <Divider />
              <Typography variant="h6">Lịch sử giao dịch</Typography>
              {history.isError && (
                <Alert severity="error">{errorText(history.error)}</Alert>
              )}
              {history.data?.map((payment) => (
                <Typography key={payment.id}>
                  {payment.method} · {money(payment.amount)} ·{" "}
                  {labels[payment.status] || payment.status}
                </Typography>
              ))}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
export function CommerceInvoicesPage({ patientId }: { patientId: string }) {
  const actorId = useAppSelector((s) => s.auth.user?.id);
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const invoices = useQuery({
    queryKey: ["commerce", actorId, "invoices", patientId, page, search],
    queryFn: () =>
      commerceApi.invoices({ patientId, page, search: search || undefined }),
    enabled: !!patientId,
  });
  return (
    <Container disableGutters maxWidth={false}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <ReceiptLongIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
            Hóa đơn viện phí
          </Typography>
        </Stack>
        <TextField
          label="Tìm hóa đơn"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {invoices.isFetching && <CircularProgress size={20} />}
        {invoices.isError && (
          <Alert severity="error">{errorText(invoices.error)}</Alert>
        )}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}
        >
          <Table aria-label="Hóa đơn viện phí" sx={{ minWidth: 600 }}>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell>Mã hóa đơn</TableCell>
                <TableCell align="right">Tổng tiền</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.data?.data.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: "primary.dark" }}>
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {money(invoice.total_amount)}
                  </TableCell>
                  <TableCell>
                    <State value={invoice.status} />
                  </TableCell>
                  <TableCell align="right">
                    {invoice.status === "PAID" ? (
                      <Button
                        size="small"
                        onClick={() => setSelected(invoice.id)}
                        aria-label="Xem chi tiết hóa đơn đã thanh toán"
                      >
                        Xem chi tiết
                      </Button>
                    ) : (
                    <Button
                      size="small"
                      onClick={() => setSelected(invoice.id)}
                    >
                      Chi tiết / thanh toán
                    </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {invoices.isSuccess && !invoices.data.data.length && (
          <Alert severity="info">Bạn chưa có hóa đơn.</Alert>
        )}
        <Pagination
          page={page}
          count={Math.max(1, invoices.data?.pagination.totalPages || 1)}
          onChange={(_, p) => setPage(p)}
        />
      </Stack>
      <InvoiceDialog
        key={selected}
        id={selected}
        onClose={() => setSelected(null)}
      />
    </Container>
  );
}
