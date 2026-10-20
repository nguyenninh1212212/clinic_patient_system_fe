import type { AppTab } from "@/store/slices/uiSlice";

// Confirmed against backend core/enums/commom.enum.ts. Unknown roles fail closed.
export const isPatientRole = (role?: string) => role === "USER";
export const isStaffRole = (role?: string) =>
  ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"].includes(role ?? "");

export const patientPages = {
  overview: "Tổng quan cá nhân",
  doctors: "Bác sĩ",
  booking: "Đặt lịch khám",
  "api-audit": "Trạng thái API & Kết nối",
  profiles: "Hồ sơ được liên kết",
  appointments: "Lịch hẹn",
  examinations: "Kết quả khám",
  prescriptions: "Đơn thuốc",
  invoices: "Hóa đơn",
} as const;
export type PatientPage = keyof typeof patientPages;

export function resolveRoute(role: string | undefined, pathname: string) {
  if (isPatientRole(role)) {
    if (pathname === "/")
      return { area: "redirect", path: "/patient" } as const;
    const match =
      /^\/patient(?:\/(overview|profiles|doctors|booking|appointments|examinations|prescriptions|invoices|api-audit))?\/?$/.exec(
        pathname,
      );
    if (match)
      return {
        area: "patient",
        page: (match[1] ?? "overview") as PatientPage,
      } as const;
    return { area: "denied" } as const;
  }
  if (isStaffRole(role)) {
    if (pathname.startsWith("/patient")) return { area: "denied" } as const;
    const match =
      /^\/(dashboard|profile|doctors|booking|appointments|examinations|prescriptions|invoices|api-audit)?\/?$/.exec(
        pathname,
      );
    if (match)
      return {
        area: "staff",
        tab: (match[1] ?? "dashboard") as AppTab,
      } as const;
  }
  return { area: "denied" } as const;
}
