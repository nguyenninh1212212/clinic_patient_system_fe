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
import MedicationIcon from "@mui/icons-material/Medication";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { prescriptionsApi } from "@/api/endpoints/prescriptions.api";
import { demoMedicines } from "@/api/demoData";
import {
  CreatePrescriptionPayload,
  CreatePrescriptionItemPayload,
  PharmacyStatus,
  PrescriptionDTO,
  PrescriptionItemDTO,
  UpdatePrescriptionItemPayload,
  UpdatePrescriptionPayload,
} from "@/types/index";

// Helper for pharmacy status chips
export const renderPharmacyStatusChip = (status: PharmacyStatus) => {
  switch (status) {
    case "NEW":
      return (
        <Chip
          label="Mới kê đơn (NEW)"
          size="small"
          sx={{
            bgcolor: "#e0f2fe",
            color: "#0369a1",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    case "PROCESSING":
      return (
        <Chip
          label="Đang soạn thuốc (PROCESSING)"
          size="small"
          sx={{
            bgcolor: "#fef3c7",
            color: "#92400e",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    case "READY":
      return (
        <Chip
          label="Sẵn sàng nhận (READY)"
          size="small"
          sx={{
            bgcolor: "#dcfce7",
            color: "#166534",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    case "COMPLETED":
      return (
        <Chip
          label="Đã phát thuốc (COMPLETED)"
          size="small"
          sx={{
            bgcolor: "#f1f5f9",
            color: "#475569",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    case "CANCELLED":
      return (
        <Chip
          label="Đã hủy đơn (CANCELLED)"
          size="small"
          sx={{
            bgcolor: "#fee2e2",
            color: "#991b1b",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    default:
      return <Chip label={status} size="small" />;
  }
};

export const PrescriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterIssuedAt, setFilterIssuedAt] = useState<string>("");
  const [clientPharmacyStatusFilter, setClientPharmacyStatusFilter] =
    useState<string>("ALL");
  const pageSize = 10;

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editPrescription, setEditPrescription] =
    useState<PrescriptionDTO | null>(null);
  const [detailPrescription, setDetailPrescription] =
    useState<PrescriptionDTO | null>(null);
  const [deleteConfirmPrescription, setDeleteConfirmPrescription] =
    useState<PrescriptionDTO | null>(null);

  // Form: Create prescription
  const [createExamId, setCreateExamId] = useState<string>("");
  const [createNotes, setCreateNotes] = useState<string>("");
  const [createIssuedAt, setCreateIssuedAt] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [createValidUntil, setCreateValidUntil] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [createPharmacyStatus, setCreatePharmacyStatus] =
    useState<PharmacyStatus>("NEW");
  const [createError, setCreateError] = useState<string | null>(null);

  // Form: Edit prescription
  const [editNotes, setEditNotes] = useState<string>("");
  const [editValidUntil, setEditValidUntil] = useState<string>("");
  const [editPharmacyStatus, setEditPharmacyStatus] =
    useState<PharmacyStatus>("NEW");
  const [editError, setEditError] = useState<string | null>(null);

  // Form: Add medicine item into prescription
  const [addItemMedicineId, setAddItemMedicineId] = useState<string>("");
  const [addItemQuantity, setAddItemQuantity] = useState<number>(1);
  const [addItemDosage, setAddItemDosage] = useState<string>("1 viên");
  const [addItemFrequency, setAddItemFrequency] =
    useState<string>("2 lần/ngày");
  const [addItemDuration, setAddItemDuration] = useState<string>("7 ngày");
  const [addItemNote, setAddItemNote] = useState<string>(
    "Uống sau khi ăn 15 phút",
  );
  const [addItemError, setAddItemError] = useState<string | null>(null);

  // Form: Edit medicine item
  const [editingItem, setEditingItem] = useState<PrescriptionItemDTO | null>(
    null,
  );
  const [editItemMedicineId, setEditItemMedicineId] = useState<string>("");
  const [editItemQuantity, setEditItemQuantity] = useState<number>(1);
  const [editItemDosage, setEditItemDosage] = useState<string>("");
  const [editItemFrequency, setEditItemFrequency] = useState<string>("");
  const [editItemDuration, setEditItemDuration] = useState<string>("");
  const [editItemNote, setEditItemNote] = useState<string>("");
  const [editItemError, setEditItemError] = useState<string | null>(null);

  // Query Prescriptions list
  const {
    data: prescriptionsRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "prescriptions",
      { page: currentPage, limit: pageSize, issuedAt: filterIssuedAt },
    ],
    queryFn: () =>
      prescriptionsApi.getPrescriptions({
        page: currentPage,
        limit: pageSize,
        issuedAt: filterIssuedAt || undefined,
      }),
  });

  const { data: prescriptionItems, isLoading: isItemsLoading } = useQuery({
    queryKey: ["prescription-items", detailPrescription?.id],
    queryFn: () =>
      prescriptionsApi.getPrescriptionItems(detailPrescription!.id),
    enabled: Boolean(detailPrescription?.id),
  });

  const rawPrescriptions = prescriptionsRes?.data || [];
  const prescriptions =
    clientPharmacyStatusFilter === "ALL"
      ? rawPrescriptions
      : rawPrescriptions.filter(
          (p) => p.pharmacyStatus === clientPharmacyStatusFilter,
        );
  const pagination = prescriptionsRes?.pagination;

  // Mutation: Create Prescription (POST /prescriptions)
  const createMutation = useMutation({
    mutationFn: (payload: CreatePrescriptionPayload) =>
      prescriptionsApi.createPrescription(payload),
    onSuccess: (newPrescription) => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setCreateDialogOpen(false);
      resetCreateForm();
      setDetailPrescription(newPrescription);
    },
    onError: (err: unknown) => {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axErr = err as {
          response?: { data?: { message?: string | string[] } };
        };
        const msg = axErr.response?.data?.message;
        setCreateError(
          Array.isArray(msg)
            ? msg.join(", ")
            : msg || "Không thể tạo đơn thuốc.",
        );
      } else {
        setCreateError("Không thể tạo đơn thuốc. Hãy kiểm tra lại thông tin.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePrescriptionPayload;
    }) => prescriptionsApi.updatePrescription(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setEditPrescription(null);
      if (detailPrescription && detailPrescription.id === updated.id) {
        setDetailPrescription(updated);
      }
    },
    onError: (err: unknown) => {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axErr = err as {
          response?: { data?: { message?: string | string[] } };
        };
        const msg = axErr.response?.data?.message;
        setEditError(
          Array.isArray(msg)
            ? msg.join(", ")
            : msg || "Không thể cập nhật đơn thuốc.",
        );
      } else {
        setEditError("Không thể cập nhật đơn thuốc.");
      }
    },
  });

  // Mutation: Delete Prescription (DELETE /prescriptions/:id)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => prescriptionsApi.deletePrescription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setDeleteConfirmPrescription(null);
      if (
        detailPrescription &&
        deleteConfirmPrescription &&
        detailPrescription.id === deleteConfirmPrescription.id
      ) {
        setDetailPrescription(null);
      }
    },
  });

  // Mutation: Add Item into Prescription (POST /prescription-items)
  const addItemMutation = useMutation({
    mutationFn: (payload: CreatePrescriptionItemPayload) =>
      prescriptionsApi.addPrescriptionItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["prescription-items", detailPrescription?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setAddItemMedicineId("");
      setAddItemQuantity(1);
      setAddItemDosage("1 viên");
      setAddItemFrequency("2 lần/ngày");
      setAddItemDuration("7 ngày");
      setAddItemNote("Uống sau khi ăn 15 phút");
      setAddItemError(null);
    },
    onError: (err: unknown) => {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axErr = err as {
          response?: { data?: { message?: string | string[] } };
        };
        const msg = axErr.response?.data?.message;
        setAddItemError(
          Array.isArray(msg) ? msg.join(", ") : msg || "Không thể thêm thuốc.",
        );
      } else {
        setAddItemError("Lỗi khi thêm thuốc vào đơn.");
      }
    },
  });

  // Mutation: Update Item in Prescription (PATCH /prescription-items/:id)
  const updateItemMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePrescriptionItemPayload;
    }) => prescriptionsApi.updatePrescriptionItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["prescription-items", detailPrescription?.id],
      });
      setEditingItem(null);
      setEditItemError(null);
    },
    onError: (err: unknown) => {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axErr = err as {
          response?: { data?: { message?: string | string[] } };
        };
        const msg = axErr.response?.data?.message;
        setEditItemError(
          Array.isArray(msg)
            ? msg.join(", ")
            : msg || "Không thể cập nhật thuốc.",
        );
      } else {
        setEditItemError("Lỗi khi cập nhật thông tin thuốc.");
      }
    },
  });

  // Mutation: Delete Item in Prescription (DELETE /prescription-items/:id)
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => prescriptionsApi.deletePrescriptionItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["prescription-items", detailPrescription?.id],
      });
    },
  });

  const resetCreateForm = () => {
    setCreateExamId("");
    setCreateNotes("");
    setCreateIssuedAt(new Date().toISOString().slice(0, 16));
    setCreateValidUntil(
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    );
    setCreatePharmacyStatus("NEW");
    setCreateError(null);
  };

  const handleOpenEdit = (p: PrescriptionDTO) => {
    setEditPrescription(p);
    setEditNotes(p.notes || "");
    setEditValidUntil(p.validUntil ? p.validUntil.slice(0, 10) : "");
    setEditPharmacyStatus(p.pharmacyStatus || "NEW");
    setEditError(null);
  };

  const handleSaveEdit = () => {
    if (!editPrescription) return;
    updateMutation.mutate({
      id: editPrescription.id,
      payload: {
        notes: editNotes.trim() || undefined,
        validUntil: editValidUntil
          ? new Date(editValidUntil).toISOString()
          : undefined,
        pharmacyStatus: editPharmacyStatus,
      },
    });
  };

  const handleCreatePrescriptionSubmit = () => {
    if (!createExamId.trim()) {
      setCreateError("Vui lòng nhập mã lần khám (examinationId) bắt buộc.");
      return;
    }

    createMutation.mutate({
      examinationId: createExamId.trim(),
      notes: createNotes.trim() || undefined,
      issuedAt: createIssuedAt
        ? new Date(createIssuedAt).toISOString()
        : undefined,
      validUntil: createValidUntil
        ? new Date(createValidUntil).toISOString()
        : undefined,
      pharmacyStatus: createPharmacyStatus,
    });
  };

  const handleAddItemSubmit = () => {
    if (!detailPrescription) return;
    if (!addItemMedicineId.trim()) {
      setAddItemError("Vui lòng chọn hoặc nhập mã thuốc (medicineId).");
      return;
    }
    if (addItemQuantity < 1) {
      setAddItemError("Số lượng phải tối thiểu là 1.");
      return;
    }

    addItemMutation.mutate({
      prescriptionId: detailPrescription.id,
      medicineId: addItemMedicineId.trim(),
      quantity: Number(addItemQuantity),
      dosage: addItemDosage.trim(),
      frequency: addItemFrequency.trim(),
      duration: addItemDuration.trim(),
      note: addItemNote.trim() || undefined,
    });
  };

  const handleOpenEditItem = (item: PrescriptionItemDTO) => {
    setEditingItem(item);
    setEditItemMedicineId(item.medicineId);
    setEditItemQuantity(item.quantity);
    setEditItemDosage(item.dosage);
    setEditItemFrequency(item.frequency);
    setEditItemDuration(item.duration);
    setEditItemNote(item.note || "");
    setEditItemError(null);
  };

  const handleSaveEditItem = () => {
    if (!editingItem) return;
    if (editItemQuantity < 1) {
      setEditItemError("Số lượng tối thiểu là 1");
      return;
    }

    updateItemMutation.mutate({
      id: editingItem.id,
      payload: {
        medicineId: editItemMedicineId.trim() || undefined,
        quantity: Number(editItemQuantity),
        dosage: editItemDosage.trim(),
        frequency: editItemFrequency.trim(),
        duration: editItemDuration.trim(),
        note: editItemNote.trim() || undefined,
      },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3.5 }}>
      <Stack spacing={3.5}>
        {/* Title & Action Bar */}
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
              Quản lý Đơn thuốc Điện tử
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              Quản lý danh sách kê đơn, chi tiết thuốc theo phác đồ điều trị và
              trạng thái quầy dược
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              resetCreateForm();
              setCreateDialogOpen(true);
            }}
          >
            Tạo đơn thuốc mới
          </Button>
        </Stack>

        {/* Filter Controls Bar */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "#ffffff",
            borderColor: "#e2e8f0",
          }}
        >
          <Grid container spacing={2} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Lọc theo ngày kê đơn (issuedAt)"
                value={filterIssuedAt}
                onChange={(e) => {
                  setFilterIssuedAt(e.target.value);
                  setCurrentPage(1);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">
                  Trạng thái quầy dược
                </InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Trạng thái quầy dược"
                  value={clientPharmacyStatusFilter}
                  onChange={(e) =>
                    setClientPharmacyStatusFilter(e.target.value)
                  }
                >
                  <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                  <MenuItem value="NEW">Mới kê đơn (NEW)</MenuItem>
                  <MenuItem value="PROCESSING">
                    Đang soạn thuốc (PROCESSING)
                  </MenuItem>
                  <MenuItem value="READY">Sẵn sàng nhận (READY)</MenuItem>
                  <MenuItem value="COMPLETED">
                    Đã phát thuốc (COMPLETED)
                  </MenuItem>
                  <MenuItem value="CANCELLED">Đã hủy đơn (CANCELLED)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                variant="text"
                size="small"
                fullWidth
                onClick={() => {
                  setFilterIssuedAt("");
                  setClientPharmacyStatusFilter("ALL");
                  setCurrentPage(1);
                }}
              >
                Đặt lại lọc
              </Button>
            </Grid>
          </Grid>

          <Box
            sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 0.75 }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 16, color: "#64748b" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Backend hỗ trợ lọc query{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                issuedAt
              </Box>
              . Bộ lọc trạng thái dược được hỗ trợ tại máy khách để đảm bảo tính
              chuẩn xác.
            </Typography>
          </Box>
        </Paper>

        {/* Prescriptions Table */}
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
                Không thể tải danh sách đơn thuốc từ máy chủ. Vui lòng kiểm tra
                lại backend.
              </Typography>
            </Box>
          ) : prescriptions.length === 0 ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <MedicationIcon
                sx={{ fontSize: 52, color: "#94a3b8", mb: 1.5 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chưa có đơn thuốc nào
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}
              >
                Bắt đầu tạo đơn thuốc cho lần khám bệnh nhân.
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
                Tạo đơn thuốc ngay
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
                      Mã đơn
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Mã lần khám
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Chẩn đoán / Bệnh nhân
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Ngày kê
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Hạn dùng
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Trạng thái dược
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
                  {prescriptions.map((p) => (
                    <TableRow
                      key={p.id}
                      sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
                    >
                      <TableCell
                        sx={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "primary.dark",
                        }}
                      >
                        {p.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                      >
                        {p.examinationId
                          ? `${p.examinationId.slice(0, 8)}...`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {p.examination?.patient ? (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {p.examination.patient.fullName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              Chẩn đoán: {p.examination.diagnosis || "Chưa ghi"}
                            </Typography>
                          </Box>
                        ) : p.examination?.diagnosis ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {p.examination.diagnosis}
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: "#94a3b8" }}
                          >
                            {p.notes || "Đơn thuốc khám ngoại trú"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.85rem" }}>
                        {p.issuedAt
                          ? new Date(p.issuedAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.85rem" }}>
                        {p.validUntil
                          ? new Date(p.validUntil).toLocaleDateString("vi-VN")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {renderPharmacyStatusChip(p.pharmacyStatus)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ justifyContent: "center" }}
                        >
                          <Tooltip title="Xem chi tiết & Quản lý thuốc">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setDetailPrescription(p)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Cập nhật thông tin đơn (PATCH /prescriptions/:id)">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Xóa đơn thuốc (DELETE /prescriptions/:id)">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirmPrescription(p)}
                            >
                              <DeleteOutlinedIcon fontSize="small" />
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

        {/* DIALOG 1: TẠO ĐƠN THUỐC MỚI (POST /prescriptions) */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
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
            <span>Kê đơn thuốc mới (POST /prescriptions)</span>
            <IconButton size="small" onClick={() => setCreateDialogOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {createError && <Alert severity="error">{createError}</Alert>}

              <Alert severity="info" sx={{ fontSize: "0.8rem" }}>
                Lưu ý chuẩn API: Thuốc không gửi trong payload tạo đơn. Hãy tạo
                đơn trước, sau đó quản lý từng dòng thuốc qua API
                /prescription-items.
              </Alert>

              <Box>
                <TextField
                  fullWidth
                  label="Mã lần khám (examinationId) *"
                  placeholder="VD: exam-2026-0042..."
                  value={createExamId}
                  onChange={(e) => setCreateExamId(e.target.value)}
                  required
                  helperText="Mỗi lần khám chỉ có một đơn thuốc duy nhất"
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", alignSelf: "center" }}
                  >
                    Gợi ý mẫu:
                  </Typography>
                  {["exam-2026-0042", "exam-2026-0078", "exam-2026-0105"].map(
                    (sampleId) => (
                      <Chip
                        key={sampleId}
                        label={sampleId}
                        size="small"
                        clickable
                        onClick={() => setCreateExamId(sampleId)}
                      />
                    ),
                  )}
                </Stack>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Thời điểm kê đơn (issuedAt)"
                    value={createIssuedAt}
                    onChange={(e) => setCreateIssuedAt(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    helperText="Để trống backend sẽ lấy thời điểm hiện tại"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Hạn dùng đơn thuốc (validUntil)"
                    value={createValidUntil}
                    onChange={(e) => setCreateValidUntil(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth size="small">
                <InputLabel id="create-status-label">
                  Trạng thái quầy dược (pharmacyStatus)
                </InputLabel>
                <Select
                  labelId="create-status-label"
                  label="Trạng thái quầy dược (pharmacyStatus)"
                  value={createPharmacyStatus}
                  onChange={(e) =>
                    setCreatePharmacyStatus(e.target.value as PharmacyStatus)
                  }
                >
                  <MenuItem value="NEW">Mới kê đơn (NEW)</MenuItem>
                  <MenuItem value="PROCESSING">
                    Đang chuẩn bị thuốc (PROCESSING)
                  </MenuItem>
                  <MenuItem value="READY">Sẵn sàng nhận thuốc (READY)</MenuItem>
                  <MenuItem value="COMPLETED">
                    Đã hoàn thành phát thuốc (COMPLETED)
                  </MenuItem>
                  <MenuItem value="CANCELLED">
                    Hủy đơn thuốc (CANCELLED)
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Ghi chú dặn dò chung (notes)"
                placeholder="Lời dặn của bác sĩ điều trị..."
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleCreatePrescriptionSubmit}
              disabled={createMutation.isPending}
              startIcon={
                createMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <AddIcon />
                )
              }
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo đơn thuốc"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG 2: CẬP NHẬT ĐƠN THUỐC (PATCH /prescriptions/:id) */}
        <Dialog
          open={Boolean(editPrescription)}
          onClose={() => setEditPrescription(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Cập nhật thông tin Đơn thuốc (PATCH /prescriptions/:id)
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {editError && <Alert severity="error">{editError}</Alert>}

              <TextField
                fullWidth
                disabled
                label="Mã đơn thuốc (id)"
                value={editPrescription?.id || ""}
              />

              <TextField
                fullWidth
                disabled
                label="Mã lần khám (examinationId)"
                value={editPrescription?.examinationId || ""}
              />

              <TextField
                fullWidth
                type="date"
                label="Hạn dùng đơn thuốc (validUntil)"
                value={editValidUntil}
                onChange={(e) => setEditValidUntil(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel id="edit-status-label">
                  Trạng thái quầy dược (pharmacyStatus)
                </InputLabel>
                <Select
                  labelId="edit-status-label"
                  label="Trạng thái quầy dược (pharmacyStatus)"
                  value={editPharmacyStatus}
                  onChange={(e) =>
                    setEditPharmacyStatus(e.target.value as PharmacyStatus)
                  }
                >
                  <MenuItem value="NEW">Mới kê đơn (NEW)</MenuItem>
                  <MenuItem value="PROCESSING">
                    Đang chuẩn bị thuốc (PROCESSING)
                  </MenuItem>
                  <MenuItem value="READY">Sẵn sàng nhận thuốc (READY)</MenuItem>
                  <MenuItem value="COMPLETED">
                    Đã hoàn thành phát thuốc (COMPLETED)
                  </MenuItem>
                  <MenuItem value="CANCELLED">
                    Hủy đơn thuốc (CANCELLED)
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Ghi chú dặn dò (notes)"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditPrescription(null)} color="inherit">
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG 3: CHI TIẾT ĐƠN THUỐC & QUẢN LÝ THUỐC (GET/POST/PATCH/DELETE /prescription-items) */}
        <Dialog
          open={Boolean(detailPrescription)}
          onClose={() => setDetailPrescription(null)}
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
              Chi tiết Đơn thuốc #{detailPrescription?.id.slice(0, 8)}
            </span>
            <IconButton
              size="small"
              onClick={() => setDetailPrescription(null)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {detailPrescription && (
              <Stack spacing={3}>
                {/* Examination & Patient Info */}
                <Paper
                  variant="outlined"
                  sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 2 }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", fontWeight: 700 }}
                      >
                        THÔNG TIN LẦN KHÁM:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mt: 0.5 }}
                      >
                        Mã lần khám: {detailPrescription.examinationId}
                      </Typography>
                      {detailPrescription.examination?.doctorId && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", display: "block" }}
                        >
                          Mã Bác sĩ (doctorId):{" "}
                          {detailPrescription.examination.doctorId}
                        </Typography>
                      )}
                      {detailPrescription.examination?.diagnosis && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "primary.dark",
                            fontWeight: 600,
                            mt: 0.5,
                          }}
                        >
                          Chẩn đoán: {detailPrescription.examination.diagnosis}
                        </Typography>
                      )}
                      {detailPrescription.examination?.icd10Code && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", display: "block" }}
                        >
                          Mã ICD-10: {detailPrescription.examination.icd10Code}
                        </Typography>
                      )}
                      {detailPrescription.examination?.examinedAt && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", display: "block" }}
                        >
                          Khám lúc:{" "}
                          {new Date(
                            detailPrescription.examination.examinedAt,
                          ).toLocaleString("vi-VN")}
                        </Typography>
                      )}
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", fontWeight: 700 }}
                      >
                        BỆNH NHÂN TRONG LẦN KHÁM:
                      </Typography>
                      {detailPrescription.examination?.patient ? (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {detailPrescription.examination.patient.fullName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block" }}
                          >
                            Mã BN: {detailPrescription.examination.patient.id}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block" }}
                          >
                            Ngày sinh:{" "}
                            {detailPrescription.examination.patient
                              .dateOfBirth || "—"}{" "}
                            | Giới tính:{" "}
                            {detailPrescription.examination.patient.gender ===
                            "MALE"
                              ? "Nam"
                              : "Nữ"}
                          </Typography>
                          {detailPrescription.examination.patient.phone && (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", display: "block" }}
                            >
                              SĐT:{" "}
                              {detailPrescription.examination.patient.phone}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            mt: 0.5,
                          }}
                        >
                          (Thông tin bệnh nhân đính kèm theo lần khám)
                        </Typography>
                      )}

                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Trạng thái dược:
                        </Typography>
                        {renderPharmacyStatusChip(
                          detailPrescription.pharmacyStatus,
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        Ngày kê:{" "}
                        {new Date(detailPrescription.issuedAt).toLocaleString(
                          "vi-VN",
                        )}
                      </Typography>
                      {detailPrescription.validUntil && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", display: "block" }}
                        >
                          Hạn dùng đến:{" "}
                          {new Date(
                            detailPrescription.validUntil,
                          ).toLocaleDateString("vi-VN")}
                        </Typography>
                      )}
                      {detailPrescription.notes && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontStyle: "italic",
                            display: "block",
                            mt: 0.5,
                          }}
                        >
                          Dặn dò: {detailPrescription.notes}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>

                {/* Danh sách thuốc trong đơn (GET /prescription-items) */}
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
                      Danh sách thuốc trong đơn (
                      {prescriptionItems?.length || 0} thuốc)
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      API: GET /prescription-items?prescriptionId=
                      {detailPrescription.id}
                    </Typography>
                  </Stack>

                  {isItemsLoading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 3 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : !prescriptionItems || prescriptionItems.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: "center",
                        bgcolor: "#fff",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Chưa có thuốc nào trong đơn này. Vui lòng thêm thuốc ở
                        khung bên dưới.
                      </Typography>
                    </Paper>
                  ) : (
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1.5 }}
                    >
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "#f8fafc" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>
                              Thuốc / Hoạt chất
                            </TableCell>
                            <TableCell
                              sx={{
                                fontWeight: 700,
                                width: 80,
                                textAlign: "center",
                              }}
                            >
                              SL
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 110 }}>
                              Liều dùng
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 120 }}>
                              Tần suất
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 100 }}>
                              Thời gian
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              Ghi chú dặn dò
                            </TableCell>
                            <TableCell sx={{ width: 100, textAlign: "center" }}>
                              Thao tác
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prescriptionItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {item.medicine?.name || item.medicineId}
                                </Typography>
                                {item.medicine?.genericName && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "block",
                                    }}
                                  >
                                    Hoạt chất: {item.medicine.genericName}
                                  </Typography>
                                )}
                                {item.medicine?.unit && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "primary.main",
                                      display: "block",
                                    }}
                                  >
                                    Đơn vị: {item.medicine.unit}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell
                                sx={{ textAlign: "center", fontWeight: 600 }}
                              >
                                {item.quantity} {item.medicine?.unit || ""}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {item.dosage}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {item.frequency}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {item.duration}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.8rem",
                                  color: "text.secondary",
                                }}
                              >
                                {item.note || "—"}
                              </TableCell>
                              <TableCell sx={{ textAlign: "center" }}>
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  sx={{ justifyContent: "center" }}
                                >
                                  <Tooltip title="Sửa thuốc (PATCH /prescription-items/:id)">
                                    <IconButton
                                      size="small"
                                      color="info"
                                      onClick={() => handleOpenEditItem(item)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Xóa thuốc (DELETE /prescription-items/:id)">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        deleteItemMutation.mutate(item.id)
                                      }
                                      disabled={deleteItemMutation.isPending}
                                    >
                                      <DeleteOutlinedIcon fontSize="small" />
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
                </Box>

                <Divider />

                {/* Form: Thêm thuốc mới vào đơn (POST /prescription-items) */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "#f0fdf4",
                    borderColor: "#bbf7d0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "#166534", mb: 1.5 }}
                  >
                    + Thêm thuốc mới vào đơn này (POST /prescription-items)
                  </Typography>

                  {addItemError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {addItemError}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="add-med-select-label">
                          Chọn thuốc có sẵn trong danh mục
                        </InputLabel>
                        <Select
                          labelId="add-med-select-label"
                          label="Chọn thuốc có sẵn trong danh mục"
                          value={addItemMedicineId}
                          onChange={(e) => setAddItemMedicineId(e.target.value)}
                        >
                          <MenuItem value="">
                            <em>-- Chọn thuốc hoặc tự nhập bên dưới --</em>
                          </MenuItem>
                          {demoMedicines.map((m) => (
                            <MenuItem key={m.id} value={m.id}>
                              {m.name} ({m.genericName}) - ĐVT: {m.unit}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        size="small"
                        sx={{ mt: 1 }}
                        label="Hoặc nhập mã thuốc trực tiếp (medicineId) *"
                        placeholder="VD: med-001 hoặc mã UUID thuốc..."
                        value={addItemMedicineId}
                        onChange={(e) => setAddItemMedicineId(e.target.value)}
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        label="Số lượng (tối thiểu 1) *"
                        slotProps={{ htmlInput: { min: 1 } }}
                        value={addItemQuantity}
                        onChange={(e) =>
                          setAddItemQuantity(
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Liều dùng (dosage) *"
                        placeholder="VD: 1 viên, 5ml..."
                        value={addItemDosage}
                        onChange={(e) => setAddItemDosage(e.target.value)}
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Tần suất (frequency) *"
                        placeholder="VD: 2 lần/ngày..."
                        value={addItemFrequency}
                        onChange={(e) => setAddItemFrequency(e.target.value)}
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Thời gian (duration) *"
                        placeholder="VD: 5 ngày, 7 ngày..."
                        value={addItemDuration}
                        onChange={(e) => setAddItemDuration(e.target.value)}
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Ghi chú dặn dò (note)"
                        placeholder="VD: Uống sau bữa ăn sáng và tối..."
                        value={addItemNote}
                        onChange={(e) => setAddItemNote(e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={
                        addItemMutation.isPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <AddIcon />
                        )
                      }
                      onClick={handleAddItemSubmit}
                      disabled={addItemMutation.isPending}
                    >
                      {addItemMutation.isPending
                        ? "Đang thêm..."
                        : "Thêm thuốc vào đơn"}
                    </Button>
                  </Box>
                </Paper>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDetailPrescription(null)}
              variant="contained"
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG 4: CẬP NHẬT THUỐC TRONG ĐƠN (PATCH /prescription-items/:id) */}
        <Dialog
          open={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Cập nhật thuốc trong đơn (PATCH /prescription-items/:id)
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {editItemError && <Alert severity="error">{editItemError}</Alert>}

              <TextField
                fullWidth
                size="small"
                label="Mã thuốc (medicineId)"
                value={editItemMedicineId}
                onChange={(e) => setEditItemMedicineId(e.target.value)}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Số lượng (quantity) *"
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={editItemQuantity}
                    onChange={(e) =>
                      setEditItemQuantity(
                        Math.max(1, parseInt(e.target.value) || 1),
                      )
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Liều dùng (dosage) *"
                    value={editItemDosage}
                    onChange={(e) => setEditItemDosage(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tần suất (frequency) *"
                    value={editItemFrequency}
                    onChange={(e) => setEditItemFrequency(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Thời gian (duration) *"
                    value={editItemDuration}
                    onChange={(e) => setEditItemDuration(e.target.value)}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Ghi chú dặn dò (note)"
                value={editItemNote}
                onChange={(e) => setEditItemNote(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditingItem(null)} color="inherit">
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEditItem}
              disabled={updateItemMutation.isPending}
            >
              {updateItemMutation.isPending
                ? "Đang lưu..."
                : "Lưu cập nhật thuốc"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG 5: XÁC NHẬN XÓA ĐƠN THUỐC (DELETE /prescriptions/:id) */}
        <Dialog
          open={Boolean(deleteConfirmPrescription)}
          onClose={() => setDeleteConfirmPrescription(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
            Xác nhận xóa Đơn thuốc
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2">
              Bạn có chắc chắn muốn xóa đơn thuốc{" "}
              <Box
                component="span"
                sx={{ fontFamily: "monospace", fontWeight: 700 }}
              >
                {deleteConfirmPrescription?.id.slice(0, 8)}...
              </Box>
              ? Hành động này sẽ gọi API{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                DELETE /prescriptions/:id
              </Box>{" "}
              và xóa toàn bộ các loại thuốc đã kê trong đơn.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDeleteConfirmPrescription(null)}
              color="inherit"
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (deleteConfirmPrescription) {
                  deleteMutation.mutate(deleteConfirmPrescription.id);
                }
              }}
              disabled={deleteMutation.isPending}
              startIcon={
                deleteMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <DeleteOutlinedIcon />
                )
              }
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
};
