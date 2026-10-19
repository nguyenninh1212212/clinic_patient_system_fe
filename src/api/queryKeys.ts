export const queryKeys = {
  staff: {
    resource: (resource: string, userId: string, filters: object = {}) =>
      [resource, "staff", userId, filters] as const,
    invoices: (
      userId: string,
      filters: { page: number; limit: number; patientId?: string },
    ) => ["invoices", "staff", userId, filters] as const,
  },
  patient: {
    root: (userId: string) => ["patient-portal", userId] as const,
    profiles: (userId: string) =>
      ["patient-portal", userId, "my-patients"] as const,
    access: (userId: string, patientId: string) =>
      ["patient-portal", userId, patientId, "access"] as const,
    records: (
      userId: string,
      patientId: string,
      resource: string,
      filters: { page: number; limit: number; search?: string },
    ) => ["patient-portal", userId, patientId, resource, filters] as const,
  },
};
