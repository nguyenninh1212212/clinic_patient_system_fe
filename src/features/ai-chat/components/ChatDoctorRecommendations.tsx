import { Alert, Avatar, Box, Button, Stack, Typography } from "@mui/material";
import type { ChatResponse } from "@/api/endpoints/ai-chat.api";
import type { DoctorDTO } from "@/types";
import { getDegreeLabel } from "@/features/documentation/doctors/doctorLabels";

type Props = {
  recommendation: NonNullable<ChatResponse["booking_recommendation"]>;
  onSelect: (doctor: DoctorDTO) => void;
  onViewDoctors: () => void;
};

export function ChatDoctorRecommendations({
  recommendation,
  onSelect,
  onViewDoctors,
}: Props) {
  return (
    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
      <Alert
        severity={recommendation.status === "suggested" ? "success" : "info"}
      >
        {recommendation.message}
      </Alert>
      {recommendation.doctors.slice(0, 3).map((doctor) => (
        <Box
          key={doctor.id}
          sx={{
            p: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Avatar
              src={doctor.user.avatar || undefined}
              alt={doctor.user.fullName}
            >
              {doctor.user.fullName.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {doctor.user.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getDegreeLabel(doctor.degree)}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Khoa: {doctor.specialty.name}
          </Typography>
          {!!doctor.yearsOfExperience && (
            <Typography variant="caption" color="text.secondary">
              {doctor.yearsOfExperience} năm kinh nghiệm
            </Typography>
          )}
          <Button
            fullWidth
            size="small"
            variant="contained"
            sx={{ mt: 1 }}
            onClick={() => onSelect(doctor)}
          >
            Chọn bác sĩ · Đặt lịch
          </Button>
        </Box>
      ))}
      {recommendation.status !== "suggested" && (
        <Button size="small" onClick={onViewDoctors}>
          Xem danh mục bác sĩ
        </Button>
      )}
    </Stack>
  );
}
