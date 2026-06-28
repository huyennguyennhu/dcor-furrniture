import { create } from 'zustand';

interface PlannerState {
  customImageBase64: string | null;
  setCustomImage: (base64: string | null) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  customImageBase64: null,
  setCustomImage: (base64) => set({ customImageBase64: base64 }),
}));
