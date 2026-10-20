import { useState } from "react";
import {
  Alert,
  Button,
  Box,
  Divider,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import StarOutlineIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { useAppDispatch, useAppSelector } from "@/store";
import { setActiveProfile } from "@/store/slices/profileSlice";
import type { PatientDTO } from "@/types";
import type { PatientRecipient } from "../schemas/patient.schema";
import {
  useAccessiblePatients,
  useCreatePatient,
  useCreatePatientForMySelf,
  useMyPatient,
  useUpdatePatient,
} from "../hooks/usePatientProfiles";
import { useDefaultPatientProfile } from "../hooks/useDefaultPatientProfile";
import { PatientProfileDialog } from "./PatientProfileDialog";

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export function PatientProfileMenu({ anchorEl, onClose }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const activePatientId = useAppSelector(
    (state) => state.profile.activePatientId,
  );
  const self = useMyPatient();
  const patient = self.data || undefined;
  const accessible = useAccessiblePatients();
  const relatives = (accessible.data?.data || []).filter(
    (item) => item.userId === user?.id && item.patientId !== patient?.id,
  );
  const { defaultPatientId, chooseDefault } = useDefaultPatientProfile(
    patient,
    accessible.data?.data || [],
    self.isSuccess && accessible.isSuccess,
  );
  const [recipient, setRecipient] = useState<PatientRecipient | null>(null);
  const createSelf = useCreatePatientForMySelf();
  const createFamily = useCreatePatient();
  const update = useUpdatePatient();

  const openCreate = (value: PatientRecipient) => {
    onClose();
    setRecipient(value);
  };

  const profileItems = (
    profile: Pick<PatientDTO, "id" | "fullName" | "patientCode">,
    isRelative: boolean,
  ) => [
    <MenuItem
      key={profile.id}
      selected={activePatientId === profile.id}
      onClick={() => {
        dispatch(
          setActiveProfile({
            patientId: profile.id,
            patientName: profile.fullName,
            patientCode: profile.patientCode,
            isRelative,
          }),
        );
        onClose();
      }}
      sx={{ borderRadius: 1.5 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {profile.fullName}
          {!isRelative && " (Tôi)"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Mã BN: {profile.patientCode}
        </Typography>
      </Box>
      {defaultPatientId === profile.id && (
        <StarIcon
          fontSize="small"
          color="warning"
          aria-label="Hồ sơ mặc định"
          sx={{ ml: 1 }}
        />
      )}
    </MenuItem>,
    <MenuItem
      key={`${profile.id}-default`}
      disabled={defaultPatientId === profile.id}
      onClick={() => {
        chooseDefault(profile, isRelative);
        onClose();
      }}
      sx={{
        borderRadius: 1.5,
        fontSize: "0.75rem",
        color: "primary.main",
        gap: 1,
      }}
    >
      <StarOutlineIcon fontSize="small" />
      {defaultPatientId === profile.id
        ? "Hồ sơ mặc định"
        : "Chọn làm hồ sơ mặc định"}
    </MenuItem>,
  ];

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: 300,
              maxWidth: "calc(100vw - 24px)",
              mt: 1,
              p: 1,
              borderRadius: 2,
            },
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 0.5, display: "block", fontWeight: 700 }}
        >
          HỒ SƠ BẢN THÂN
        </Typography>
        {self.isPending ? (
          <MenuItem disabled>Đang tải hồ sơ...</MenuItem>
        ) : self.isError ? (
          <Box sx={{ px: 1 }}>
            <Alert
              severity="error"
              action={
                <Button size="small" onClick={() => void self.refetch()}>
                  Thử lại
                </Button>
              }
            >
              Không thể tải hồ sơ cá nhân.
            </Alert>
          </Box>
        ) : patient ? (
          profileItems(patient, false)
        ) : (
          <MenuItem disabled>Chưa tạo hồ sơ cá nhân</MenuItem>
        )}
        {!patient && (
          <MenuItem
            onClick={() => openCreate("self")}
            disabled={self.isPending || self.isError}
            sx={{ gap: 1, color: "primary.main" }}
          >
            <AddIcon fontSize="small" />
            Tạo hồ sơ cá nhân
          </MenuItem>
        )}
        <Divider />
        <Typography
          variant="caption"
          sx={{ px: 2, py: 0.5, display: "block", fontWeight: 700 }}
        >
          HỒ SƠ NGƯỜI THÂN
        </Typography>
        <MenuItem
          onClick={() => openCreate("family")}
          sx={{ gap: 1, color: "primary.main" }}
        >
          <AddIcon fontSize="small" />
          Tạo hồ sơ người thân
        </MenuItem>
        {relatives.flatMap((item) => profileItems(item.patient, true))}
      </Menu>
      <PatientProfileDialog
        open={recipient !== null}
        recipient={recipient ?? "self"}
        defaultName={user?.fullName}
        onClose={() => setRecipient(null)}
        createProfile={recipient === "family" ? createFamily : createSelf}
        updateProfile={update}
      />
    </>
  );
}
