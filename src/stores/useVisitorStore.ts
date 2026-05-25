"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { randomVisitorName } from "@/lib/visitorNames";

type VisitorState = {
  /**
   * Display name shown in the chat. Picked once on first visit and pinned
   * for the lifetime of this browser (cached in localStorage under
   * `plantbot:visitor`). Empty string until rehydration so the UI can
   * render a placeholder instead of flashing the wrong name.
   */
  name: string;
  hydrated: boolean;

  /** Re-roll the visitor's display name (and persist it). */
  rerollName: () => void;
};

export const useVisitorStore = create<VisitorState>()(
  persist(
    (set) => ({
      name: "",
      hydrated: false,
      rerollName: () => set({ name: randomVisitorName() }),
    }),
    {
      name: "plantbot:visitor",
      storage: createJSONStorage(() => localStorage),
      // Only the name needs to survive reloads. `hydrated` is a UI-only
      // flag that should always start false on a fresh page load.
      partialize: (s) => ({ name: s.name }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Flip the gate immediately so consumers stop rendering the
        // placeholder.
        state.hydrated = true;
        // First-time visitor: mint a name and write it back through
        // setState so it actually lands in localStorage. Mutating the
        // rehydrated `state` directly would only update memory — the
        // persist middleware writes on `set()`, not on rehydration.
        if (!state.name) {
          useVisitorStore.setState({ name: randomVisitorName() });
        }
      },
    },
  ),
);
