import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  patientSchema,
  type PatientFormData,
  type PatientRecipient,
} from "../schemas/patient.schema";
import { CreatePatientDto, PatientDTO, UpdatePatientDto } from "@/types";
import { Gender } from "@/types/enum";
import { UseMutationResult } from "@tanstack/react-query";

interface Props {
  open: boolean;
  recipient: PatientRecipient;
  defaultName?: string;
  error?: string;
  patient?: PatientDTO;
  onClose: () => void;
  createProfile: UseMutationResult<
    PatientDTO,
    Error,
    CreatePatientDto,
    unknown
  >;
  updateProfile: UseMutationResult<
    PatientDTO,
    Error,
    {
      id: string;
      dto: UpdatePatientDto;
    },
    unknown
  >;
}

export function PatientProfileDialog({
  open,
  recipient,
  defaultName,
  error,
  patient,
  createProfile,
  updateProfile,
  onClose,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      gender: Gender.OTHER,
      phone: "",
      address: "",
      identityNumber: "",
      medicalHistory: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const pending = createProfile.isPending || updateProfile.isPending;

  const onSubmit = (values: PatientFormData) => {
    const payload: CreatePatientDto = values;
    setSubmitError(null);
    const callbacks = {
      onSuccess: () => onClose(),
      onError: () =>
        setSubmitError(
          "Không thể lưu hồ sơ. Vui lòng kiểm tra thông tin và quyền truy cập rồi thử lại.",
        ),
    };
    if (patient)
      updateProfile.mutate({ id: patient.id, dto: payload }, callbacks);
    else createProfile.mutate(payload, callbacks);
  };

  useEffect(() => {
    if (open) {
      setSubmitError(null);
      reset({
        fullName:
          patient?.fullName ??
          (recipient === "self" ? (defaultName ?? "") : ""),
        dateOfBirth: patient?.dateOfBirth?.slice(0, 10) ?? "",
        gender: Object.values(Gender).includes(patient?.gender as Gender)
          ? (patient!.gender as Gender)
          : Gender.OTHER,
        phone: patient?.phone ?? "",
        address: patient?.address ?? "",
        identityNumber: patient?.identityNumber ?? "",
        medicalHistory: patient?.medicalHistory ?? "",
      });
    }
  }, [open, recipient, defaultName, patient, reset]);

  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {patient
          ? "Sửa hồ sơ bệnh nhân"
          : recipient === "self"
            ? "Tạo hồ sơ cho chính mình"
            : "Tạo hồ sơ cho người nhà"}
      </DialogTitle>
      <form
        onSubmit={handleSubmit((values) => {
          if (!pending) onSubmit(values);
        })}
        noValidate
      >
        <DialogContent>
          <Stack spacing={2}>
            {(submitError || error) && (
              <Alert severity="error">{submitError || error}</Alert>
            )}
            <TextField
              label="Họ và tên"
              required
              {...register("fullName")}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              disabled={pending}
            />
            <TextField
              label="Ngày sinh"
              type="date"
              required
              {...register("dateOfBirth")}
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth?.message}
              disabled={pending}
            />
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Giới tính"
                  select
                  required
                  {...field}
                  error={!!errors.gender}
                  helperText={errors.gender?.message}
                  disabled={pending}
                >
                  <MenuItem value="MALE">Nam</MenuItem>
                  <MenuItem value="FEMALE">Nữ</MenuItem>
                  <MenuItem value="OTHER">Khác</MenuItem>
                </TextField>
              )}
            />
            <TextField
              label="Số điện thoại liên hệ"
              {...register("phone")}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              disabled={pending}
            />
            <TextField
              label="CCCD / CMND"
              {...register("identityNumber")}
              error={!!errors.identityNumber}
              helperText={errors.identityNumber?.message}
              disabled={pending}
            />
            <TextField
              label="Tiền sử bệnh lý & Dị ứng"
              {...register("medicalHistory")}
              error={!!errors.medicalHistory}
              helperText={errors.medicalHistory?.message}
              disabled={pending}
              multiline
              rows={2}
            />
            <TextField
              label="Địa chỉ"
              {...register("address")}
              error={!!errors.address}
              helperText={errors.address?.message}
              disabled={pending}
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending
              ? "Đang lưu hồ sơ..."
              : patient
                ? "Lưu thay đổi"
                : "Tạo hồ sơ"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
