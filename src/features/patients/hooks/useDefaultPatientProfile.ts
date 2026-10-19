import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setDefaultProfile } from '@/store/slices/profileSlice';
import type { AccessDTO, PatientDTO } from '@/types';

export function useDefaultPatientProfile(patient?: PatientDTO, accessible: AccessDTO[] = [], ready = true) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(state => state.auth.user?.id);
  const { defaultPatientId, activePatientId } = useAppSelector(state => state.profile);

  useEffect(() => {
    if (!ready || !userId || activePatientId || defaultPatientId) return;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(`PATIENT_PORTAL_DEFAULT_PROFILE:${userId}`);
    } catch {
      // Profile selection remains available when browser storage is disabled.
    }
    if (!saved) return;
    const profile = patient?.id === saved ? patient : accessible.find(item => item.patientId === saved)?.patient;
    if (profile) {
      dispatch(setDefaultProfile({
        patientId: profile.id,
        patientName: profile.fullName,
        patientCode: profile.patientCode,
        isRelative: profile.id !== patient?.id,
      }));
    }
  }, [ready, userId, patient, accessible, activePatientId, defaultPatientId, dispatch]);

  const chooseDefault = (profile: Pick<PatientDTO, 'id' | 'fullName' | 'patientCode'>, isRelative: boolean) => {
    if (!userId) return;
    try {
      window.localStorage.setItem(`PATIENT_PORTAL_DEFAULT_PROFILE:${userId}`, profile.id);
    } catch {
      // Keep the choice for the current session even if storage is disabled.
    }
    dispatch(setDefaultProfile({
      patientId: profile.id,
      patientName: profile.fullName,
      patientCode: profile.patientCode,
      isRelative,
    }));
  };

  return { defaultPatientId, chooseDefault };
}
