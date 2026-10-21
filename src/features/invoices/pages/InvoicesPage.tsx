import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Pagination as MuiPagination,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/api/endpoints/invoices.api";
import { patientsApi } from "@/api/endpoints/patients.api";
import {
  CreateInvoicePayload,
  CreateInvoiceItemPayload,
  InvoiceDTO,
  InvoiceItemType,
} from "@/types/index";
import { demoMedicines } from "@/api/demoData";

// Safe currency formatting function handling PostgreSQL numeric strings
export const formatCurrency = (
  val: string | number | null | undefined,
): string => {
  if (val === null || val === undefined) return "0 ₫";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
};

export const InvoicesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Dialogs state
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null,
  );

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Create form state
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerPhone, setBuyerPhone] = useState<string>("");
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [buyerAddress, setBuyerAddress] = useState<string>("");
  const [buyerTaxCode, setBuyerTaxCode] = useState<string>("");
  const [patientId, setPatientId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const [items, setItems] = useState<CreateInvoiceItemPayload[]>([
    {
      itemType: "COST",
      description: "Phí khám tổng quát chuyên khoa",
      quantity: 1,
      unitPrice: 150000,
    },
  ]);

  const {
    data: invoicesRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invoices", { page: currentPage, limit: pageSize }],
    queryFn: () =>
      invoicesApi.getInvoices({ page: currentPage, limit: pageSize }),
  });
  console.log("🚀 ~ InvoicesPage ~ invoicesRes:", invoicesRes);

  const { data: myPatientRes } = useQuery({
    queryKey: ["patient", "me"],
    queryFn: patientsApi.getMyPatient,
  });

  // const { data: accessiblePatientsRes } = useQuery({
  //   queryKey: ["user-patient-access", "my-patients"],
  //   queryFn: patientsApi.getMyAccessiblePatients,
  // });

  const invoices = invoicesRes?.data || [];
  const pagination = invoicesRes?.pagination;
  const myPatient = myPatientRes;
  // const accessiblePatients = accessiblePatientsRes?.data || [];

  // Mutation: Create Invoice
  const createMutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) =>
      invoicesApi.createInvoice(payload),
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setCreateDialogOpen(false);
      resetCreateForm();
      setSelectedInvoice(newInvoice);
      setDetailDialogOpen(true);
    },
    onError: (err: unknown) => {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axErr = err as {
          response?: { data?: { message?: string | string[] } };
        };
        const msg = axErr.response?.data?.message;
        setFormError(
          Array.isArray(msg) ? msg.join(", ") : msg || "Không thể tạo hóa đơn.",
        );
      } else {
        setFormError("Không thể tạo hóa đơn. Vui lòng kiểm tra lại thông tin.");
      }
    },
  });

  // Mutation: Import Excel
  const importMutation = useMutation({
    mutationFn: (file: File) => invoicesApi.importExcel(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setImportSuccess(
        res?.message || "Nhập dữ liệu Excel hóa đơn thành công!",
      );
      setImportFile(null);
    },
    onError: (err: unknown) => {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axErr = err as {
          response?: { data?: { message?: string | string[] } };
        };
        const msg = axErr.response?.data?.message;
        setImportError(
          Array.isArray(msg) ? msg.join(", ") : msg || "Lỗi khi nhập dữ liệu.",
        );
      } else {
        setImportError("Không thể nhập file Excel.");
      }
    },
  });

  const resetCreateForm = () => {
    setBuyerName("");
    setBuyerPhone("");
    setBuyerEmail("");
    setBuyerAddress("");
    setBuyerTaxCode("");
    setPatientId("");
    setInvoiceNumber("");
    setNotes("");
    setItems([
      {
        itemType: "COST",
        description: "Phí khám tổng quát chuyên khoa",
        quantity: 1,
        unitPrice: 150000,
      },
    ]);
    setFormError(null);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemType: "COST",
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreateInvoiceItemPayload,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "itemType" && value === "MEDICINE") {
          updated.description = undefined;
          if (!updated.medicineId) updated.medicineId = "";
        } else if (field === "itemType" && value === "COST") {
          updated.medicineId = undefined;
        }
        return updated;
      }),
    );
  };

  // Calculate preview subtotal
  const calculatedTotal = items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unitPrice) || 0;
    return sum + q * p;
  }, 0);

  const handleSubmitCreate = () => {
    if (!buyerName.trim()) {
      setFormError(
        "Vui lòng nhập tên người mua hàng / đơn vị nhận hóa đơn (bắt buộc).",
      );
      return;
    }

    if (items.length === 0) {
      setFormError("Hóa đơn phải có ít nhất một dòng hàng hóa / dịch vụ.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.quantity <= 0) {
        setFormError(`Dòng #${i + 1}: Số lượng phải lớn hơn 0.`);
        return;
      }
      if (it.unitPrice < 0) {
        setFormError(`Dòng #${i + 1}: Đơn giá không được âm.`);
        return;
      }
      if (it.itemType === "COST" && !it.description?.trim()) {
        setFormError(`Dòng #${i + 1}: Vui lòng nhập mô tả khoản phí.`);
        return;
      }
      if (it.itemType === "MEDICINE" && !it.medicineId?.trim()) {
        setFormError(`Dòng #${i + 1}: Vui lòng nhập mã thuốc (medicineId).`);
        return;
      }
    }

    createMutation.mutate({
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim() || undefined,
      buyerEmail: buyerEmail.trim() || undefined,
      buyerAddress: buyerAddress.trim() || undefined,
      buyerTaxCode: buyerTaxCode.trim() || undefined,
      patientId: patientId.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map((it) => ({
        itemType: it.itemType,
        medicineId:
          it.itemType === "MEDICINE" ? it.medicineId?.trim() : undefined,
        description:
          it.itemType === "COST" ? it.description?.trim() : undefined,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
    });
  };

  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      await invoicesApi.exportExcel();
    } catch {
      alert("Không thể xuất file Excel toàn bộ hóa đơn.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingle = async (id: string) => {
    try {
      await invoicesApi.exportExcel(id);
    } catch {
      alert("Không thể xuất file Excel cho hóa đơn này.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Page Title & Action Bar */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              Quản lý Hóa đơn Viện phí
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              Quản lý danh sách, lập hóa đơn viện phí, nhập/xuất bảng kê Excel
              theo chuẩn kế toán bệnh viện
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                isExporting ? (
                  <CircularProgress size={16} />
                ) : (
                  <FileDownloadIcon />
                )
              }
              onClick={handleExportAll}
              disabled={isExporting}
            >
              Xuất Excel
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={() => {
                setImportDialogOpen(true);
                setImportError(null);
                setImportSuccess(null);
                setImportFile(null);
              }}
            >
              Nhập Excel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                resetCreateForm();
                setCreateDialogOpen(true);
              }}
            >
              Tạo hóa đơn mới
            </Button>
          </Stack>
        </Stack>

        {/* Invoices List Table */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.5,
            bgcolor: "#ffffff",
            borderColor: "#e2e8f0",
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="error" variant="body1">
                Không thể tải danh sách hóa đơn từ máy chủ. Vui lòng kiểm tra
                lại kết nối backend.
              </Typography>
            </Box>
          ) : invoices.length === 0 ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <ReceiptLongIcon
                sx={{ fontSize: 52, color: "#94a3b8", mb: 1.5 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chưa có hóa đơn nào
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}
              >
                Bắt đầu tạo hóa đơn viện phí đầu tiên hoặc nhập dữ liệu từ file
                Excel.
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetCreateForm();
                  setCreateDialogOpen(true);
                }}
              >
                Tạo hóa đơn ngay
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Số HĐ
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Người mua / Đơn vị
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Bệnh nhân liên kết
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Ngày lập
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "text.secondary",
                        textAlign: "right",
                      }}
                    >
                      Tổng tiền (VNĐ)
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Ghi chú
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "text.secondary",
                        textAlign: "center",
                      }}
                    >
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
                    >
                      <TableCell
                        sx={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "primary.dark",
                        }}
                      >
                        {inv.invoiceNumber || inv.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {inv.buyerName}
                        </Typography>
                        {inv.buyerPhone && (
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block" }}
                          >
                            SĐT: {inv.buyerPhone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {inv.patient ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ alignItems: "center" }}
                          >
                            <PersonOutlinedIcon
                              sx={{ fontSize: 16, color: "primary.main" }}
                            />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {inv.patient.fullName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                Mã BN: {inv.patient.patientCode}
                              </Typography>
                            </Box>
                          </Stack>
                        ) : inv.patientId ? (
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: "monospace",
                              color: "text.secondary",
                            }}
                          >
                            Mã: {inv.patientId.slice(0, 8)}...
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: "#94a3b8", fontStyle: "italic" }}
                          >
                            Khách ngoài / Chưa liên kết
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.85rem" }}>
                        {new Date(inv.createdAt).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {formatCurrency(inv.totalAmount)}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          color: "text.secondary",
                          maxWidth: 180,
                        }}
                      >
                        {inv.notes || "—"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ justifyContent: "center" }}
                        >
                          <Tooltip title="Xem chi tiết hóa đơn">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <VisibilityIcon
                                fontSize="small"
                                color="primary"
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tải Excel hóa đơn này">
                            <IconButton
                              size="small"
                              onClick={() => handleExportSingle(inv.id)}
                            >
                              <FileDownloadIcon
                                fontSize="small"
                                sx={{ color: "#059669" }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 2,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <MuiPagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Paper>

        {/* DIALOG 1: TẠO HÓA ĐƠN MỚI */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              pb: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Lập Hóa đơn viện phí mới</span>
            <IconButton size="small" onClick={() => setCreateDialogOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              {formError && <Alert severity="error">{formError}</Alert>}

              {/* Thông tin người mua */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, mb: 1.5, color: "primary.dark" }}
                >
                  1. Thông tin khách hàng / Người nhận hóa đơn
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Họ và tên người mua *"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="0901234567"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Địa chỉ Email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="buyer@example.com"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Mã số thuế"
                      value={buyerTaxCode}
                      onChange={(e) => setBuyerTaxCode(e.target.value)}
                      placeholder="0312345678"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Liên kết bệnh nhân & Số hóa đơn */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, mb: 1.5, color: "primary.dark" }}
                >
                  2. Thông tin đối soát viện phí
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="select-patient-label">
                        Bệnh nhân liên kết (Tùy chọn)
                      </InputLabel>
                      <Select
                        labelId="select-patient-label"
                        label="Bệnh nhân liên kết (Tùy chọn)"
                        value={patientId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatientId(val);
                          // Auto fill buyerName if empty
                          if (!buyerName) {
                            if (myPatient && myPatient.id === val) {
                              setBuyerName(myPatient.fullName);
                              if (myPatient.phone)
                                setBuyerPhone(myPatient.phone);
                              if (myPatient.address)
                                setBuyerAddress(myPatient.address);
                            } else {
                              // const rel = accessiblePatients.find(
                              //   (p) => p.patient.id === val,
                              // );
                              // if (rel) {
                              //   setBuyerName(rel.patient.fullName);
                              //   if (rel.patient.phone)
                              //     setBuyerPhone(rel.patient.phone);
                              // }
                            }
                          }
                        }}
                      >
                        <MenuItem value="">
                          Không liên kết hồ sơ bệnh nhân
                        </MenuItem>
                        {myPatient && (
                          <MenuItem value={myPatient.id}>
                            {myPatient.fullName} (Bản thân - Mã BN:{" "}
                            {myPatient.patientCode})
                          </MenuItem>
                        )}
                        {/* {accessiblePatients.map((a) => (
                          <MenuItem key={a.patient.id} value={a.patient.id}>
                            {a.patient.fullName} (Người thân - Mã:{" "}
                            {a.patient.patientCode})
                          </MenuItem>
                        ))} */}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Số hóa đơn (Để trống hệ thống tự sinh)"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="HD-2026-..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Ghi chú hóa đơn"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú viện phí hoặc điều khoản thanh toán..."
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Dòng hàng hóa / Dịch vụ */}
              <Box>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "primary.dark" }}
                  >
                    3. Bảng kê Dịch vụ / Thuốc trong hóa đơn *
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                  >
                    Thêm dòng
                  </Button>
                </Stack>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1.5 }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 140 }}>
                          Loại mục
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Nội dung / Mã thuốc
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 100 }}>
                          Số lượng
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 150 }}>
                          Đơn giá (VNĐ)
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            width: 140,
                            textAlign: "right",
                          }}
                        >
                          Thành tiền
                        </TableCell>
                        <TableCell sx={{ width: 50 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((row, idx) => {
                        const lineTotalCalc =
                          (Number(row.quantity) || 0) *
                          (Number(row.unitPrice) || 0);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Select
                                size="small"
                                fullWidth
                                value={row.itemType}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "itemType",
                                    e.target.value as InvoiceItemType,
                                  )
                                }
                              >
                                <MenuItem value="COST">
                                  Chi phí / Dịch vụ
                                </MenuItem>
                                <MenuItem value="MEDICINE">
                                  Thuốc điều trị
                                </MenuItem>
                              </Select>
                            </TableCell>

                            <TableCell>
                              {row.itemType === "COST" ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Mô tả khoản phí (khám, xét nghiệm...)"
                                  value={row.description || ""}
                                  onChange={(e) =>
                                    handleItemChange(
                                      idx,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                />
                              ) : (
                                <Stack spacing={1}>
                                  <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={
                                      demoMedicines.some(
                                        (m) => m.id === row.medicineId,
                                      )
                                        ? row.medicineId
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      if (selectedId) {
                                        handleItemChange(
                                          idx,
                                          "medicineId",
                                          selectedId,
                                        );
                                        // Auto-set typical price if unitPrice is default 0
                                        if (
                                          !row.unitPrice ||
                                          row.unitPrice === 0
                                        ) {
                                          const samplePrices: Record<
                                            string,
                                            number
                                          > = {
                                            "med-001": 7000,
                                            "med-002": 8000,
                                            "med-003": 3000,
                                            "med-004": 75000,
                                            "med-005": 2000,
                                            "med-006": 18000,
                                            "med-007": 12000,
                                            "med-008": 1500,
                                            "med-009": 14000,
                                            "med-010": 9000,
                                          };
                                          if (samplePrices[selectedId]) {
                                            handleItemChange(
                                              idx,
                                              "unitPrice",
                                              samplePrices[selectedId],
                                            );
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    <MenuItem value="">
                                      <em>
                                        -- Chọn thuốc danh mục hoặc tự nhập --
                                      </em>
                                    </MenuItem>
                                    {demoMedicines.map((m) => (
                                      <MenuItem key={m.id} value={m.id}>
                                        {m.name} ({m.genericName}) - {m.unit}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Hoặc nhập mã thuốc (medicineId)"
                                    value={row.medicineId || ""}
                                    onChange={(e) =>
                                      handleItemChange(
                                        idx,
                                        "medicineId",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </Stack>
                              )}
                            </TableCell>

                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                slotProps={{ htmlInput: { min: 1 } }}
                                value={row.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "quantity",
                                    Math.max(1, parseInt(e.target.value) || 1),
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                slotProps={{ htmlInput: { min: 0 } }}
                                value={row.unitPrice}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "unitPrice",
                                    Math.max(
                                      0,
                                      parseFloat(e.target.value) || 0,
                                    ),
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell
                              sx={{ textAlign: "right", fontWeight: 600 }}
                            >
                              {formatCurrency(lineTotalCalc)}
                            </TableCell>

                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(idx)}
                                disabled={items.length <= 1}
                              >
                                <DeleteOutlinedIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "#f8fafc",
                    borderRadius: 1.5,
                    textAlign: "right",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Tạm tính tổng tiền hóa đơn:
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "primary.dark" }}
                  >
                    {formatCurrency(calculatedTotal)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    (Giá trị chính thức do backend tính toán và lưu trữ)
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
              Hủy bỏ
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
              startIcon={
                createMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <AddIcon />
                )
              }
            >
              {createMutation.isPending
                ? "Đang tạo..."
                : "Xác nhận tạo hóa đơn"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG 2: XEM CHI TIẾT HÓA ĐƠN */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              pb: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              Chi tiết Hóa đơn:{" "}
              {selectedInvoice?.invoiceNumber ||
                selectedInvoice?.id.slice(0, 8)}
            </span>
            <IconButton size="small" onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedInvoice && (
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontWeight: 600 }}
                    >
                      Người mua / Đơn vị:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {selectedInvoice.buyerName}
                    </Typography>
                    {selectedInvoice.buyerPhone && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Điện thoại: {selectedInvoice.buyerPhone}
                      </Typography>
                    )}
                    {selectedInvoice.buyerEmail && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Email: {selectedInvoice.buyerEmail}
                      </Typography>
                    )}
                    {selectedInvoice.buyerTaxCode && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Mã số thuế: {selectedInvoice.buyerTaxCode}
                      </Typography>
                    )}
                    {selectedInvoice.buyerAddress && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Địa chỉ: {selectedInvoice.buyerAddress}
                      </Typography>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontWeight: 600 }}
                    >
                      Thông tin hóa đơn:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Số HĐ: {selectedInvoice.invoiceNumber || "—"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Ngày tạo:{" "}
                      {new Date(selectedInvoice.createdAt).toLocaleString(
                        "vi-VN",
                      )}
                    </Typography>
                    {selectedInvoice.patient ? (
                      <Typography
                        variant="body2"
                        sx={{ color: "primary.dark", fontWeight: 600 }}
                      >
                        Bệnh nhân: {selectedInvoice.patient.fullName} (Mã BN:{" "}
                        {selectedInvoice.patient.patientCode})
                      </Typography>
                    ) : selectedInvoice.patientId ? (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", display: "block" }}
                      >
                        Mã BN ID: {selectedInvoice.patientId}
                      </Typography>
                    ) : null}
                    {selectedInvoice.notes && (
                      <Typography
                        variant="body2"
                        sx={{ fontStyle: "italic", mt: 0.5 }}
                      >
                        Ghi chú: {selectedInvoice.notes}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                <Divider />

                {/* Items Breakdown Table */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1.5 }}
                  >
                    Chi tiết các khoản mục trong hóa đơn
                  </Typography>

                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 1.5 }}
                  >
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f8fafc" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Mục thanh toán
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 120 }}>
                            Phân loại
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              width: 90,
                              textAlign: "center",
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              width: 130,
                              textAlign: "right",
                            }}
                          >
                            Đơn giá
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              width: 140,
                              textAlign: "right",
                            }}
                          >
                            Thành tiền
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items &&
                        selectedInvoice.items.length > 0 ? (
                          selectedInvoice.items.map((it) => (
                            <TableRow key={it.id}>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {it.itemType === "MEDICINE"
                                    ? it.medicine?.name ||
                                      `Thuốc (Mã: ${it.medicineId})`
                                    : it.description || "Chi phí dịch vụ y tế"}
                                </Typography>
                                {it.medicine?.unit && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    Đơn vị: {it.medicine.unit}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    it.itemType === "MEDICINE"
                                      ? "Thuốc"
                                      : "Chi phí"
                                  }
                                  size="small"
                                  sx={{
                                    fontSize: "0.7rem",
                                    height: 22,
                                    bgcolor:
                                      it.itemType === "MEDICINE"
                                        ? "#dbeafe"
                                        : "#f1f5f9",
                                    color:
                                      it.itemType === "MEDICINE"
                                        ? "#1e40af"
                                        : "#475569",
                                    fontWeight: 600,
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ textAlign: "center" }}>
                                {it.quantity}
                              </TableCell>
                              <TableCell sx={{ textAlign: "right" }}>
                                {formatCurrency(it.unitPrice)}
                              </TableCell>
                              <TableCell
                                sx={{ textAlign: "right", fontWeight: 700 }}
                              >
                                {formatCurrency(it.lineTotal)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              sx={{
                                textAlign: "center",
                                py: 2,
                                color: "text.secondary",
                              }}
                            >
                              Không có dữ liệu dòng hàng hóa.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: "#f0f9ff",
                      borderRadius: 1.5,
                      textAlign: "right",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      Tổng tiền thanh toán hóa đơn:
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "primary.dark" }}
                    >
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            {selectedInvoice && (
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExportSingle(selectedInvoice.id)}
              >
                Xuất file Excel
              </Button>
            )}
            <Button
              onClick={() => setDetailDialogOpen(false)}
              variant="contained"
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG 3: NHẬP EXCEL */}
        <Dialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Nhập dữ liệu Hóa đơn từ Excel
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Chọn file bảng tính Excel (.xlsx, .xls) để nhập dữ liệu hóa đơn
                hàng loạt vào hệ thống. Dữ liệu sẽ được gửi dưới dạng
                multipart/form-data với trường{" "}
                <Box
                  component="span"
                  sx={{ fontFamily: "monospace", fontWeight: 600 }}
                >
                  file
                </Box>
                .
              </Typography>

              {importError && <Alert severity="error">{importError}</Alert>}
              {importSuccess && (
                <Alert severity="success">{importSuccess}</Alert>
              )}

              <Box
                sx={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  bgcolor: "#f8fafc",
                }}
              >
                <FileUploadIcon
                  sx={{ fontSize: 40, color: "#94a3b8", mb: 1 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {importFile
                    ? importFile.name
                    : "Chọn file Excel từ máy tính của bạn"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 2 }}
                >
                  {importFile
                    ? `${(importFile.size / 1024).toFixed(1)} KB`
                    : "Định dạng hỗ trợ: .xlsx, .xls"}
                </Typography>

                <Button variant="outlined" component="label" size="small">
                  Duyệt file
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                        setImportError(null);
                        setImportSuccess(null);
                      }
                    }}
                  />
                </Button>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setImportDialogOpen(false)} color="inherit">
              Đóng
            </Button>
            <Button
              variant="contained"
              disabled={!importFile || importMutation.isPending}
              onClick={() => {
                if (importFile) {
                  importMutation.mutate(importFile);
                }
              }}
              startIcon={
                importMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <FileUploadIcon />
                )
              }
            >
              {importMutation.isPending
                ? "Đang tải lên..."
                : "Bắt đầu nhập dữ liệu"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
};
