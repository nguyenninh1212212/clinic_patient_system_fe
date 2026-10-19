import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DoctorDTO } from '@/types/index';
import { logoutAction, setCredentials, loginAsDemo, setUser } from '@/store/slices/authSlice';

interface ProfileState {
  defaultPatientId: string | null;
  activePatientId: string | null;
  activePatientName: string | null;
  activePatientCode: string | null;
  isRelative: boolean;
  selectedDoctorForBooking: DoctorDTO | null;
}

const initialState: ProfileState = {
  defaultPatientId: null,
  activePatientId: null,
  activePatientName: null,
  activePatientCode: null,
  isRelative: false,
  selectedDoctorForBooking: null,
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  extraReducers: builder => {
    builder.addCase(logoutAction, () => initialState)
      .addCase(setCredentials, () => initialState)
      .addCase(loginAsDemo, () => initialState)
      .addCase(setUser, () => initialState);
  },
  reducers: {
    setActiveProfile: (
      state,
      action: PayloadAction<{
        patientId: string;
        patientName: string;
        patientCode?: string;
        isRelative: boolean;
      }>
    ) => {
      state.activePatientId = action.payload.patientId;
      state.activePatientName = action.payload.patientName;
      state.activePatientCode = action.payload.patientCode || null;
      state.isRelative = action.payload.isRelative;
    },
    setDefaultProfile: (
      state,
      action: PayloadAction<{
        patientId: string;
        patientName: string;
        patientCode?: string;
        isRelative: boolean;
      }>
    ) => {
      state.defaultPatientId = action.payload.patientId;
      state.activePatientId = action.payload.patientId;
      state.activePatientName = action.payload.patientName;
      state.activePatientCode = action.payload.patientCode || null;
      state.isRelative = action.payload.isRelative;
    },
    clearActiveProfile: (state) => {
      state.activePatientId = null;
      state.activePatientName = null;
      state.activePatientCode = null;
      state.isRelative = false;
    },
    setSelectedDoctorForBooking: (
      state,
      action: PayloadAction<DoctorDTO | null>
    ) => {
      state.selectedDoctorForBooking = action.payload;
    },
  },
});

export const {
  setActiveProfile,
  setDefaultProfile,
  clearActiveProfile,
  setSelectedDoctorForBooking,
} = profileSlice.actions;

export default profileSlice.reducer;
