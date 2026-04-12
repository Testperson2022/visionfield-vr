/**
 * Settings Store — App-indstillinger (Zustand)
 *
 * Gemmes i localStorage. Inkluderer:
 * - CPR-sløring (vis/skjul CPR i patientliste)
 * - Lyd-feedback ved test-respons
 * - Andre klinik-præferencer
 */
import { create } from "zustand";

interface SettingsState {
  // Privacy
  maskCpr: boolean;          // Sløre CPR-numre i UI
  // Test
  soundOnResponse: boolean;  // Beep ved patient-respons
  soundVolume: number;       // 0-100
  // Display
  showPatientNumber: boolean; // Vis patient-nummer i liste
  // Actions
  setMaskCpr: (val: boolean) => void;
  setSoundOnResponse: (val: boolean) => void;
  setSoundVolume: (val: number) => void;
  setShowPatientNumber: (val: boolean) => void;
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem("vf_settings");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const saveSettings = (state: Partial<SettingsState>) => {
  const { maskCpr, soundOnResponse, soundVolume, showPatientNumber } = state as any;
  localStorage.setItem("vf_settings", JSON.stringify({ maskCpr, soundOnResponse, soundVolume, showPatientNumber }));
};

const defaults = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
  maskCpr: defaults.maskCpr ?? true,
  soundOnResponse: defaults.soundOnResponse ?? true,
  soundVolume: defaults.soundVolume ?? 50,
  showPatientNumber: defaults.showPatientNumber ?? true,

  setMaskCpr: (val) => set((s) => { const n = { ...s, maskCpr: val }; saveSettings(n); return n; }),
  setSoundOnResponse: (val) => set((s) => { const n = { ...s, soundOnResponse: val }; saveSettings(n); return n; }),
  setSoundVolume: (val) => set((s) => { const n = { ...s, soundVolume: val }; saveSettings(n); return n; }),
  setShowPatientNumber: (val) => set((s) => { const n = { ...s, showPatientNumber: val }; saveSettings(n); return n; }),
}));
