import type { DoctorDegree } from '@/types';

// Helper for degree display name in Vietnamese
export const getDegreeLabel = (degree: DoctorDegree): string => {
  switch (degree) {
    case 'MD':
      return 'Bác sĩ Y khoa (BS.)';
    case 'MASTER':
      return 'Thạc sĩ Y học (ThS.BS)';
    case 'PHD':
      return 'Tiến sĩ Y học (TS.BS)';
    case 'ASSOCIATE_PROFESSOR':
      return 'Phó Giáo sư (PGS.TS.BS)';
    case 'PROFESSOR':
      return 'Giáo sư (GS.TS.BS)';
    default:
      return degree;
  }
};

