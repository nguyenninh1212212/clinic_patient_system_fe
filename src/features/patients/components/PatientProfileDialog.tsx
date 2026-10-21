import { isAxiosError } from 'axios';
import { patientAccessEndpoints } from '@/api/endpoints/patient-access.api';
import { useConfirmPatientIdentityLink } from '../hooks/usePatientProfiles';
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
import { CreatePatientDto, PatientProfileRequestDTO, PatientDTO, UpdatePatientDto } from "@/types";
import { Gender } from "@/types/enum";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

interface Props {
  open: boolean;
  recipient: PatientRecipient;
  defaultName?: string;
  error?: string;
  patient?: PatientDTO;
  onClose: () => void;
  createProfile: UseMutationResult<
    PatientProfileRequestDTO,
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
    getValues,
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
  const linkingSelf = !patient && recipient === "self";
  const [challenge, setChallenge] = useState<{ challengeId: string; expiresAt: string } | null>(null);
  const [otp, setOtp] = useState("");
  const requestOtp = useMutation({ mutationFn: patientAccessEndpoints.requestIdentityOtp });
  const confirmIdentity = useConfirmPatientIdentityLink();
  const pending = createProfile.isPending || updateProfile.isPending || requestOtp.isPending || confirmIdentity.isPending;

  const identityError = (error: unknown) => setSubmitError(
    isAxiosError(error) && typeof error.response?.data?.message === "string"
      ? error.response.data.message : "Không thể xác minh hồ sơ. Vui lòng thử lại.",
  );
  const sendOtp = () => {
    const identityNumber = getValues("identityNumber")?.trim() ?? "";
    setSubmitError(null);
    if (identityNumber.length < 6 || identityNumber.length > 20) {
      setSubmitError("Vui lòng nhập số CCCD / CMND hợp lệ (6–20 ký tự).");
      return;
    }
    requestOtp.mutate(identityNumber, {
      onSuccess: (result) => { setChallenge(result); setOtp(""); },
      onError: identityError,
    });
  };
  const submitIdentityLink = () => {
    setSubmitError(null);
    if (!challenge) { sendOtp(); return; }
    if (!/^\d{6}$/.test(otp)) { setSubmitError("Vui lòng nhập mã OTP gồm 6 chữ số."); return; }
    confirmIdentity.mutate({ challengeId: challenge.challengeId, otp }, {
      onSuccess: () => onClose(), onError: identityError,
    });
  };

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
      setChallenge(null);
      setOtp("");
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
            ? "Liên kết hồ sơ chính chủ"
            : "Tạo hồ sơ cho người nhà"}
      </DialogTitle>
      <form
        onSubmit={(event) => {
          if (linkingSelf) {
            event.preventDefault();
            if (!pending) submitIdentityLink();
          } else {
            void handleSubmit((values) => { if (!pending) onSubmit(values); })(event);
          }
        }}
        noValidate
      >
        <DialogContent>
          <Stack spacing={2}>
            {(submitError || error) && (
              <Alert severity="error">{submitError || error}</Alert>
            )}
            {linkingSelf ? (
              <>
                <Alert severity="info">
                  Nhập CCCD / CMND để liên kết hồ sơ. OTP sẽ được gửi qua Zalo của số điện thoại đã lưu trong hồ sơ bệnh nhân, có hiệu lực 5 phút.
                </Alert>
                <TextField
                  label="CCCD / CMND"
                  required
                  {...register("identityNumber")}
                  disabled={pending || !!challenge}
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                />
                {challenge && (
                  <>
                    <TextField
                      label="Mã OTP"
                      required
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      autoComplete="one-time-code"
                      slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
                      disabled={pending}
                    />
                    <Button onClick={sendOtp} disabled={pending}>Gửi lại OTP</Button>
                    <Button onClick={() => { setChallenge(null); setOtp(""); setSubmitError(null); }} disabled={pending}>Đổi số định danh</Button>
                  </>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending
              ? linkingSelf ? "Đang xác minh..." : "Đang lưu hồ sơ..."
              : linkingSelf
                ? challenge ? "Xác nhận liên kết" : "Gửi mã OTP"
              : patient
                ? "Lưu thay đổi"
                : "Tạo hồ sơ"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
