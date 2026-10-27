import { apiClient } from "@/api/axios";
import type { ApiResponse } from "@/types/common.types";

import type { DoctorDTO, SpecialtyDTO } from "@/types";

export interface ChatResponse {
  booking_recommendation?: {
    status: "suggested" | "no_specialty" | "no_doctors" | "unavailable";
    message: string;
    specialty: Pick<SpecialtyDTO, "id" | "name" | "iconUrl"> | null;
    doctors: DoctorDTO[];
  } | null;
  conversation_id: string;
  status: string;
  message: string;
  symptoms: string[];
  finished: boolean;
  llm_used: boolean;
  warning?: string | null;
  department_triage?: {
    suggested_department: string | null;
    score: number;
    status: "suggested" | "ambiguous" | "insufficient_evidence";
    departments: { department: string; score: number; diseases: string[] }[];
  } | null;
}

export const aiChatApi = {
  async send(message: string, conversationId: string): Promise<ChatResponse> {
    const { data } = await apiClient.post<ApiResponse<ChatResponse>>(
      "/ai/chat",
      {
        message,
        conversation_id: conversationId,
      },
      { timeout: 75000 },
    );
    if (!data.data) throw new Error("Phản hồi của trợ lý không hợp lệ.");
    return data.data;
  },
  async reset(conversationId: string): Promise<void> {
    await apiClient.delete(`/ai/chat/${encodeURIComponent(conversationId)}`, {
      timeout: 75000,
    });
  },
};
