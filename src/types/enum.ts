// src/types/enums.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MANAGER = 'MANAGER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  STAFF = 'STAFF',
  GUEST = 'GUEST',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WAITING_TRIAGE = 'WAITING_TRIAGE',
  TRIAGED = 'TRIAGED',
  IN_EXAMINATION = 'IN_EXAMINATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum DoctorDegree {
  MD = 'MD',
  MASTER = 'MASTER',
  PHD = 'PHD',
  PROFESSOR = 'PROFESSOR',
  ASSOCIATE_PROFESSOR = 'ASSOCIATE_PROFESSOR',
}

export enum MedicineCategory {
  ANTIBIOTIC = 'ANTIBIOTIC',
  ANALGESIC = 'ANALGESIC',
  ANTIPYRETIC = 'ANTIPYRETIC',
  ANTIVIRAL = 'ANTIVIRAL',
  ANTIFUNGAL = 'ANTIFUNGAL',
  SUPPLEMENT = 'SUPPLEMENT',
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  DERMATOLOGY = 'DERMATOLOGY',
  GASTROINTESTINAL = 'GASTROINTESTINAL',
  RESPIRATORY = 'RESPIRATORY',
  OTHER = 'OTHER',
}

export enum StockTransactionType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRED = 'EXPIRED',
  RETURN = 'RETURN',
}

export enum TriageLevel {
  LEVEL_1 = 'LEVEL_1', // Nguy kịch — cấp cứu ngay
  LEVEL_2 = 'LEVEL_2', // Nặng
  LEVEL_3 = 'LEVEL_3', // Trung bình
  LEVEL_4 = 'LEVEL_4', // Nhẹ
  LEVEL_5 = 'LEVEL_5', // Không cấp bách
}

export enum PositionLevel {
  INTERN = 'INTERN',
  STAFF = 'STAFF',
  LEADER = 'LEADER',
  DEPUTY = 'DEPUTY',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
}

export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export enum ResourceType {
  TIMESHEET = 'TIMESHEET',
  PRODUCTION = 'PRODUCTION',
  DOCUMENT = 'DOCUMENT',
}