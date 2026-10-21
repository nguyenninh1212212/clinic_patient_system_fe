import { normalizePatientAccess } from './patient-access.api';
import { apiClient } from "@/api/axios";
import {
  AccessDTO,
  ApiResponse,
  CreatePatientDto,
  PatientDTO,
  PatientProfileRequestDTO,
  UpdatePatientDto,
} from "@/types/index";

export const patientsApi = {
  getMyPatient: (): Promise<PatientDTO> =>
    apiClient.get("/patients/me").then((r) => r.data.data),

  getMyAccessiblePatients: (): Promise<ApiResponse<AccessDTO[]>> =>
    apiClient
      .get<ApiResponse<AccessDTO[]>>("/patient-profile-access/my-patients")
      .then((r) => ({ ...r.data, data: (r.data.data ?? []).map(normalizePatientAccess) })),

  create: (dto: CreatePatientDto): Promise<PatientProfileRequestDTO> =>
    apiClient.post("/patients/profile-requests", dto).then((r) => r.data.data),

  createMySelf: (dto: CreatePatientDto): Promise<PatientProfileRequestDTO> =>
    apiClient.post("/patients/me", dto).then((r) => r.data.data),

  update: (id: string, dto: UpdatePatientDto): Promise<PatientDTO> =>
    apiClient.put(`/patients/${id}`, dto).then((r) => r.data.data),

  updateMySelf: (dto: UpdatePatientDto): Promise<PatientDTO> =>
    apiClient.put(`/patients/me`, dto).then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/patients/${id}`).then((r) => r.data),
};
