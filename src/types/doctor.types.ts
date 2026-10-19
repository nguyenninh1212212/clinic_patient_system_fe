export interface SpecialtyDTO {
  id: number;
  name: string;
  description?: string;
  iconUrl: string | null;
  isActive?: boolean;
}

export type DoctorDegree = 'MD' | 'MASTER' | 'PHD' | 'PROFESSOR' | 'ASSOCIATE_PROFESSOR';

export interface DoctorDTO {
  id: string;
  userId: string;
  specialtyId: number;
  licenseNumber?: string;
  bio?: string;
  degree: DoctorDegree;
  yearsOfExperience?: number;
  user: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  specialty: {
    id: number;
    name: string;
    iconUrl: string | null;
  };
}

export interface DoctorShiftDTO {
  id: string;
  doctorId: string;
  workDate: string;
  startTime: string;
  endTime: string;
}


export interface DoctorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  specialtyId?: number;
  degree?: DoctorDegree;
}

export interface SpecialtyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

