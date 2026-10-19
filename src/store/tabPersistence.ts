import type { AppTab } from './slices/uiSlice';

const storageKey = 'PATIENT_PORTAL_CURRENT_TAB';
const tabs: readonly AppTab[] = [
  'dashboard', 'profile', 'doctors', 'booking', 'appointments',
  'examinations', 'prescriptions', 'invoices', 'api-audit',
];

export function restoreCurrentTab(): AppTab {
  try {
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem(storageKey);
      if (tabs.includes(saved as AppTab)) return saved as AppTab;
    }
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
  return 'dashboard';
}

export function persistCurrentTab(tab: AppTab): void {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(storageKey, tab);
  } catch {
    // Navigation still works when storage is unavailable.
  }
}
