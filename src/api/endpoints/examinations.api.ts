import { ApiResponse, ExaminationDTO } from "@/types";
import { apiClient } from "../axios";

export const examinationsApi = {
  getAllExaminations: (
    params: { patientId: string; page?: number; limit?: number },
  ): Promise<ApiResponse<ExaminationDTO[]>> =>
    apiClient
      .get<ApiResponse<ExaminationDTO[]>>("/examinations", { params })
      .then((r) => r.data),
};
