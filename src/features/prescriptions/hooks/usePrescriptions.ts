import { useQuery } from "@tanstack/react-query";
import { prescriptionsApi } from "@/api/endpoints/prescriptions.api";
import { queryKeys } from "@/api/queryKeys";
import { useStaffScope } from "@/features/shared/hooks/useStaffScope";

export function usePrescriptions(filters: {
  page: number;
  limit: number;
  issuedAt?: string;
}) {
  const { userId, enabled } = useStaffScope();
  return useQuery({
    queryKey: queryKeys.staff.resource("prescriptions", userId, filters),
    queryFn: () => prescriptionsApi.getPrescriptions(filters),
    enabled,
  });
}
export function usePrescriptionItems(prescriptionId?: string) {
  const { userId, enabled } = useStaffScope();
  return useQuery({
    queryKey: queryKeys.staff.resource("prescription-items", userId, {
      prescriptionId,
    }),
    queryFn: () => prescriptionsApi.getPrescriptionItems(prescriptionId!),
    enabled: enabled && !!prescriptionId,
  });
}
