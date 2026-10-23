// This application is the patient portal only. Unknown and staff roles fail closed.
export const isPatientRole = (role?: string) => role === "USER";
// Legacy API guards still use this role predicate. It no longer grants access
// to any route or screen in this patient-only application.
export const isStaffRole = (role?: string) =>
  ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"].includes(role ?? "");

export const patientPages = {
  overview: "Tổng quan cá nhân",
  doctors: "Bác sĩ",
  booking: "Đặt lịch khám",
  profiles: "Hồ sơ được liên kết",
  appointments: "Lịch hẹn",
  examinations: "Kết quả khám",
  prescriptions: "Đơn thuốc",
  invoices: "Hóa đơn",
} as const;
export type PatientPage = keyof typeof patientPages;

export function resolveRoute(role: string | undefined, pathname: string) {
  if (isPatientRole(role)) {
    if (pathname === "/" || pathname === "/login")
      return { area: "redirect", path: "/patient" } as const;
    const match =
      /^\/patient(?:\/(overview|profiles|doctors|booking|appointments|examinations|prescriptions|invoices))?\/?$/.exec(
        pathname,
      );
    if (match)
      return {
        area: "patient",
        page: (match[1] ?? "overview") as PatientPage,
      } as const;
    return { area: "denied" } as const;
  }
  return { area: "denied" } as const;
}
