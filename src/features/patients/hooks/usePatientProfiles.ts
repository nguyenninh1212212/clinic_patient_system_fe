import { isAxiosError } from "axios";
import type { CreatePatientDto, UpdatePatientDto } from "@/types/patient.types";
import { useAppDispatch, useAppSelector } from "@/store/index";
import { showRealtimeToast } from "@/store/slices/uiSlice";
import { useCachedMutation } from "@/features/shared/hooks/useCachedMutation";
import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/api/endpoints/patients.api";
import { queryKeys } from "@/api/queryKeys";

export function useMyPatient() {
  const { user, isAuthenticated: enabled } = useAppSelector(
    (state) => state.auth,
  );
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: queryKeys.staff.resource("patient", userId),
    queryFn: async () => {
      try {
        return await patientsApi.getMyPatient();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled,
  });
}
export function useAccessiblePatients() {
  const { user, isAuthenticated: enabled } = useAppSelector(
    (state) => state.auth,
  );
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: queryKeys.staff.resource("user-patient-access", userId),
    queryFn: patientsApi.getMyAccessiblePatients,
    enabled,
  });
}
function usePatientMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  message: string,
) {
  const dispatch = useAppDispatch();
  return useCachedMutation(
    mutationFn,
    async (client, userId) => {
      await client.invalidateQueries({
        predicate: (query) => {
          const [resource, scope, account] = query.queryKey;
          if (resource === "patient-portal") return scope === userId;
          if (
            !["patient", "patients", "user-patient-access"].includes(
              String(resource),
            )
          )
            return false;
          return scope !== "staff" || account === userId;
        },
      });
    },
    {
      onError: (error) => {
        const message =
          isAxiosError(error) &&
          typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : "Không thể lưu hồ sơ. Vui lòng thử lại.";
        dispatch(
          showRealtimeToast({ title: "Thông báo", message, type: "SYSTEM" }),
        );
      },
      onSuccess: () =>
        dispatch(
          showRealtimeToast({ title: "Thông báo", message, type: "SYSTEM" }),
        ),
    },
  );
}

export function useCreatePatient() {
  return usePatientMutation(
    (dto: CreatePatientDto) => patientsApi.create(dto),
    "Thêm bệnh nhân thành công",
  );
}

export function useCreatePatientForMySelf() {
  return usePatientMutation(
    (dto: CreatePatientDto) => patientsApi.createMySelf(dto),
    "Thêm bệnh nhân thành công",
  );
}
export function useUpdatePatientForMySelf() {
  return usePatientMutation(
    ({ id, dto }: { id: string; dto: UpdatePatientDto }) =>
      patientsApi.updateMySelf(dto),
    "Cập nhật hồ sơ cá nhân thành công",
  );
}

export function useUpdatePatient() {
  return usePatientMutation(
    ({ id, dto }: { id: string; dto: UpdatePatientDto }) =>
      patientsApi.update(id, dto),
    "Cập nhật hồ sơ bệnh nhân thành công",
  );
}

export function useDeletePatient() {
  return usePatientMutation(
    (id: string) => patientsApi.remove(id),
    "Đã xóa hồ sơ bệnh nhân",
  );
}
