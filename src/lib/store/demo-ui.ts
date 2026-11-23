import { create } from "zustand";

/**
 * Visibility of the demo tools (role switcher, reset, guided scenarios).
 * Deliberately not persisted: every fresh page load starts with the demo hidden, and the state
 * survives client-side navigation so a presenter can move between screens with it open.
 */
interface DemoUiState {
  visible: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
}

export const useDemoUi = create<DemoUiState>()((set) => ({
  visible: false,
  toggle: () => set((s) => ({ visible: !s.visible })),
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
