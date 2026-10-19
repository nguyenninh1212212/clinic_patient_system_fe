import { CreatePatientDto } from "@/types";
import { Gender } from "@/types/enum";
import { z } from "zod";

export const patientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ tên")
    .max(100, "Họ tên tối đa 100 ký tự"),

  dateOfBirth: z
    .string()
    .min(1, "Vui lòng chọn ngày sinh")
    .refine(
      (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(new Date(value).getTime()) &&
        new Date(value).toISOString().slice(0, 10) === value &&
        new Date(value).getTime() <= Date.now(),
      "Ngày sinh không hợp lệ hoặc nằm trong tương lai",
    ),

  gender: z.enum(Gender),

  phone: z.string().trim().max(20, "Số điện thoại tối đa 20 ký tự").optional(),

  address: z.string().trim().max(500, "Địa chỉ tối đa 500 ký tự").optional(),

  identityNumber: z.string().trim().max(20, "CCCD tối đa 20 ký tự").optional(),

  medicalHistory: z.string().trim().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export type PatientRecipient = "self" | "family";
