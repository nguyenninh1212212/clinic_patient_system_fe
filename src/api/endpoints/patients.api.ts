import { apiClient } from "@/api/axios";
import {
  AccessDTO,
  ApiResponse,
  CreatePatientDto,
  PatientDTO,
  UpdatePatientDto,
} from "@/types/index";

export const patientsApi = {
  getMyPatient: (): Promise<ApiResponse<PatientDTO>> =>
    apiClient.get<ApiResponse<PatientDTO>>("/patients/me").then((r) => r.data),

  getMyAccessiblePatients: (): Promise<ApiResponse<AccessDTO[]>> =>
    apiClient
      .get<ApiResponse<AccessDTO[]>>("/user-patient-access/my-patients")
      .then((r) => r.data),

  create: (dto: CreatePatientDto): Promise<PatientDTO> =>
    apiClient.post("/patients", dto).then((r) => r.data.data),

  createMySelf: (dto: CreatePatientDto): Promise<PatientDTO> =>
    apiClient.post("/patients/me", dto).then((r) => r.data.data),

  update: (id: string, dto: UpdatePatientDto): Promise<PatientDTO> =>
    apiClient.put(`/patients/${id}`, dto).then((r) => r.data.data),

  updateMySelf: (dto: UpdatePatientDto): Promise<PatientDTO> =>
    apiClient.put(`/patients/me`, dto).then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/patients/${id}`).then((r) => r.data),
};
