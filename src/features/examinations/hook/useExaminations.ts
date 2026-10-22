import { examinationsApi } from "@/api/endpoints/examinations.api";
import { useAppSelector } from "@/store";
import { useQuery } from "@tanstack/react-query";

export function useExaminations(
  filters: { patientId: string; page?: number; limit?: number },
  enabled = true,
) {
  const userId = useAppSelector((state) => state.auth.user?.id ?? "");
  return useQuery({
    queryKey: ["patient-portal", userId, filters.patientId, "examinations"],
    queryFn: () => examinationsApi.getAllExaminations(filters),
    enabled: enabled && !!filters.patientId,
  });
}
